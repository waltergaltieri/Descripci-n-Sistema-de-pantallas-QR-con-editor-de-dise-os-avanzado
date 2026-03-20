import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CarteleriaDashboard from '../components/Carteleria/CarteleriaDashboard';
import ProductsManager from '../components/Carteleria/ProductsManager';

jest.mock('../services/api', () => ({
  carteleriaService: {
    getDashboardMetrics: jest.fn(),
    getBusinessProfile: jest.fn(),
    getCategories: jest.fn(),
    getProducts: jest.fn()
  },
  getFileUrl: jest.fn((url) => url)
}));

const { carteleriaService } = require('../services/api');

describe('Cartelería con datos reales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('el dashboard carga métricas y perfil del negocio', async () => {
    carteleriaService.getDashboardMetrics.mockResolvedValue({
      data: {
        totalProducts: 24,
        activeProducts: 18,
        pausedProducts: 4,
        soldOutProducts: 2,
        activePromotions: 5,
        activeCombos: 3,
        activeMenus: 7,
        activeLinks: 9,
        totalCategories: 6
      }
    });

    carteleriaService.getBusinessProfile.mockResolvedValue({
      data: {
        name: 'Bar del Puerto',
        timezone: 'America/Buenos_Aires'
      }
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <CarteleriaDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard de Cartelería')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('9')).toBeInTheDocument();
    });

    expect(screen.getByText(/Bar del Puerto/i)).toBeInTheDocument();
    expect(screen.getByText(/6 categorías activas/i)).toBeInTheDocument();
  });

  test('productos carga listado, categorías, filtros y paginación', async () => {
    const user = userEvent.setup();

    carteleriaService.getDashboardMetrics.mockResolvedValue({
      data: {
        totalProducts: 24,
        activeProducts: 18,
        pausedProducts: 4,
        soldOutProducts: 2
      }
    });

    carteleriaService.getCategories.mockResolvedValue({
      data: [
        { id: 1, name: 'Bebidas', products_count: 10 },
        { id: 2, name: 'Comidas', products_count: 14 }
      ]
    });

    carteleriaService.getProducts.mockResolvedValue({
      data: {
        data: [
          {
            id: 101,
            name: 'Café latte',
            description: 'Con leche cremada',
            price: 3200,
            status: 'active',
            category_name: 'Bebidas',
            primary_image_url: '/uploads/latte.jpg'
          },
          {
            id: 102,
            name: 'Tostado jamón y queso',
            description: 'Pan de campo',
            price: 5900,
            status: 'sold_out',
            category_name: 'Comidas',
            primary_image_url: null
          }
        ],
        pagination: {
          page: 1,
          limit: 12,
          total: 24,
          totalPages: 2
        }
      }
    });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProductsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Café latte')).toBeInTheDocument();
      expect(screen.getByText('Tostado jamón y queso')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Vista tarjetas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vista tabla' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filtrar por estado' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Filtrar por categoría' })).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Vista tabla' }));
    expect(screen.getByRole('table', { name: 'Listado de productos' })).toBeInTheDocument();

    expect(carteleriaService.getProducts).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      search: '',
      status: '',
      categoryId: ''
    });
  });
});
