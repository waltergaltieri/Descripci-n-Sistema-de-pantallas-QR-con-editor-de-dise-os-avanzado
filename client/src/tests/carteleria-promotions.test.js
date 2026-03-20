import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PromotionsManager from '../components/Carteleria/PromotionsManager';

jest.setTimeout(15000);

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

jest.mock('../services/api', () => ({
  carteleriaService: {
    getDashboardMetrics: jest.fn(),
    getProducts: jest.fn(),
    getPromotionMenus: jest.fn(),
    getPromotions: jest.fn(),
    getCombos: jest.fn(),
    getPromotionById: jest.fn(),
    getComboById: jest.fn(),
    createPromotion: jest.fn(),
    createCombo: jest.fn(),
    updatePromotion: jest.fn(),
    updateCombo: jest.fn()
  },
  uploadsService: {
    uploadImage: jest.fn()
  },
  handleApiError: jest.fn((error) => ({
    message: error?.message || 'Error'
  }))
}));

const { carteleriaService, uploadsService } = require('../services/api');

describe('Promociones y combos en Carteleria', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    carteleriaService.getDashboardMetrics.mockResolvedValue({
      data: {
        activePromotions: 2,
        activeCombos: 1
      }
    });

    carteleriaService.getProducts.mockResolvedValue({
      data: {
        data: [
          { id: 10, name: 'Cafe latte', status: 'active' },
          { id: 11, name: 'Tostado', status: 'active' }
        ],
        pagination: {
          page: 1,
          limit: 100,
          total: 2,
          totalPages: 1
        }
      }
    });

    carteleriaService.getPromotionMenus.mockResolvedValue({
      data: [{ id: 90, name: 'Desayunos', status: 'active' }]
    });

    carteleriaService.getPromotions.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Happy Hour Cafe',
            type: 'percentage_discount',
            status: 'active',
            target_product_name: 'Cafe latte',
            conditions_text: 'Solo de 18 a 20 hs',
            discount_percentage: 20
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

    carteleriaService.getCombos.mockResolvedValue({
      data: {
        data: [
          {
            id: 7,
            name: 'Combo Merienda',
            status: 'active',
            combo_price: 8900,
            items_summary: 'Cafe latte,Tostado',
            items_count: 2
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

    carteleriaService.createPromotion.mockResolvedValue({
      data: { id: 100 }
    });

    carteleriaService.getPromotionById.mockResolvedValue({
      data: {
        id: 1,
        name: 'Happy Hour Cafe',
        description: '',
        status: 'active',
        type: 'percentage_discount',
        target_product_id: 10,
        target_combo_id: null,
        trigger_product_id: null,
        discount_percentage: 20,
        minimum_spend_cents: null,
        conditions_text: 'Solo de 18 a 20 hs',
        has_countdown: 0,
        no_expiration: 1,
        starts_at: null,
        ends_at: null
      }
    });

    carteleriaService.updatePromotion.mockResolvedValue({
      data: { id: 1, status: 'paused' }
    });

    carteleriaService.createCombo.mockResolvedValue({
      data: { id: 7 }
    });

    uploadsService.uploadImage.mockResolvedValue({
      data: { id: 88, url: '/uploads/combo-desayuno.png' }
    });
  });

  test('carga promociones y combos en la misma pantalla', async () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Happy Hour Cafe')).toBeInTheDocument();
      expect(screen.getByText('Combo Merienda')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Vista tabla' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vista tarjetas' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filtrar por tipo' })).toBeInTheDocument();
  });

  test('permite crear una promocion basica', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva promoci/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva promoci/i }));
    await user.type(screen.getByLabelText('Nombre'), 'Promo Cafe 20%');
    await user.selectOptions(screen.getByLabelText('Producto'), '10');
    await user.selectOptions(screen.getByLabelText(/Tipo de promoci/i), 'percentage_discount');
    await user.clear(screen.getByLabelText('Descuento (%)'));
    await user.type(screen.getByLabelText('Descuento (%)'), '20');
    await user.type(screen.getByLabelText('Condiciones'), 'Solo de 18 a 20 hs');

    await user.click(screen.getByRole('button', { name: /Guardar promoci/i }));

    await waitFor(() => {
      expect(carteleriaService.createPromotion).toHaveBeenCalledWith({
        name: 'Promo Cafe 20%',
        type: 'percentage_discount',
        target_product_id: '10',
        target_combo_id: '',
        trigger_product_id: '',
        discount_percentage: 20,
        minimum_spend: '',
        description: '',
        status: 'active',
        conditions_text: 'Solo de 18 a 20 hs',
        has_countdown: false,
        starts_at: '',
        no_expiration: true,
        ends_at: ''
      });
    });
  });

  test('permite crear una promocion aplicada a un combo vigente', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva promoci/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva promoci/i }));
    await user.type(screen.getByLabelText('Nombre'), 'Promo combo merienda');
    await user.selectOptions(screen.getByLabelText('Aplicar a'), 'combo');
    await user.selectOptions(screen.getByLabelText('Combo'), '7');
    await user.selectOptions(screen.getByLabelText(/Tipo de promoci/i), 'percentage_discount');
    await user.clear(screen.getByLabelText('Descuento (%)'));
    await user.type(screen.getByLabelText('Descuento (%)'), '15');
    await user.type(screen.getByLabelText('Condiciones'), 'Solo esta semana');

    await user.click(screen.getByRole('button', { name: /Guardar promoci/i }));

    await waitFor(() => {
      expect(carteleriaService.createPromotion).toHaveBeenCalledWith({
        name: 'Promo combo merienda',
        type: 'percentage_discount',
        target_product_id: '',
        target_combo_id: '7',
        trigger_product_id: '',
        discount_percentage: 15,
        minimum_spend: '',
        description: '',
        status: 'active',
        conditions_text: 'Solo esta semana',
        has_countdown: false,
        starts_at: '',
        no_expiration: true,
        ends_at: ''
      });
    });
  });

  test('calcula vencimiento relativo en horas para una promocion', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva promoci/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva promoci/i }));
    await user.type(screen.getByLabelText('Nombre'), 'Promo relampago');
    await user.selectOptions(screen.getByLabelText('Producto'), '10');
    await user.selectOptions(screen.getByLabelText(/Tipo de promoci/i), 'percentage_discount');
    await user.clear(screen.getByLabelText('Descuento (%)'));
    await user.type(screen.getByLabelText('Descuento (%)'), '20');
    await user.type(screen.getByLabelText('Condiciones'), 'Solo por dos horas');
    await user.type(screen.getByLabelText('Inicia el'), '2030-01-02T10:00');
    await user.click(screen.getByLabelText('Sin vencimiento'));
    await user.selectOptions(screen.getByLabelText('Modo de vencimiento'), 'relative');
    await user.clear(screen.getByLabelText('Duracion'));
    await user.type(screen.getByLabelText('Duracion'), '2');
    await user.selectOptions(screen.getByLabelText('Unidad de duracion'), 'hours');

    await user.click(screen.getByRole('button', { name: /Guardar promoci/i }));

    await waitFor(() => {
      expect(carteleriaService.createPromotion).toHaveBeenCalledWith({
        name: 'Promo relampago',
        type: 'percentage_discount',
        target_product_id: '10',
        target_combo_id: '',
        trigger_product_id: '',
        discount_percentage: 20,
        minimum_spend: '',
        description: '',
        status: 'active',
        conditions_text: 'Solo por dos horas',
        has_countdown: false,
        starts_at: '2030-01-02T10:00',
        no_expiration: false,
        ends_at: '2030-01-02T12:00'
      });
    });
  });

  test('permite activar la cuenta regresiva y apaga sin vencimiento automaticamente', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva promoci/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva promoci/i }));
    await user.type(screen.getByLabelText('Nombre'), 'Promo countdown');
    await user.selectOptions(screen.getByLabelText('Producto'), '10');
    await user.selectOptions(screen.getByLabelText(/Tipo de promoci/i), 'percentage_discount');
    await user.clear(screen.getByLabelText('Descuento (%)'));
    await user.type(screen.getByLabelText('Descuento (%)'), '20');

    const noExpirationCheckbox = screen.getByLabelText('Sin vencimiento');
    const countdownCheckbox = screen.getByLabelText('Activar cuenta regresiva');

    expect(noExpirationCheckbox).toBeChecked();
    expect(countdownCheckbox).not.toBeDisabled();

    await user.click(countdownCheckbox);

    expect(countdownCheckbox).toBeChecked();
    expect(noExpirationCheckbox).not.toBeChecked();
  });

  test('permite editar y pausar una promocion existente', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar Happy Hour Cafe' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Editar Happy Hour Cafe' }));

    expect(await screen.findByDisplayValue('Happy Hour Cafe')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Estado'), 'paused');
    await user.click(screen.getByRole('button', { name: /Guardar promoci/i }));

    await waitFor(() => {
      expect(carteleriaService.updatePromotion).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          name: 'Happy Hour Cafe',
          status: 'paused',
          target_product_id: '10'
        })
      );
    });
  });

  test('permite crear un combo con imagen opcional', async () => {
    const user = userEvent.setup();
    const comboFile = new File(['combo'], 'combo.png', { type: 'image/png' });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva promoci/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva promoci/i }));
    await user.selectOptions(screen.getByLabelText('Tipo de alta'), 'combo');
    await user.type(screen.getByLabelText('Nombre'), 'Combo desayuno');
    await user.upload(screen.getByLabelText('Imagen del combo'), comboFile);

    await waitFor(() => {
      expect(uploadsService.uploadImage).toHaveBeenCalled();
    });

    expect(screen.getByLabelText('Buscar productos del combo')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Buscar productos del combo'), 'Cafe');
    await user.click(screen.getByRole('checkbox', { name: 'Cafe latte' }));
    await user.clear(screen.getByLabelText('Buscar productos del combo'));
    await user.type(screen.getByLabelText('Buscar productos del combo'), 'Tost');
    await user.click(screen.getByRole('checkbox', { name: 'Tostado' }));

    await user.type(screen.getByLabelText('Precio del combo'), '12.50');
    await user.selectOptions(screen.getByLabelText(/Men.* visibles/i), '90');
    await user.click(screen.getByRole('button', { name: 'Guardar combo' }));

    await waitFor(() => {
      expect(carteleriaService.createCombo).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Combo desayuno',
          image_upload_id: 88,
          product_ids: ['10', '11'],
          menu_ids: ['90']
        })
      );
    });
  });

  test('calcula vencimiento relativo en dias para un combo', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva promoci/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva promoci/i }));
    await user.selectOptions(screen.getByLabelText('Tipo de alta'), 'combo');
    await user.type(screen.getByLabelText('Nombre'), 'Combo fin de semana');
    await user.click(screen.getByRole('checkbox', { name: 'Cafe latte' }));
    await user.click(screen.getByRole('checkbox', { name: 'Tostado' }));
    await user.type(screen.getByLabelText('Precio del combo'), '18');
    await user.type(screen.getByLabelText('Inicia el'), '2030-01-04T09:30');
    await user.click(screen.getByLabelText('Sin vencimiento'));
    await user.selectOptions(screen.getByLabelText('Modo de vencimiento'), 'relative');
    await user.clear(screen.getByLabelText('Duracion'));
    await user.type(screen.getByLabelText('Duracion'), '2');
    await user.selectOptions(screen.getByLabelText('Unidad de duracion'), 'days');

    await user.click(screen.getByRole('button', { name: 'Guardar combo' }));

    await waitFor(() => {
      expect(carteleriaService.createCombo).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Combo fin de semana',
          starts_at: '2030-01-04T09:30',
          no_expiration: false,
          ends_at: '2030-01-06T09:30'
        })
      );
    });
  });

  test('permite activar la cuenta regresiva tambien en combos', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PromotionsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Nueva promoci/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Nueva promoci/i }));
    await user.selectOptions(screen.getByLabelText('Tipo de alta'), 'combo');
    await user.type(screen.getByLabelText('Nombre'), 'Combo countdown');
    await user.click(screen.getByRole('checkbox', { name: 'Cafe latte' }));
    await user.click(screen.getByRole('checkbox', { name: 'Tostado' }));
    await user.type(screen.getByLabelText('Precio del combo'), '25');

    const noExpirationCheckbox = screen.getByLabelText('Sin vencimiento');
    const countdownCheckbox = screen.getByLabelText('Activar cuenta regresiva');

    expect(noExpirationCheckbox).toBeChecked();
    expect(countdownCheckbox).not.toBeDisabled();

    await user.click(countdownCheckbox);

    expect(countdownCheckbox).toBeChecked();
    expect(noExpirationCheckbox).not.toBeChecked();

    await user.type(screen.getByLabelText('Inicia el'), '2030-01-04T09:30');
    await user.type(await screen.findByLabelText('Vence el'), '2030-01-04T12:30');
    await user.click(screen.getByRole('button', { name: 'Guardar combo' }));

    await waitFor(() => {
      expect(carteleriaService.createCombo).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Combo countdown',
          has_countdown: true,
          starts_at: '2030-01-04T09:30',
          no_expiration: false,
          ends_at: '2030-01-04T12:30'
        })
      );
    });
  });
});
