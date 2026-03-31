import axios from 'axios';

// Configuración base de axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 600000, // Aumentado a 10 minutos para operaciones complejas
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
  createFromTemplate: ({ templateId, name, description }) =>
    api.post('/designs/from-template', { templateId, name, description }),
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

// Servicios del módulo de cartelería
export const carteleriaService = {
  getDashboardMetrics: () => api.get('/carteleria/dashboard/metrics'),
  getBusinessProfile: () => api.get('/carteleria/business-profile'),
  updateBusinessProfile: (data) => api.put('/carteleria/business-profile', data),
  getCategories: () => api.get('/carteleria/categories'),
  createCategory: (data) => api.post('/carteleria/categories', data),
  updateCategory: (id, data) => api.put(`/carteleria/categories/${id}`, data),
  getProducts: (params) => api.get('/carteleria/products', { params }),
  getProductById: (id) => api.get(`/carteleria/products/${id}`),
  createProduct: (data) => api.post('/carteleria/products', data),
  updateProduct: (id, data) => api.put(`/carteleria/products/${id}`, data),
  getPromotionMenus: () => api.get('/carteleria/menus/options'),
  getMenus: (params) => api.get('/carteleria/menus', { params }),
  getMenuById: (id) => api.get(`/carteleria/menus/${id}`),
  createMenu: (data) => api.post('/carteleria/menus', data),
  updateMenu: (id, data) => api.put(`/carteleria/menus/${id}`, data),
  deleteMenu: (id) => api.delete(`/carteleria/menus/${id}`),
  getPromotions: (params) => api.get('/carteleria/promotions', { params }),
  getPromotionById: (id) => api.get(`/carteleria/promotions/${id}`),
  createPromotion: (data) => api.post('/carteleria/promotions', data),
  updatePromotion: (id, data) => api.put(`/carteleria/promotions/${id}`, data),
  getCombos: (params) => api.get('/carteleria/combos', { params }),
  getComboById: (id) => api.get(`/carteleria/combos/${id}`),
  createCombo: (data) => api.post('/carteleria/combos', data),
  updateCombo: (id, data) => api.put(`/carteleria/combos/${id}`, data),
  getPersistentLinks: (params) => api.get('/carteleria/links', { params }),
  getPersistentLinkById: (id) => api.get(`/carteleria/links/${id}`),
  createPersistentLink: (data) => api.post('/carteleria/links', data),
  updatePersistentLink: (id, data) => api.put(`/carteleria/links/${id}`, data),
  getPublicMenu: (slug) => api.get(`/carteleria/public/${slug}`),
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
  
  // Construir URL relativa al servidor usando la misma base que consume la API
  const apiBaseUrl = process.env.REACT_APP_SERVER_URL || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
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
