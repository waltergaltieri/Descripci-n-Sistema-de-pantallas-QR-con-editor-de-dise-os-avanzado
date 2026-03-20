import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import RenderMenuPreview from '../components/Carteleria/Menus/renderMenuPreview';

describe('Vista previa del editor de menus', () => {
  test('usa colores contrastantes del tema y respeta el color del texto del separador', () => {
    render(
      <RenderMenuPreview
        themeKey="style-6"
        localName="Cafe Central"
        menuName="Menu nocturno"
        lookupData={{
          categoriesById: {
            10: { id: 10, name: 'Bebidas' }
          },
          productsById: {},
          promotionsById: {},
          combosById: {}
        }}
        blocks={[
          {
            id: 'header-fixed',
            block_type: 'header',
            title: 'Encabezado',
            content: 'Menu oscuro',
            sort_order: 0,
            config: {}
          },
          {
            id: 'category-1',
            block_type: 'category',
            title: 'Categoria',
            content: 'Bebidas destacadas',
            sort_order: 1,
            config: {
              category_id: '10'
            }
          },
          {
            id: 'separator-1',
            block_type: 'separator',
            title: 'Happy hour',
            content: 'De 18 a 20',
            text_color: '#f97316',
            background_type: 'solid',
            background_value: '#111827',
            sort_order: 2,
            config: {}
          }
        ]}
      />
    );

    expect(screen.getByText('Bebidas')).toHaveStyle({ color: '#e2e8f0' });
    expect(screen.getByText('Bebidas destacadas')).toHaveStyle({ color: '#cbd5e1' });
    expect(screen.getByText('Happy hour')).toHaveStyle({ color: '#f97316' });
    expect(screen.getByText('De 18 a 20')).toHaveStyle({ color: '#f97316' });
  });

  test('muestra estilos comerciales para promociones y combos en la preview', () => {
    render(
      <RenderMenuPreview
        themeKey="style-2"
        localName="Cafe Central"
        menuName="Menu promos"
        lookupData={{
          categoriesById: {},
          productsById: {},
          promotionsById: {
            20: {
              id: 20,
              name: 'Happy hour cafe',
              type: 'two_for_one',
              conditions_text: 'Solo hoy',
              has_countdown: false,
              target_product: {
                id: 1,
                name: 'Cafe latte',
                description: 'Con leche',
                price_cents: 2500
              }
            }
          },
          combosById: {
            30: {
              id: 30,
              name: 'Combo desayuno',
              description: 'Cafe con medialunas',
              combo_price_cents: 3300,
              has_countdown: true,
              ends_at: '2030-01-01T12:00:00.000Z'
            }
          }
        }}
        blocks={[
          {
            id: 'header-fixed',
            block_type: 'header',
            title: 'Encabezado',
            content: 'Promos en vivo',
            sort_order: 0,
            config: {}
          },
          {
            id: 'promotion-1',
            block_type: 'promotion',
            title: 'Promociones',
            content: 'Las mas pedidas',
            sort_order: 1,
            config: {
              promotion_id: '20',
              display_style: 'seal-offer'
            }
          },
          {
            id: 'combo-1',
            block_type: 'combo',
            title: 'Combos',
            content: 'Edicion especial',
            sort_order: 2,
            config: {
              combo_id: '30',
              display_style: 'combo-countdown'
            }
          }
        ]}
      />
    );

    expect(screen.getByText('Sello 2x1')).toBeInTheDocument();
    expect(screen.getByText('Combo contrarreloj')).toBeInTheDocument();
    expect(screen.getByText('Cafe latte')).toBeInTheDocument();
    expect(screen.getByText('Con leche')).toBeInTheDocument();
    expect(screen.getByText(/33,00/i)).toBeInTheDocument();
  });
});
