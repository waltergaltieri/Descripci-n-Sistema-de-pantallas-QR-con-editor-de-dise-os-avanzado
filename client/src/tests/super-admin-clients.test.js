import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

jest.mock('../services/api', () => ({
  __esModule: true,
  superAdminService: {
    getDashboard: jest.fn(),
    getClients: jest.fn(),
    getClientById: jest.fn(),
    createClient: jest.fn(),
    markPayment: jest.fn(),
    updateAccessStatus: jest.fn(),
    updateClient: jest.fn(),
    resetClientPassword: jest.fn()
  }
}));

import SuperAdminDashboard from '../components/SuperAdmin/SuperAdminDashboard';
import ClientsManager from '../components/SuperAdmin/ClientsManager';
import ClientDetail from '../components/SuperAdmin/ClientDetail';
import { superAdminService } from '../services/api';

jest.setTimeout(30000);

describe('Super Admin UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dashboard muestra los contadores del backend', async () => {
    superAdminService.getDashboard.mockResolvedValue({
      data: {
        metrics: {
          activeClients: 4,
          suspendedClients: 1,
          inactiveClients: 2,
          dueSoonClients: 3,
          overdueClients: 1
        }
      }
    });

    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('clients manager filtra clientes y crea un nuevo cliente', async () => {
    const user = userEvent.setup();

    superAdminService.getClients
      .mockResolvedValueOnce({
        data: [
          {
            id: 8,
            name: 'Cafe Central',
            owner: { email: 'owner@cafecentral.com' },
            contactPerson: 'Ana',
            contactPhone: '123',
            accessStatus: 'active',
            commercialStatus: 'due_soon',
            billingAmount: 2500,
            nextDueDate: '2099-04-04'
          }
        ]
      })
      .mockResolvedValueOnce({
        data: []
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 10,
            name: 'Nuevo Cliente',
            owner: { email: 'owner@nuevo.com' },
            contactPerson: 'Nuevo',
            contactPhone: '999',
            accessStatus: 'active',
            commercialStatus: 'current',
            billingAmount: 3000,
            nextDueDate: '2099-05-01'
          }
        ]
      });

    superAdminService.createClient.mockResolvedValue({
      data: { client: { id: 10 } }
    });

    render(
      <MemoryRouter initialEntries={['/super-admin/clients?compose=1']}>
        <ClientsManager />
      </MemoryRouter>
    );

    expect(await screen.findByText('Cafe Central')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Vencen pronto' }));

    await waitFor(() => {
      expect(superAdminService.getClients).toHaveBeenCalledWith({
        commercialStatus: 'due_soon'
      });
    });

    fireEvent.change(screen.getByLabelText('Negocio'), { target: { value: 'Nuevo Cliente' } });
    fireEvent.change(screen.getByLabelText('Correo del owner'), { target: { value: 'owner@nuevo.com' } });
    fireEvent.change(screen.getByLabelText('Contrasena inicial'), { target: { value: 'Clave123456' } });
    fireEvent.change(screen.getByLabelText('Primer pago'), { target: { value: '2099-05-01' } });
    fireEvent.change(screen.getByLabelText('Monto mensual'), { target: { value: '3000' } });

    await user.click(screen.getByRole('button', { name: 'Crear cliente' }));

    await waitFor(() => {
      expect(superAdminService.createClient).toHaveBeenCalled();
    });
  });

  test('client detail permite suspender y marcar pago', async () => {
    const user = userEvent.setup();

    superAdminService.getClientById.mockResolvedValue({
      data: {
        client: {
          id: 12,
          name: 'Rotiseria Sol',
          accessStatus: 'active',
          commercialStatus: 'due_soon',
          contactPerson: 'Sofia',
          contactPhone: '789',
          contactEmail: 'sofia@rotisol.com',
          address: 'Calle 456',
          owner: { fullName: 'Sofia', email: 'owner@rotisol.com' },
          billing: {
            billingAmount: 4500,
            nextDueDate: '2099-04-10',
            lastPaymentMarkedAt: '2099-03-10T12:00:00Z'
          },
          events: []
        }
      }
    });

    superAdminService.updateAccessStatus.mockResolvedValue({
      data: { client: { accessStatus: 'suspended' } }
    });

    superAdminService.markPayment.mockResolvedValue({
      data: {
        client: {
          billing: {
            nextDueDate: '2099-05-10'
          }
        }
      }
    });

    render(
      <MemoryRouter initialEntries={['/super-admin/clients/12']}>
        <Routes>
          <Route path="/super-admin/clients/:id" element={<ClientDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Rotiseria Sol')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'suspended' }));

    await waitFor(() => {
      expect(superAdminService.updateAccessStatus).toHaveBeenCalledWith('12', {
        accessStatus: 'suspended'
      });
    });

    fireEvent.change(screen.getByLabelText('Monto'), { target: { value: '4500' } });
    await user.type(screen.getByLabelText('Nota'), 'Pago abril');
    await user.click(screen.getByRole('button', { name: 'Marcar pago' }));

    await waitFor(() => {
      expect(superAdminService.markPayment).toHaveBeenCalledWith(
        '12',
        expect.objectContaining({
          amount: 4500,
          notes: 'Pago abril'
        })
      );
    });
  });

  test('client detail permite editar datos del cliente y resetear password del owner', async () => {
    const user = userEvent.setup();

    superAdminService.getClientById.mockResolvedValue({
      data: {
        client: {
          id: 12,
          name: 'Rotiseria Sol',
          accessStatus: 'active',
          commercialStatus: 'current',
          contactPerson: 'Sofia',
          contactPhone: '789',
          contactEmail: 'sofia@rotisol.com',
          address: 'Calle 456',
          notes: 'nota original',
          owner: { fullName: 'Sofia', email: 'owner@rotisol.com' },
          billing: {
            billingAmount: 4500,
            nextDueDate: '2099-04-10',
            lastPaymentMarkedAt: '2099-03-10T12:00:00Z'
          },
          events: []
        }
      }
    });

    superAdminService.updateClient.mockResolvedValue({
      data: {
        client: {
          id: 12
        }
      }
    });

    superAdminService.resetClientPassword.mockResolvedValue({
      data: { success: true }
    });

    render(
      <MemoryRouter initialEntries={['/super-admin/clients/12']}>
        <Routes>
          <Route path="/super-admin/clients/:id" element={<ClientDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Rotiseria Sol')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Negocio'), { target: { value: 'Rotiseria Sol 2' } });
    fireEvent.change(screen.getByLabelText('Direccion'), { target: { value: 'Calle 789' } });
    fireEvent.change(screen.getByLabelText('Telefono'), { target: { value: '111' } });
    fireEvent.change(screen.getByLabelText('Correo comercial'), { target: { value: 'nuevo@rotisol.com' } });
    fireEvent.change(screen.getByLabelText('Nombre del owner'), { target: { value: 'Sofia Admin' } });
    fireEvent.change(screen.getByLabelText('Correo del owner'), { target: { value: 'owner+new@rotisol.com' } });
    fireEvent.change(screen.getByLabelText('Notas del cliente'), { target: { value: 'cliente editado' } });

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => {
      expect(superAdminService.updateClient).toHaveBeenCalledWith('12', {
        name: 'Rotiseria Sol 2',
        address: 'Calle 789',
        contactPhone: '111',
        contactPerson: 'Sofia',
        contactEmail: 'nuevo@rotisol.com',
        ownerFullName: 'Sofia Admin',
        ownerEmail: 'owner+new@rotisol.com',
        notes: 'cliente editado'
      });
    });

    fireEvent.change(screen.getByLabelText('Nueva contrasena del owner'), {
      target: { value: 'NuevaClave12345' }
    });
    fireEvent.change(screen.getByLabelText('Nota de reseteo'), {
      target: { value: 'Reset por soporte' }
    });

    await user.click(screen.getByRole('button', { name: 'Resetear contrasena' }));

    await waitFor(() => {
      expect(superAdminService.resetClientPassword).toHaveBeenCalledWith('12', {
        password: 'NuevaClave12345',
        notes: 'Reset por soporte'
      });
    });
  });
});
