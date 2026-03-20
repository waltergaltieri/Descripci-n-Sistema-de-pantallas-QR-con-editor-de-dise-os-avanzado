import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LinksManager from '../components/Carteleria/LinksManager';

jest.setTimeout(15000);

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,qr-preview'),
  toString: jest.fn().mockResolvedValue('<svg>qr</svg>')
}), { virtual: true });

jest.mock('../services/api', () => ({
  carteleriaService: {
    getDashboardMetrics: jest.fn(),
    getMenus: jest.fn(),
    getPersistentLinks: jest.fn(),
    getPersistentLinkById: jest.fn(),
    createPersistentLink: jest.fn(),
    updatePersistentLink: jest.fn()
  },
  uploadsService: {
    uploadImage: jest.fn()
  },
  getFileUrl: jest.fn((url) => url),
  handleApiError: jest.fn((error) => ({
    message: error?.message || 'Error'
  }))
}));

const { carteleriaService, uploadsService } = require('../services/api');
const QRCode = require('qrcode');

describe('Links persistentes y QR en Carteleria', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    carteleriaService.getDashboardMetrics.mockResolvedValue({
      data: {
        activeLinks: 2,
        activeMenus: 3
      }
    });

    carteleriaService.getMenus.mockResolvedValue({
      data: {
        data: [
          { id: 1, name: 'Desayunos', status: 'active' },
          { id: 2, name: 'Almuerzos', status: 'active' }
        ],
        pagination: {
          page: 1,
          limit: 100,
          total: 2,
          totalPages: 1
        }
      }
    });

    carteleriaService.getPersistentLinks.mockResolvedValue({
      data: {
        data: [
          {
            id: 50,
            name: 'QR salon',
            description: 'Menu general del local',
            slug: 'qr-salon',
            status: 'active',
            default_menu_name: 'Desayunos',
            rules_count: 1
          }
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 1,
          totalPages: 1
        }
      }
    });

    carteleriaService.createPersistentLink.mockResolvedValue({
      data: { id: 200, slug: 'qr-mostrador' }
    });

    carteleriaService.updatePersistentLink.mockResolvedValue({
      data: { id: 50, status: 'paused' }
    });

    uploadsService.uploadImage.mockResolvedValue({
      data: { id: 501, url: '/uploads/qr-logo.png' }
    });
  });

  test('carga links persistentes y permite abrir el formulario', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LinksManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('QR salon')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Nuevo link o QR' }));

    expect(await screen.findByText('Configuracion del QR')).toBeInTheDocument();
    expect(screen.getByLabelText('Menu por defecto')).toBeInTheDocument();
  });

  test('permite crear un link persistente con menu por defecto', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LinksManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nuevo link o QR' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Nuevo link o QR' }));
    await user.type(screen.getByLabelText('Nombre del link'), 'QR mostrador');
    await user.type(screen.getByLabelText('Descripcion'), 'Muestra el menu principal');
    await user.selectOptions(screen.getByLabelText('Menu por defecto'), '1');

    await user.click(screen.getByRole('button', { name: 'Guardar link' }));

    await waitFor(() => {
      expect(carteleriaService.createPersistentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'QR mostrador',
          description: 'Muestra el menu principal',
          default_menu_id: '1',
          rules: []
        })
      );
    });
  });

  test('permite guardar reglas con fechas, subir logo del QR y no expone una URL manual', async () => {
    const user = userEvent.setup();
    const logoFile = new File(['qr'], 'qr-logo.png', { type: 'image/png' });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LinksManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nuevo link o QR' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Nuevo link o QR' }));
    await user.type(screen.getByLabelText('Nombre del link'), 'QR terraza');
    await user.click(screen.getByRole('button', { name: 'Agregar regla' }));
    await user.selectOptions(screen.getByLabelText('Menu por defecto'), '1');
    await user.selectOptions(screen.getByLabelText('Menu de la regla'), '2');
    await user.type(screen.getByLabelText('Fecha desde'), '2026-03-21');
    await user.type(screen.getByLabelText('Fecha hasta'), '2026-03-30');

    expect(screen.queryByLabelText(/Logo URL/i)).not.toBeInTheDocument();

    await user.upload(screen.getByLabelText('Logo QR'), logoFile);

    await waitFor(() => {
      expect(uploadsService.uploadImage).toHaveBeenCalled();
    });

    expect(screen.getByText('Logo cargado. Se centra dentro del QR.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar link' }));

    await waitFor(() => {
      expect(carteleriaService.createPersistentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'QR terraza',
          default_menu_id: '1',
          qr_config: expect.objectContaining({
            logo_url: '/uploads/qr-logo.png'
          }),
          rules: [
            expect.objectContaining({
              menu_id: '2',
              starts_on: '2026-03-21',
              ends_on: '2026-03-30'
            })
          ]
        })
      );
    });
  });

  test('permite guardar configuracion de QR con gradiente y pickers visuales', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LinksManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nuevo link o QR' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Nuevo link o QR' }));
    await user.type(screen.getByLabelText('Nombre del link'), 'QR noche');

    expect(screen.getByLabelText('Selector visual color principal')).toHaveAttribute('type', 'color');
    expect(screen.getByLabelText('Selector visual color de fondo')).toHaveAttribute('type', 'color');

    await waitFor(() => {
      expect(QRCode.toString).toHaveBeenCalled();
    });

    const callCountBeforeGradient = QRCode.toString.mock.calls.length;

    await user.click(screen.getByLabelText('Usar gradiente'));

    expect(screen.getByLabelText('Selector visual color inicial')).toHaveAttribute('type', 'color');
    expect(screen.getByLabelText('Selector visual color final')).toHaveAttribute('type', 'color');

    await user.clear(screen.getByLabelText('Color inicial'));
    await user.type(screen.getByLabelText('Color inicial'), '#111827');
    await user.clear(screen.getByLabelText('Color final'));
    await user.type(screen.getByLabelText('Color final'), '#f59e0b');

    await waitFor(() => {
      expect(QRCode.toString.mock.calls.length).toBeGreaterThan(callCountBeforeGradient);
    });

    expect(screen.getByRole('button', { name: 'Descargar JPG' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar link' }));

    await waitFor(() => {
      expect(carteleriaService.createPersistentLink).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'QR noche',
          qr_config: expect.objectContaining({
            use_gradient: true,
            gradient_start: '#111827',
            gradient_end: '#f59e0b'
          })
        })
      );
    });
  });

  test('permite pausar un link persistente desde el listado', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LinksManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pausar QR sal/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Pausar QR sal/i }));

    await waitFor(() => {
      expect(carteleriaService.updatePersistentLink).toHaveBeenCalledWith(
        50,
        expect.objectContaining({
          status: 'paused'
        })
      );
    });
  });
});
