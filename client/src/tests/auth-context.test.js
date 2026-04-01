const React = require('react');
const { act } = React;
const { render, screen, waitFor } = require('@testing-library/react');

const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  defaults: {
    headers: {
      common: {}
    }
  },
  interceptors: {
    response: {
      use: jest.fn(() => 'interceptor-id'),
      eject: jest.fn()
    }
  }
};

const mockSupabaseSignIn = jest.fn();
const mockSupabaseGetSession = jest.fn();
const mockSupabaseOnAuthStateChange = jest.fn();
const mockSupabaseSignOut = jest.fn();
const mockToast = {
  success: jest.fn(),
  error: jest.fn()
};

jest.mock('../services/api', () => ({
  __esModule: true,
  default: mockApi
}));

jest.mock('../services/supabase', () => ({
  __esModule: true,
  isSupabaseBrowserConfigured: () => true,
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: mockSupabaseSignIn,
      getSession: mockSupabaseGetSession,
      onAuthStateChange: mockSupabaseOnAuthStateChange,
      signOut: mockSupabaseSignOut
    }
  })
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: mockToast
}));

const { AuthProvider, useAuth } = require('../contexts/AuthContext');

let latestAuth = null;

const AuthConsumer = () => {
  latestAuth = useAuth();

  return React.createElement(
    'span',
    { 'data-testid': 'role' },
    latestAuth.user?.role || 'none'
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockApi.defaults.headers.common = {};
    mockSupabaseGetSession.mockResolvedValue({
      data: { session: null }
    });
    mockSupabaseOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: jest.fn()
        }
      }
    });
  });

  test('uses Supabase Auth login and verifies the application profile before authenticating the user', async () => {
    mockSupabaseSignIn.mockResolvedValue({
      data: {
        session: {
          access_token: 'supabase-access-token'
        }
      },
      error: null
    });

    mockApi.get.mockResolvedValue({
      data: {
        user: {
          actorType: 'business_user',
          role: 'owner',
          accessStatus: 'active'
        }
      }
    });

    render(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(AuthConsumer)
      )
    );

    await act(async () => {
      await latestAuth.login('owner@cafecentral.com', 'clave123');
    });

    await waitFor(() => {
      expect(mockSupabaseSignIn).toHaveBeenCalledWith({
        email: 'owner@cafecentral.com',
        password: 'clave123'
      });
    });

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/auth/verify');
    });

    expect(localStorage.getItem('token')).toBe('supabase-access-token');
    expect(mockApi.defaults.headers.common.Authorization).toBe('Bearer supabase-access-token');
    expect(screen.getByTestId('role').textContent).toBe('owner');
  });

  test('does not call the legacy backend login endpoint', async () => {
    mockSupabaseSignIn.mockResolvedValue({
      data: {
        session: {
          access_token: 'supabase-access-token'
        }
      },
      error: null
    });

    mockApi.get.mockResolvedValue({
      data: {
        user: {
          actorType: 'super_admin',
          role: 'admin'
        }
      }
    });

    render(
      React.createElement(
        AuthProvider,
        null,
        React.createElement(AuthConsumer)
      )
    );

    await act(async () => {
      await latestAuth.login('admin@kazescreen.com', 'clave123');
    });

    expect(mockApi.post).not.toHaveBeenCalledWith('/auth/login', expect.anything());
  });
});
