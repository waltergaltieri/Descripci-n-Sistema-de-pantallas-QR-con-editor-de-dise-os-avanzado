import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('../components/Carteleria/ProductModal', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../services/api', () => ({
  carteleriaService: {},
  getFileUrl: jest.fn((url) => url),
  handleApiError: jest.fn((error) => ({
    message: error?.message || 'Error'
  }))
}));

const { ProductCard } = require('../components/Carteleria/ProductsManager');
const { getFileUrl } = require('../services/api');

describe('ProductCard', () => {
  test('muestra fallback cuando la imagen falla', () => {
    getFileUrl.mockReturnValue('http://example.com/cafe-tostado.png');

    render(
      <ProductCard
        onEdit={jest.fn()}
        product={{
          id: 11,
          name: 'Cafe tostado',
          description: 'Granos seleccionados',
          price: 3200,
          status: 'active',
          category_name: 'Bebidas',
          card_image_url: '/uploads/cafe-tostado.png'
        }}
      />
    );

    expect(getFileUrl).toHaveBeenCalledWith('/uploads/cafe-tostado.png');
    fireEvent.error(screen.getByRole('img', { name: 'Cafe tostado' }));

    expect(screen.getByText('Imagen no disponible')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Cafe tostado' })).not.toBeInTheDocument();
  });
});
