import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  },
  handleApiError: jest.fn(() => 'Error de API'),
  getFileUrl: jest.fn((value) => value || ''),
  screensService: {},
  designsService: {},
  carteleriaService: {},
  uploadsService: {},
  superAdminService: {}
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      actorType: 'super_admin',
      email: 'owner@kaze.com',
      fullName: 'Kaze Owner'
    },
    logout: jest.fn(),
    loading: false
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
  default: () => <div>Gestion de Pantallas</div>
}));

jest.mock('../components/Designs/DesignsManager', () => ({
  __esModule: true,
  default: () => <div>Gestion de Disenos</div>
}));

jest.mock('../components/Designs/DesignEditor', () => ({
  __esModule: true,
  default: () => <div>Editor de Disenos</div>
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
}));

jest.mock('../components/Carteleria/ProductsManager', () => ({
  __esModule: true,
  default: () => <div>Gestion de Productos</div>
}));

jest.mock('../components/Carteleria/PromotionsManager', () => ({
  __esModule: true,
  default: () => <div>Gestion de Promociones</div>
}));

jest.mock('../components/Carteleria/MenusManager', () => ({
  __esModule: true,
  default: () => <div>Gestion de Menus</div>
}));

jest.mock('../components/Carteleria/LinksManager', () => ({
  __esModule: true,
  default: () => <div>Gestion de Links</div>
}));

jest.mock('../components/Carteleria/Public/PublicMenuPage', () => ({
  __esModule: true,
  default: () => <div>Menu publico</div>
}));

jest.mock('../components/SuperAdmin/SuperAdminDashboard', () => ({
  __esModule: true,
  default: () => <div>Dashboard Super Admin</div>
}));

jest.mock('../components/SuperAdmin/ClientsManager', () => ({
  __esModule: true,
  default: () => <div>Listado de Clientes</div>
}));

jest.mock('../components/SuperAdmin/ClientDetail', () => ({
  __esModule: true,
  default: () => <div>Detalle de Cliente</div>
}));

const renderApp = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>
  );

describe('Rutas de super admin', () => {
  test('renderiza el dashboard de super admin', () => {
    renderApp('/super-admin/dashboard');

    expect(screen.getByText('Dashboard Super Admin')).toBeInTheDocument();
  });

  test('renderiza el listado de clientes de super admin', () => {
    renderApp('/super-admin/clients');

    expect(screen.getByText('Listado de Clientes')).toBeInTheDocument();
  });

  test('renderiza el detalle de cliente de super admin', () => {
    renderApp('/super-admin/clients/12');

    expect(screen.getByText('Detalle de Cliente')).toBeInTheDocument();
  });
});
