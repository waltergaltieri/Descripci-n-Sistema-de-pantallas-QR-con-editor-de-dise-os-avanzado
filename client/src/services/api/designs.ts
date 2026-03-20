import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Design {
  id: string;
  name: string;
  data: any; // JSON del diseño de Polotno
  thumbnail: string; // Base64 o URL de la miniatura
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  isExtended: boolean; // Para composiciones extendidas
  screens: number; // Número de pantallas que abarca
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateDesignRequest {
  name: string;
  data: any;
  thumbnail: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  isExtended?: boolean;
  screens?: number;
}

export interface UpdateDesignRequest {
  name?: string;
  data?: any;
  thumbnail?: string;
  width?: number;
  height?: number;
  orientation?: 'landscape' | 'portrait';
  isExtended?: boolean;
  screens?: number;
}

// Obtener todos los diseños del usuario
export const getDesigns = async (): Promise<Design[]> => {
  try {
    const response = await api.get('/designs');
    return response.data;
  } catch (error) {
    console.error('Error fetching designs:', error);
    throw error;
  }
};

// Obtener un diseño por ID
export const getDesign = async (id: string): Promise<Design> => {
  try {
    const response = await api.get(`/designs/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching design:', error);
    throw error;
  }
};

// Crear un nuevo diseño
export const createDesign = async (design: CreateDesignRequest): Promise<Design> => {
  try {
    const response = await api.post('/designs', design);
    return response.data;
  } catch (error) {
    console.error('Error creating design:', error);
    throw error;
  }
};

// Actualizar un diseño existente
export const updateDesign = async (id: string, updates: UpdateDesignRequest): Promise<Design> => {
  try {
    const response = await api.put(`/designs/${id}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating design:', error);
    throw error;
  }
};

// Eliminar un diseño
export const deleteDesign = async (id: string): Promise<void> => {
  try {
    await api.delete(`/designs/${id}`);
  } catch (error) {
    console.error('Error deleting design:', error);
    throw error;
  }
};

// Duplicar un diseño
export const duplicateDesign = async (id: string, newName?: string): Promise<Design> => {
  try {
    const response = await api.post(`/designs/${id}/duplicate`, {
      name: newName
    });
    return response.data;
  } catch (error) {
    console.error('Error duplicating design:', error);
    throw error;
  }
};

// Guardar diseño desde Polotno store
export const saveDesignFromStore = async (store: any, designId?: string, name?: string): Promise<Design> => {
  try {
    // Obtener datos del store
    const data = store.toJSON();
    
    // Generar miniatura
    const thumbnail = await store.toDataURL({ 
      pixelRatio: 0.2,
      mimeType: 'image/jpeg',
      quality: 0.8
    });
    
    // Obtener dimensiones de la página activa
    const activePage = store.activePage;
    const width = activePage?.width || 1920;
    const height = activePage?.height || 1080;
    const orientation: 'landscape' | 'portrait' = width > height ? 'landscape' : 'portrait';
    
    // Detectar si es composición extendida (más de 1920px de ancho)
    const isExtended = width > 1920;
    const screens = isExtended ? Math.ceil(width / 1920) : 1;
    
    const designData: CreateDesignRequest = {
      name: name || `Diseño ${new Date().toLocaleString()}`,
      data,
      thumbnail,
      width,
      height,
      orientation,
      isExtended,
      screens
    };
    
    if (designId) {
      // Actualizar diseño existente
      return await updateDesign(designId, designData);
    } else {
      // Crear nuevo diseño
      return await createDesign(designData);
    }
  } catch (error) {
    console.error('Error saving design from store:', error);
    throw error;
  }
};

// Cargar diseño en Polotno store
export const loadDesignToStore = async (store: any, designId: string): Promise<void> => {
  try {
    const design = await getDesign(designId);
    
    // Limpiar el store actual
    store.clear();
    
    // Cargar los datos del diseño
    store.loadJSON(design.data);
    
    console.log('Design loaded successfully:', design.name);
  } catch (error) {
    console.error('Error loading design to store:', error);
    throw error;
  }
};

// Exportar diseño como imagen
export const exportDesignAsImage = async (store: any, options?: {
  pixelRatio?: number;
  mimeType?: string;
  quality?: number;
}): Promise<string> => {
  try {
    const dataURL = await store.toDataURL({
      pixelRatio: options?.pixelRatio || 1,
      mimeType: options?.mimeType || 'image/png',
      quality: options?.quality || 1
    });
    
    return dataURL;
  } catch (error) {
    console.error('Error exporting design as image:', error);
    throw error;
  }
};

// Obtener plantillas predefinidas
export const getTemplates = async (): Promise<Design[]> => {
  try {
    const response = await api.get('/designs/templates');
    return response.data;
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
};

// Crear diseño desde plantilla
export const createFromTemplate = async (templateId: string, name?: string): Promise<Design> => {
  try {
    const response = await api.post(`/designs/templates/${templateId}`, {
      name: name || `Diseño desde plantilla ${new Date().toLocaleString()}`
    });
    return response.data;
  } catch (error) {
    console.error('Error creating design from template:', error);
    throw error;
  }
};

export default {
  getDesigns,
  getDesign,
  createDesign,
  updateDesign,
  deleteDesign,
  duplicateDesign,
  saveDesignFromStore,
  loadDesignToStore,
  exportDesignAsImage,
  getTemplates,
  createFromTemplate
};