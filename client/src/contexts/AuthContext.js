import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  getSupabaseBrowserClient,
  isSupabaseBrowserConfigured
} from '../services/supabase';

const AuthContext = createContext();
const TOKEN_STORAGE_KEY = 'token';

const setApiAuthorizationToken = (accessToken) => {
  if (accessToken) {
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
};

const persistAccessToken = (accessToken) => {
  if (accessToken) {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    return;
  }

  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_STORAGE_KEY));
  const supabaseEnabled = isSupabaseBrowserConfigured();

  const clearAuthState = useCallback(() => {
    persistAccessToken(null);
    setToken(null);
    setUser(null);
    setApiAuthorizationToken(null);
  }, []);

  const applyAccessToken = useCallback((accessToken) => {
    persistAccessToken(accessToken);
    setToken(accessToken);
    setApiAuthorizationToken(accessToken);
  }, []);

  const verifyApplicationUser = useCallback(async (accessToken) => {
    applyAccessToken(accessToken);
    const response = await api.get('/auth/verify');
    const userData = response.data.user;
    setUser(userData);
    return userData;
  }, [applyAccessToken]);

  useEffect(() => {
    setApiAuthorizationToken(token);
  }, [token]);

  useEffect(() => {
    if (!supabaseEnabled) {
      clearAuthState();
      setLoading(false);
      return undefined;
    }

    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    const restoreSupabaseSession = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          if (isMounted) {
            clearAuthState();
          }
          return;
        }

        await verifyApplicationUser(session.access_token);
      } catch (error) {
        console.error('Error al restaurar sesion de Supabase:', error);
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const accessToken = session?.access_token || null;

      if (!accessToken) {
        if (isMounted) {
          clearAuthState();
        }
        return;
      }

      if (isMounted) {
        applyAccessToken(accessToken);
      }
    });

    restoreSupabaseSession();

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe?.();
    };
  }, [applyAccessToken, clearAuthState, supabaseEnabled, verifyApplicationUser]);

  const login = async (email, password) => {
    try {
      setLoading(true);

      if (!supabaseEnabled) {
        throw new Error('Supabase Auth no esta configurado en el cliente');
      }

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      const accessToken = data?.session?.access_token;
      if (!accessToken) {
        throw new Error('Supabase no devolvio un token de acceso valido');
      }

      const userData = await verifyApplicationUser(accessToken);
      toast.success('Bienvenido');
      return { success: true, user: userData };
    } catch (error) {
      try {
        await getSupabaseBrowserClient().auth.signOut();
      } catch (signOutError) {
        console.error('Error al revertir sesion de Supabase:', signOutError);
      }

      clearAuthState();

      const message =
        error.response?.data?.error || error.message || 'Error al iniciar sesion';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (supabaseEnabled) {
        await getSupabaseBrowserClient().auth.signOut();
      }

      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Error al hacer logout:', error);
    } finally {
      clearAuthState();
      toast.success('Sesion cerrada');
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!supabaseEnabled) {
        throw new Error('Supabase Auth no esta configurado en el cliente');
      }

      if (!user?.email) {
        throw new Error('No se pudo resolver el correo del usuario autenticado');
      }

      if (!currentPassword || !newPassword) {
        throw new Error('Contrasena actual y nueva son requeridas');
      }

      const supabase = getSupabaseBrowserClient();
      const reauthResult = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (reauthResult.error) {
        throw reauthResult.error;
      }

      const updateResult = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateResult.error) {
        throw updateResult.error;
      }

      toast.success('Contrasena actualizada exitosamente');
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.error || 'Error al cambiar contrasena';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateUser = (userData) => {
    setUser((prevUser) => ({ ...prevUser, ...userData }));
  };

  const hasRole = (role) => {
    if (role === 'admin' && user?.actorType === 'super_admin') {
      return true;
    }

    return user?.role === role;
  };

  const isAuthenticated = () => Boolean(user && token);

  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          clearAuthState();
          toast.error('Sesion expirada. Por favor, inicia sesion nuevamente.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [clearAuthState]);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    changePassword,
    updateUser,
    hasRole,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
