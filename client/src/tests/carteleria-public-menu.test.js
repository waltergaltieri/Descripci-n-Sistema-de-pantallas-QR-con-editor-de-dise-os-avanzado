import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PublicMenuPage from '../components/Carteleria/Public/PublicMenuPage';

jest.mock('../services/api', () => ({
  carteleriaService: {
    getPublicMenu: jest.fn()
  },
  handleApiError: jest.fn((error) => ({
    message: error?.message || 'Error'
  }))
}));

const { carteleriaService } = require('../services/api');

describe('Menu publico resuelto por link persistente', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    carteleriaService.getPublicMenu.mockResolvedValue({
      data: {
        link: {
          slug: 'qr-salon',
          source: 'schedule_rule'
        },
        menu: {
          id: 3,
          name: 'Menu desayuno',
          local_name: 'Cafe Central',
          theme_key: 'style-2'
        },
        blocks: [
          {
            id: 1,
            block_type: 'header',
            title: 'Menu desayuno',
            content: 'Sabores del dia'
          },
          {
            id: 2,
            block_type: 'category',
            title: 'Bebidas',
            content: 'Cafe latte, Capuccino'
          }
        ]
      }
    });
  });

  test('renderiza shell de busqueda y contenido resuelto', async () => {
    render(
      <MemoryRouter
        initialEntries={['/menu/qr-salon']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/menu/:slug" element={<PublicMenuPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText(/Buscar en el menu/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cafe Central')).toBeInTheDocument();
      expect(screen.getByText('Menu desayuno')).toBeInTheDocument();
      expect(screen.getByText('Bebidas')).toBeInTheDocument();
    });
  });

  test('muestra condiciones de promo sobre producto y cuenta regresiva en promociones activas', async () => {
    carteleriaService.getPublicMenu.mockResolvedValueOnce({
      data: {
        link: {
          slug: 'qr-promo',
          source: 'default_menu'
        },
        menu: {
          id: 5,
          name: 'Menu promos',
          local_name: 'Cafe Central',
          theme_key: 'style-2'
        },
        blocks: [
          {
            id: 1,
            block_type: 'header',
            title: 'Menu promos',
            content: 'Promos en tiempo real'
          },
          {
            id: 2,
            block_type: 'category',
            title: 'Bebidas',
            category: {
              id: 10,
              name: 'Bebidas'
            },
            items: [
              {
                id: 1,
                name: 'Cafe latte',
                description: 'Con leche',
                price_cents: 2500,
                promotions: [
                  {
                    id: 90,
                    name: 'Happy hour cafe',
                    conditions_text: 'Promo producto visible'
                  }
                ]
              }
            ]
          },
          {
            id: 3,
            block_type: 'promotion',
            title: 'Promociones',
            items: [
              {
                id: 90,
                name: 'Happy hour cafe',
                conditions_text: 'Cuenta regresiva promo',
                has_countdown: true,
                ends_at: '2030-01-01T12:00:00.000Z',
                target_product: {
                  id: 1,
                  name: 'Cafe latte',
                  description: 'Con leche',
                  price_cents: 2500,
                  promotions: []
                }
              }
            ],
            item: {
              id: 90,
              name: 'Happy hour cafe',
              conditions_text: 'Cuenta regresiva promo',
              has_countdown: true,
              ends_at: '2030-01-01T12:00:00.000Z',
              target_product: {
                id: 1,
                name: 'Cafe latte',
                description: 'Con leche',
                price_cents: 2500,
                promotions: []
              }
            }
          }
        ]
      }
    });

    render(
      <MemoryRouter
        initialEntries={['/menu/qr-promo']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/menu/:slug" element={<PublicMenuPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Promo producto visible')).toBeInTheDocument();
      expect(screen.getByText(/Termina en/i)).toBeInTheDocument();
    });
  });

  test('renderiza una promocion que apunta a un combo activo', async () => {
    carteleriaService.getPublicMenu.mockResolvedValueOnce({
      data: {
        link: {
          slug: 'qr-combo-promo',
          source: 'default_menu'
        },
        menu: {
          id: 8,
          name: 'Menu combos',
          local_name: 'Cafe Central',
          theme_key: 'style-2'
        },
        blocks: [
          {
            id: 1,
            block_type: 'header',
            title: 'Menu combos',
            content: 'Promos y combos en vivo'
          },
          {
            id: 2,
            block_type: 'promotion',
            title: 'Promociones',
            items: [
              {
                id: 91,
                name: 'Promo combo desayuno',
                conditions_text: 'Solo sabados',
                has_countdown: false,
                target_combo: {
                  id: 9,
                  name: 'Combo desayuno',
                  description: 'Cafe con medialunas',
                  combo_price_cents: 3300,
                  items: [
                    {
                      id: 1,
                      name: 'Cafe latte',
                      description: 'Con leche',
                      price_cents: 2500
                    },
                    {
                      id: 2,
                      name: 'Medialuna',
                      description: 'Manteca',
                      price_cents: 800
                    }
                  ]
                }
              }
            ],
            item: {
              id: 91,
              name: 'Promo combo desayuno',
              conditions_text: 'Solo sabados',
              has_countdown: false,
              target_combo: {
                id: 9,
                name: 'Combo desayuno',
                description: 'Cafe con medialunas',
                combo_price_cents: 3300,
                items: [
                  {
                    id: 1,
                    name: 'Cafe latte',
                    description: 'Con leche',
                    price_cents: 2500
                  },
                  {
                    id: 2,
                    name: 'Medialuna',
                    description: 'Manteca',
                    price_cents: 800
                  }
                ]
              }
            }
          }
        ]
      }
    });

    render(
      <MemoryRouter
        initialEntries={['/menu/qr-combo-promo']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/menu/:slug" element={<PublicMenuPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Promo combo desayuno')).toBeInTheDocument();
      expect(screen.getByText('Combo desayuno')).toBeInTheDocument();
      expect(screen.getByText('Solo sabados')).toBeInTheDocument();
    });
  });

  test('renderiza cuenta regresiva tambien en bloques de combos', async () => {
    carteleriaService.getPublicMenu.mockResolvedValueOnce({
      data: {
        link: {
          slug: 'qr-combo-countdown',
          source: 'default_menu'
        },
        menu: {
          id: 12,
          name: 'Menu combos',
          local_name: 'Cafe Central',
          theme_key: 'style-2'
        },
        blocks: [
          {
            id: 1,
            block_type: 'header',
            title: 'Menu combos',
            content: 'Combos del momento'
          },
          {
            id: 2,
            block_type: 'combo',
            title: 'Combos',
            items: [
              {
                id: 9,
                name: 'Combo countdown',
                description: 'Cafe con medialunas',
                combo_price_cents: 3300,
                has_countdown: true,
                ends_at: '2030-01-01T12:00:00.000Z',
                promotions: [],
                items: [
                  {
                    id: 1,
                    name: 'Cafe latte',
                    description: 'Con leche',
                    price_cents: 2500
                  },
                  {
                    id: 2,
                    name: 'Medialuna',
                    description: 'Manteca',
                    price_cents: 800
                  }
                ]
              }
            ],
            item: {
              id: 9,
              name: 'Combo countdown',
              description: 'Cafe con medialunas',
              combo_price_cents: 3300,
              has_countdown: true,
              ends_at: '2030-01-01T12:00:00.000Z',
              promotions: [],
              items: [
                {
                  id: 1,
                  name: 'Cafe latte',
                  description: 'Con leche',
                  price_cents: 2500
                },
                {
                  id: 2,
                  name: 'Medialuna',
                  description: 'Manteca',
                  price_cents: 800
                }
              ]
            }
          }
        ]
      }
    });

    render(
      <MemoryRouter
        initialEntries={['/menu/qr-combo-countdown']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/menu/:slug" element={<PublicMenuPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Combo countdown')).toBeInTheDocument();
      expect(screen.getByText(/Termina en/i)).toBeInTheDocument();
    });
  });

  test('aplica estilos visuales elegidos para promociones y combos publicados', async () => {
    carteleriaService.getPublicMenu.mockResolvedValueOnce({
      data: {
        link: {
          slug: 'qr-estilos',
          source: 'default_menu'
        },
        menu: {
          id: 14,
          name: 'Menu promo show',
          local_name: 'Cafe Central',
          theme_key: 'style-2'
        },
        blocks: [
          {
            id: 1,
            block_type: 'header',
            title: 'Menu promo show',
            content: 'Promos con estilo'
          },
          {
            id: 2,
            block_type: 'promotion',
            title: 'Promociones',
            config: {
              display_style: 'seal-offer'
            },
            items: [
              {
                id: 91,
                name: 'Promo 2x1 cafe',
                type: 'two_for_one',
                conditions_text: 'Solo lunes',
                has_countdown: false,
                target_product: {
                  id: 1,
                  name: 'Cafe latte',
                  description: 'Con leche',
                  price_cents: 2500,
                  promotions: []
                }
              }
            ],
            item: {
              id: 91,
              name: 'Promo 2x1 cafe',
              type: 'two_for_one',
              conditions_text: 'Solo lunes',
              has_countdown: false,
              target_product: {
                id: 1,
                name: 'Cafe latte',
                description: 'Con leche',
                price_cents: 2500,
                promotions: []
              }
            }
          },
          {
            id: 3,
            block_type: 'combo',
            title: 'Combos',
            config: {
              display_style: 'combo-countdown'
            },
            items: [
              {
                id: 9,
                name: 'Combo countdown',
                description: 'Cafe con medialunas',
                combo_price_cents: 3300,
                has_countdown: true,
                ends_at: '2030-01-01T12:00:00.000Z',
                promotions: [],
                items: [
                  {
                    id: 1,
                    name: 'Cafe latte',
                    description: 'Con leche',
                    price_cents: 2500
                  }
                ]
              }
            ],
            item: {
              id: 9,
              name: 'Combo countdown',
              description: 'Cafe con medialunas',
              combo_price_cents: 3300,
              has_countdown: true,
              ends_at: '2030-01-01T12:00:00.000Z',
              promotions: [],
              items: [
                {
                  id: 1,
                  name: 'Cafe latte',
                  description: 'Con leche',
                  price_cents: 2500
                }
              ]
            }
          }
        ]
      }
    });

    render(
      <MemoryRouter
        initialEntries={['/menu/qr-estilos']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/menu/:slug" element={<PublicMenuPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sello 2x1')).toBeInTheDocument();
      expect(screen.getByText('Combo contrarreloj')).toBeInTheDocument();
    });
  });

  test('respeta colores contrastantes del tema y el color configurado del separador', async () => {
    carteleriaService.getPublicMenu.mockResolvedValueOnce({
      data: {
        link: {
          slug: 'qr-nocturno',
          source: 'default_menu'
        },
        menu: {
          id: 9,
          name: 'Menu nocturno',
          local_name: 'Cafe Central',
          theme_key: 'style-6'
        },
        blocks: [
          {
            id: 1,
            block_type: 'header',
            title: 'Menu nocturno',
            content: 'Sabores de noche'
          },
          {
            id: 2,
            block_type: 'category',
            title: 'Bebidas',
            content: 'Destacadas del turno noche',
            category: {
              id: 10,
              name: 'Bebidas'
            },
            items: [
              {
                id: 1,
                name: 'Negroni',
                description: 'Clasico',
                price_cents: 5000,
                promotions: []
              }
            ]
          },
          {
            id: 3,
            block_type: 'separator',
            title: 'Happy hour',
            content: 'Solo hasta las 20 hs',
            text_color: '#f97316',
            background_type: 'solid',
            background_value: '#111827'
          }
        ]
      }
    });

    render(
      <MemoryRouter
        initialEntries={['/menu/qr-nocturno']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          <Route path="/menu/:slug" element={<PublicMenuPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Bebidas').length).toBeGreaterThan(1);
    });

    expect(screen.getAllByText('Bebidas')[1]).toHaveStyle({ color: '#e2e8f0' });
    expect(screen.getByText('Destacadas del turno noche')).toHaveStyle({ color: '#cbd5e1' });
    expect(screen.getByText('Happy hour')).toHaveStyle({ color: '#f97316' });
    expect(screen.getByText('Solo hasta las 20 hs')).toHaveStyle({ color: '#f97316' });
  });
});
