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

export interface Screen {
  id: string;
  name: string;
  width: number;
  height: number;
  orientation: 'landscape' | 'portrait';
  location?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Publication {
  id: string;
  designId: string;
  designName: string;
  version: number;
  imageUrl: string; // URL de la imagen completa
  isExtended: boolean;
  totalScreens: number;
  screens: PublicationScreen[];
  publishedAt: string;
  publishedBy: string;
  status: 'active' | 'inactive' | 'scheduled';
  scheduledAt?: string;
  expiresAt?: string;
}

export interface PublicationScreen {
  id: string;
  publicationId: string;
  screenId: string;
  screenName: string;
  imageUrl: string; // URL de la imagen croppeada para esta pantalla
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  order: number; // Para composiciones extendidas
  isActive: boolean;
}

export interface PublishRequest {
  designId: string;
  screenIds: string[]; // IDs de las pantallas donde publicar
  imageData: string; // Base64 de la imagen
  scheduledAt?: string;
  expiresAt?: string;
}

export interface PublishResponse {
  publication: Publication;
  message: string;
}

// Obtener todas las pantallas disponibles
export const getScreens = async (): Promise<Screen[]> => {
  try {
    const response = await api.get('/screens');
    return response.data;
  } catch (error) {
    console.error('Error fetching screens:', error);
    throw error;
  }
};

// Obtener una pantalla por ID
export const getScreen = async (id: string): Promise<Screen> => {
  try {
    const response = await api.get(`/screens/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching screen:', error);
    throw error;
  }
};

// Obtener el contenido actual de una pantalla (para el player)
export const getScreenLive = async (screenId: string): Promise<{
  imageUrl: string;
  version: number;
  updatedAt: string;
}> => {
  try {
    const response = await api.get(`/screens/${screenId}/live`);
    return response.data;
  } catch (error) {
    console.error('Error fetching screen live content:', error);
    throw error;
  }
};

// Publicar diseño
export const publishDesign = async (publishData: PublishRequest): Promise<PublishResponse> => {
  try {
    const response = await api.post('/publish', publishData);
    return response.data;
  } catch (error) {
    console.error('Error publishing design:', error);
    throw error;
  }
};

// Publicar desde Polotno store
export const publishFromStore = async (
  store: any,
  designId: string,
  screenIds: string[],
  options?: {
    scheduledAt?: string;
    expiresAt?: string;
    pixelRatio?: number;
  }
): Promise<PublishResponse> => {
  try {
    // Exportar imagen a resolución nativa
    const imageData = await store.toDataURL({
      pixelRatio: options?.pixelRatio || 1,
      mimeType: 'image/png',
      quality: 1
    });
    
    const publishData: PublishRequest = {
      designId,
      screenIds,
      imageData,
      scheduledAt: options?.scheduledAt,
      expiresAt: options?.expiresAt
    };
    
    return await publishDesign(publishData);
  } catch (error) {
    console.error('Error publishing from store:', error);
    throw error;
  }
};

// Obtener todas las publicaciones
export const getPublications = async (): Promise<Publication[]> => {
  try {
    const response = await api.get('/publications');
    return response.data;
  } catch (error) {
    console.error('Error fetching publications:', error);
    throw error;
  }
};

// Obtener una publicación por ID
export const getPublication = async (id: string): Promise<Publication> => {
  try {
    const response = await api.get(`/publications/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching publication:', error);
    throw error;
  }
};

// Obtener publicaciones por pantalla
export const getPublicationsByScreen = async (screenId: string): Promise<Publication[]> => {
  try {
    const response = await api.get(`/screens/${screenId}/publications`);
    return response.data;
  } catch (error) {
    console.error('Error fetching publications by screen:', error);
    throw error;
  }
};

// Activar/desactivar publicación
export const togglePublication = async (id: string, isActive: boolean): Promise<Publication> => {
  try {
    const response = await api.patch(`/publications/${id}`, {
      status: isActive ? 'active' : 'inactive'
    });
    return response.data;
  } catch (error) {
    console.error('Error toggling publication:', error);
    throw error;
  }
};

// Eliminar publicación
export const deletePublication = async (id: string): Promise<void> => {
  try {
    await api.delete(`/publications/${id}`);
  } catch (error) {
    console.error('Error deleting publication:', error);
    throw error;
  }
};

// Programar publicación
export const schedulePublication = async (
  id: string,
  scheduledAt: string,
  expiresAt?: string
): Promise<Publication> => {
  try {
    const response = await api.patch(`/publications/${id}/schedule`, {
      scheduledAt,
      expiresAt
    });
    return response.data;
  } catch (error) {
    console.error('Error scheduling publication:', error);
    throw error;
  }
};

// Obtener estadísticas de publicaciones
export const getPublicationStats = async (): Promise<{
  totalPublications: number;
  activePublications: number;
  totalScreens: number;
  activeScreens: number;
  recentPublications: Publication[];
}> => {
  try {
    const response = await api.get('/publications/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching publication stats:', error);
    throw error;
  }
};

// Previsualizar cómo se verá el diseño en las pantallas seleccionadas
export const previewOnScreens = async (
  store: any,
  screenIds: string[]
): Promise<{
  screenId: string;
  screenName: string;
  previewUrl: string;
  cropInfo: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}[]> => {
  try {
    // Exportar imagen completa
    const fullImage = await store.toDataURL({
      pixelRatio: 0.5, // Menor resolución para preview
      mimeType: 'image/jpeg',
      quality: 0.8
    });
    
    // Obtener información de las pantallas
    const screens = await Promise.all(
      screenIds.map(id => getScreen(id))
    );
    
    // Calcular crops para cada pantalla
    const activePage = store.activePage;
    const designWidth = activePage?.width || 1920;
    const designHeight = activePage?.height || 1080;
    
    const previews = screens.map((screen, index) => {
      let cropX = 0;
      let cropY = 0;
      let cropWidth = screen.width;
      let cropHeight = screen.height;
      
      // Para composiciones extendidas, calcular el crop según el orden
      if (designWidth > 1920) {
        cropX = index * 1920;
        cropWidth = Math.min(1920, designWidth - cropX);
      }
      
      return {
        screenId: screen.id,
        screenName: screen.name,
        previewUrl: fullImage, // En producción, esto sería procesado en el backend
        cropInfo: {
          x: cropX,
          y: cropY,
          width: cropWidth,
          height: cropHeight
        }
      };
    });
    
    return previews;
  } catch (error) {
    console.error('Error generating screen previews:', error);
    throw error;
  }
};

// WebSocket para actualizaciones en tiempo real
export class PublicationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  constructor(private onUpdate: (data: { screenId: string; version: number }) => void) {}
  
  connect() {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
      this.ws = new WebSocket(`${wsUrl}/publications`);
      
      this.ws.onopen = () => {
        console.log('Publication WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onUpdate(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onclose = () => {
        console.log('Publication WebSocket disconnected');
        this.reconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('Publication WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.reconnect();
    }
  }
  
  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default {
  getScreens,
  getScreen,
  getScreenLive,
  publishDesign,
  publishFromStore,
  getPublications,
  getPublication,
  getPublicationsByScreen,
  togglePublication,
  deletePublication,
  schedulePublication,
  getPublicationStats,
  previewOnScreens,
  PublicationWebSocket
};