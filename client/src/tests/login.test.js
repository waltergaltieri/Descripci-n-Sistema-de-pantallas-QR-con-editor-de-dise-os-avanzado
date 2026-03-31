import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../components/Auth/Login';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();
const mockToast = {
  error: jest.fn(),
  success: jest.fn(),
  __esModule: true
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin
  })
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: null
  })
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

describe('Login', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  test('does not navigate when authentication fails', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({
      success: false,
      error: 'Credenciales invalida'
    });

    render(<Login />);

    await user.type(screen.getByLabelText(/usuario/i), 'admin');
    await user.type(screen.getByLabelText(/contrase/i), 'incorrecta');
    await user.click(screen.getByRole('button', { name: /iniciar sesi/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'incorrecta');
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
