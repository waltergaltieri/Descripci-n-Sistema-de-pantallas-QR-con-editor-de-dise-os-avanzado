import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductsManager from '../components/Carteleria/ProductsManager';

jest.setTimeout(15000);

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

jest.mock('../services/api', () => ({
  carteleriaService: {
    getDashboardMetrics: jest.fn(),
    getCategories: jest.fn(),
    getProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    getProductById: jest.fn()
  },
  uploadsService: {
    uploadImage: jest.fn(),
    uploadImages: jest.fn()
  },
  getFileUrl: jest.fn((url) => url),
  handleApiError: jest.fn((error) => ({
    message: error?.message || 'Error'
  }))
}));

const { carteleriaService } = require('../services/api');

describe('Alta basica de productos en Carteleria', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    carteleriaService.getDashboardMetrics.mockResolvedValue({
      data: {
        totalProducts: 2,
        activeProducts: 2,
        pausedProducts: 0,
        soldOutProducts: 0
      }
    });

    carteleriaService.getCategories.mockResolvedValue({
      data: [{ id: 1, name: 'Bebidas', products_count: 2 }]
    });

    carteleriaService.getProducts.mockResolvedValue({
      data: {
        data: [
          {
            id: 11,
            name: 'Cafe tostado',
            description: 'Granos seleccionados',
            price: 3200,
            status: 'active',
            category_name: 'Bebidas',
            card_image_url: '/uploads/cafe-tostado.png'
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

    carteleriaService.createProduct.mockResolvedValue({
      data: {
        id: 500,
        name: 'Limonada',
        description: 'Con menta y jengibre',
        price: 4500.5,
        status: 'active',
        category_name: 'Bebidas'
      }
    });
  });

  test('permite abrir el modal y crear un producto nuevo con formato AR', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProductsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Nuevo producto' }));

    expect(screen.getByLabelText('Precio')).toHaveValue('');

    await user.type(screen.getByLabelText('Nombre'), 'Limonada');
    await user.type(screen.getByLabelText('Descripcion'), 'Con menta y jengibre');
    await user.type(screen.getByLabelText('Precio'), '4500,5');
    await user.selectOptions(screen.getByLabelText('Categoria'), '1');

    expect(screen.getByLabelText('Precio')).toHaveValue('4.500,5');

    await user.click(screen.getByRole('button', { name: 'Guardar producto' }));

    await waitFor(() => {
      expect(carteleriaService.createProduct).toHaveBeenCalledWith({
        name: 'Limonada',
        description: 'Con menta y jengibre',
        price: 4500.5,
        category_id: '1',
        status: 'active',
        primary_image_upload_id: null,
        gallery_upload_ids: []
      });
    });
  });

  test('mantiene miles al escribir precios grandes sin convertirlos en decimales', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ProductsManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nuevo producto' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Nuevo producto' }));
    await user.type(screen.getByLabelText('Precio'), '150000');

    expect(screen.getByLabelText('Precio')).toHaveValue('150.000');
  });

});
