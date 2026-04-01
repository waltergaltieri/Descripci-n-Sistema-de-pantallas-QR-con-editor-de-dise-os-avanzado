import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      username: 'admin',
      role: 'admin'
    },
    logout: jest.fn()
  })
}));

jest.mock('../contexts/SocketContext', () => ({
  useSocket: () => ({
    connected: true
  })
}));

jest.mock('../components/Auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ children }) => children
}));

jest.mock('../components/Auth/PublicRoute', () => ({
  __esModule: true,
  default: ({ children }) => children
}));

jest.mock('../components/SuperAdmin/SuperAdminRoute', () => ({
  __esModule: true,
  default: ({ children }) => children
}));

jest.mock('../components/SuperAdmin/SuperAdminLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>
}));

jest.mock('../components/SuperAdmin/SuperAdminDashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard Super Admin</div>
}));

jest.mock('../components/SuperAdmin/ClientsManager', () => ({
  __esModule: true,
  default: () => <div>Clientes Super Admin</div>
}));

jest.mock('../components/SuperAdmin/ClientDetail', () => ({
  __esModule: true,
  default: () => <div>Detalle Cliente Super Admin</div>
}));

jest.mock('../components/Auth/Login', () => ({
  __esModule: true,
  default: () => <div>Login</div>
}));

jest.mock('../components/Dashboard/Dashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard Pantallas</div>
}));

jest.mock('../components/Screens/ScreensManager', () => ({
  __esModule: true,
  default: () => <div>Gestión de Pantallas</div>
}));

jest.mock('../components/Designs/DesignsManager', () => ({
  __esModule: true,
  default: () => <div>Gestión de Diseños</div>
}));

jest.mock('../components/Designs/DesignEditor', () => ({
  __esModule: true,
  default: () => <div>Editor de Diseños</div>
}));

jest.mock('../components/InternalEditor/InternalDesignEditor', () => ({
  __esModule: true,
  default: () => <div>Editor Interno</div>
}));

jest.mock('../components/InternalEditor/HiddenInternalEditor', () => ({
  __esModule: true,
  default: () => <div>Hidden Internal Editor</div>
}));

jest.mock('../components/Screens/ScreenDisplay', () => ({
  __esModule: true,
  default: () => <div>Screen Display</div>
}));

jest.mock('../components/Carteleria/CarteleriaDashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard Carteleria</div>
}), { virtual: true });

jest.mock('../components/Carteleria/ProductsManager', () => ({
  __esModule: true,
  default: () => <div>Gestión de Productos</div>
}), { virtual: true });

jest.mock('../components/Carteleria/PromotionsManager', () => ({
  __esModule: true,
  default: () => <div>Gestión de Promociones</div>
}), { virtual: true });

jest.mock('../components/Carteleria/MenusManager', () => ({
  __esModule: true,
  default: () => <div>Gestión de Menús</div>
}), { virtual: true });

jest.mock('../components/Carteleria/LinksManager', () => ({
  __esModule: true,
  default: () => <div>Gestión de Links y QR</div>
}), { virtual: true });

jest.mock('../components/Carteleria/Public/PublicMenuPage', () => ({
  __esModule: true,
  default: () => <div>MenÃº pÃºblico</div>
}), { virtual: true });

const renderApp = (initialEntry) =>
  render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </MemoryRouter>
  );

describe('Shell compartido de módulos', () => {
  test('permite cambiar desde Pantallas a Cartelería y actualiza la navegación lateral', async () => {
    const user = userEvent.setup();

    renderApp('/dashboard');

    expect(screen.getByText('Dashboard Pantallas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pantallas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Diseños' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Productos' })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('link', { name: 'Cambiar al módulo Cartelería' })
    );

    expect(screen.getByText('Dashboard Carteleria')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Productos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Promociones' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Menús' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Links y QR' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pantallas' })).not.toBeInTheDocument();
  });

  test('las rutas de Cartelería usan su propio título y buscador compartido', () => {
    renderApp('/carteleria/products');

    expect(screen.getByRole('heading', { name: 'Productos' })).toBeInTheDocument();
    expect(screen.getByText('Gestión de Productos')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Buscar productos, promociones, menús o QR...')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Links y QR' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Diseños' })).not.toBeInTheDocument();
  });
});
