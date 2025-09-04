import axios from 'axios';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // Aumentado a 60 segundos para payloads grandes
  maxContentLength: 100 * 1024 * 1024, // 100MB
  maxBodyLength: 100 * 1024 * 1024, // 100MB
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests
api.interceptors.request.use(
  (config) => {
    // Agregar token si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores globales
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// Servicios de pantallas
export const screensService = {
  getAll: () => api.get('/screens'),
  getById: (id) => api.get(`/screens/${id}`),
  create: (data) => api.post('/screens', data),
  update: (id, data) => api.put(`/screens/${id}`, data),
  delete: (id) => api.delete(`/screens/${id}`),
  reorder: (screenIds) => api.post('/screens/reorder', { screenIds }),
  assignDesign: (screenId, designId) => api.post(`/screens/${screenId}/assign-design`, { designId }),
  removeDesign: (screenId) => api.delete(`/screens/${screenId}/remove-design`),
};

// Servicios de diseños
export const designsService = {
  getAll: () => api.get('/designs'),
  getById: (id) => api.get(`/designs/${id}`),
  create: (data) => api.post('/designs', data),
  update: (id, data) => api.put(`/designs/${id}`, data),
  delete: (id) => api.delete(`/designs/${id}`),
  duplicate: (id, name) => api.post(`/designs/${id}/duplicate`, { name }),
  publish: (id) => api.post(`/designs/${id}/publish`),
  getTemplates: () => api.get('/designs/templates/predefined'),
  createFromTemplate: (data) => api.post('/designs/from-template', data),
};

// Servicios de uploads
export const uploadsService = {
  uploadImage: (file, onProgress) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  uploadImages: (files, onProgress) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    return api.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },
  
  getAll: (params) => api.get('/uploads', { params }),
  getById: (id) => api.get(`/uploads/${id}`),
  delete: (id) => api.delete(`/uploads/${id}`),
};

// Utilidades para manejo de errores
export const handleApiError = (error) => {
  if (error.response) {
    // El servidor respondió con un código de error
    return {
      message: error.response.data?.error || 'Error del servidor',
      status: error.response.status,
      data: error.response.data,
    };
  } else if (error.request) {
    // La petición fue hecha pero no se recibió respuesta
    return {
      message: 'No se pudo conectar con el servidor',
      status: 0,
      data: null,
    };
  } else {
    // Algo pasó al configurar la petición
    return {
      message: error.message || 'Error desconocido',
      status: 0,
      data: null,
    };
  }
};

// Función para construir URLs de archivos
export const getFileUrl = (path) => {
  if (!path) return null;
  
  // Si ya es una URL completa, devolverla tal como está
  if (path.startsWith('http')) {
    return path;
  }
  
  // Construir URL relativa al servidor
  const baseUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// Función para validar respuestas de API
export const validateApiResponse = (response, expectedFields = []) => {
  if (!response || !response.data) {
    throw new Error('Respuesta de API inválida');
  }
  
  const data = response.data;
  
  for (const field of expectedFields) {
    if (!(field in data)) {
      throw new Error(`Campo requerido '${field}' no encontrado en la respuesta`);
    }
  }
  
  return data;
};

// Función para retry de peticiones
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // No reintentar en errores 4xx (excepto 408, 429)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        if (error.response.status !== 408 && error.response.status !== 429) {
          throw error;
        }
      }
      
      // Esperar antes del siguiente intento
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
};

export default api;