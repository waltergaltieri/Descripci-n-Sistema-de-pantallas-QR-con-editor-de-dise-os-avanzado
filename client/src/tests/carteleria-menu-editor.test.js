import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MenusManager from '../components/Carteleria/MenusManager';

jest.setTimeout(30000);

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}));

jest.mock('../services/api', () => ({
  carteleriaService: {
    getDashboardMetrics: jest.fn(),
    getMenus: jest.fn(),
    getMenuById: jest.fn(),
    createMenu: jest.fn(),
    updateMenu: jest.fn(),
    deleteMenu: jest.fn(),
    getCategories: jest.fn(),
    getProducts: jest.fn(),
    getPromotions: jest.fn(),
    getCombos: jest.fn()
  },
  uploadsService: {
    uploadImage: jest.fn()
  },
  handleApiError: jest.fn((error) => ({
    message: error?.message || 'Error'
  }))
}));

const { carteleriaService, uploadsService } = require('../services/api');

const openMenuSettings = async (user) => {
  await user.click(await screen.findByRole('button', { name: 'Ajustes del menu' }));
};

describe('Editor de menus de Carteleria', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    carteleriaService.getDashboardMetrics.mockResolvedValue({
      data: {
        activeMenus: 2,
        activeLinks: 1
      }
    });

    carteleriaService.getMenus.mockResolvedValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Menu principal',
            local_name: 'Cafe Central',
            status: 'active',
            theme_key: 'style-2',
            blocks_count: 3
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

    carteleriaService.getCategories.mockResolvedValue({
      data: [{ id: 1, name: 'Bebidas' }]
    });

    carteleriaService.getProducts.mockResolvedValue({
      data: {
        data: [{ id: 10, name: 'Cafe latte' }]
      }
    });

    carteleriaService.getPromotions.mockResolvedValue({
      data: {
        data: [{ id: 20, name: 'Happy hour cafe' }]
      }
    });

    carteleriaService.getCombos.mockResolvedValue({
      data: {
        data: [{ id: 30, name: 'Combo desayuno' }]
      }
    });

    carteleriaService.createMenu.mockResolvedValue({
      data: { id: 100 }
    });

    carteleriaService.updateMenu.mockResolvedValue({
      data: { id: 1, status: 'paused' }
    });

    carteleriaService.deleteMenu.mockResolvedValue({
      data: { success: true }
    });

    carteleriaService.getMenuById.mockResolvedValue({
      data: {
        id: 1,
        name: 'Menu principal',
        local_name: 'Cafe Central',
        status: 'active',
        theme_key: 'style-2',
        logo_upload_id: null,
        blocks: [
          {
            id: 1,
            block_type: 'header',
            title: 'Encabezado',
            content: 'Siempre actualizado',
            config: {},
            sort_order: 0
          }
        ]
      }
    });

    uploadsService.uploadImage.mockResolvedValue({
      data: { id: 44, url: '/uploads/menu-logo.png' }
    });
  });

  test('muestra menus cargados y permite abrir el editor', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MenusManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Menu principal')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear menu' }));

    expect(await screen.findByRole('button', { name: 'Ajustes del menu' })).toBeInTheDocument();
    expect(screen.getByText('Secciones del menu')).toBeInTheDocument();
    expect(screen.getByText('Vista previa')).toBeInTheDocument();
    expect(screen.queryByText('Configuracion general')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Contraer bloque Encabezado' })).toBeInTheDocument();
  });

  test('prioriza el constructor y permite compactar bloques para ocupar menos espacio', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MenusManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear menu' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear menu' }));
    await user.click(screen.getByRole('button', { name: 'Agregar bloque Categoria' }));

    expect(screen.getByRole('button', { name: 'Contraer bloque Categoria' })).toBeInTheDocument();
    expect(screen.getByLabelText('Categoria vinculada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Contraer bloque Categoria' }));

    expect(screen.getByRole('button', { name: 'Expandir bloque Categoria' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Categoria vinculada')).not.toBeInTheDocument();
  });

  test('permite crear un menu con bloques, tema y pickers visuales de color', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MenusManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear menu' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear menu' }));
    await openMenuSettings(user);
    await user.type(screen.getByLabelText('Nombre del menu'), 'Menu brunch');
    await user.type(screen.getByLabelText('Nombre del local'), 'Cafe Central');
    await user.selectOptions(screen.getByLabelText('Estilo visual'), 'style-3');
    await user.click(screen.getByRole('button', { name: 'Agregar bloque Categoria' }));
    await user.click(screen.getByRole('button', { name: 'Agregar bloque Separador' }));

    expect(screen.getByLabelText('Selector visual color de fondo del separador')).toHaveAttribute('type', 'color');
    expect(screen.getByLabelText('Selector visual color de texto del separador')).toHaveAttribute('type', 'color');

    await user.selectOptions(screen.getByDisplayValue('Color solido'), 'gradient');

    expect(
      screen.getByLabelText('Selector visual color inicial del gradiente del separador')
    ).toHaveAttribute('type', 'color');
    expect(
      screen.getByLabelText('Selector visual color final del gradiente del separador')
    ).toHaveAttribute('type', 'color');
    expect(screen.getByLabelText('Direccion del gradiente')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar menu' }));

    await waitFor(() => {
      expect(carteleriaService.createMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Menu brunch',
          local_name: 'Cafe Central',
          theme_key: 'style-3',
          blocks: expect.arrayContaining([
            expect.objectContaining({ block_type: 'header' }),
            expect.objectContaining({ block_type: 'category' }),
            expect.objectContaining({
              block_type: 'separator',
              background_type: 'gradient',
              background_value: expect.stringContaining('linear-gradient(')
            })
          ])
        })
      );
    });
  });

  test('permite subir una imagen para el fondo del separador', async () => {
    const user = userEvent.setup();
    const backgroundFile = new File(['separator'], 'separator-bg.png', { type: 'image/png' });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MenusManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear menu' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear menu' }));
    await openMenuSettings(user);
    await user.type(screen.getByLabelText('Nombre del menu'), 'Menu separador');
    await user.click(screen.getByRole('button', { name: 'Agregar bloque Separador' }));
    await user.selectOptions(screen.getByDisplayValue('Color solido'), 'image');
    await user.upload(screen.getByLabelText('Imagen de fondo'), backgroundFile);

    await waitFor(() => {
      expect(uploadsService.uploadImage).toHaveBeenCalledWith(backgroundFile);
    });

    await user.click(screen.getByRole('button', { name: 'Guardar menu' }));

    await waitFor(() => {
      expect(carteleriaService.createMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Menu separador',
          blocks: expect.arrayContaining([
            expect.objectContaining({
              block_type: 'separator',
              background_type: 'image',
              background_value: '/uploads/menu-logo.png',
              config: expect.objectContaining({
                background_image_upload_id: 44,
                background_image_url: '/uploads/menu-logo.png'
              })
            })
          ])
        })
      );
    });
  });

  test('permite elegir estilos visuales para bloques de promociones y combos', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MenusManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear menu' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear menu' }));
    await openMenuSettings(user);
    await user.type(screen.getByLabelText('Nombre del menu'), 'Menu promos con estilo');
    await user.click(screen.getByRole('button', { name: 'Agregar bloque Promocion' }));
    await user.click(screen.getByRole('button', { name: 'Agregar bloque Combo' }));

    await user.click(screen.getByRole('button', { name: 'Estilo promocion Sello' }));
    await user.click(screen.getByRole('button', { name: 'Estilo combo Premium' }));
    await user.click(screen.getByRole('button', { name: 'Guardar menu' }));

    await waitFor(() => {
      expect(carteleriaService.createMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Menu promos con estilo',
          blocks: expect.arrayContaining([
            expect.objectContaining({
              block_type: 'promotion',
              config: expect.objectContaining({
                display_style: 'seal-offer'
              })
            }),
            expect.objectContaining({
              block_type: 'combo',
              config: expect.objectContaining({
                display_style: 'combo-premium'
              })
            })
          ])
        })
      );
    });
  });

  test('permite guardar un menu con logo opcional', async () => {
    const user = userEvent.setup();
    const logoFile = new File(['menu'], 'menu-logo.png', { type: 'image/png' });

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MenusManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Crear menu' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Crear menu' }));
    await openMenuSettings(user);
    await user.type(screen.getByLabelText('Nombre del menu'), 'Menu cenas');
    await user.upload(screen.getByLabelText('Logo del menu'), logoFile);

    await waitFor(() => {
      expect(uploadsService.uploadImage).toHaveBeenCalled();
    });

    await user.click(screen.getByRole('button', { name: 'Guardar menu' }));

    await waitFor(() => {
      expect(carteleriaService.createMenu).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Menu cenas',
          logo_upload_id: 44
        })
      );
    });
  });

  test('permite pausar un menu existente desde el listado', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MenusManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Pausar Menu principal/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /Pausar Menu principal/i }));

    await waitFor(() => {
      expect(carteleriaService.updateMenu).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          status: 'paused'
        })
      );
    });
  });

  test('permite borrar un menu existente desde el editor', async () => {
    const user = userEvent.setup();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <MenusManager />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Editar' }));

    expect(await screen.findByRole('button', { name: 'Eliminar menu' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar menu' }));

    await waitFor(() => {
      expect(carteleriaService.deleteMenu).toHaveBeenCalledWith(1);
    });

    confirmSpy.mockRestore();
  });
});
