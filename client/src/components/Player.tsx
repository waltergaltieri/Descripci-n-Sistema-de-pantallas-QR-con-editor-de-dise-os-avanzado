import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getScreenLive, PublicationWebSocket } from '../services/api/publish';

interface PlayerProps {
  screenId?: string; // Opcional si se pasa por props en lugar de URL
}

interface ScreenContent {
  imageUrl: string;
  version: number;
  updatedAt: string;
}

const Player: React.FC<PlayerProps> = ({ screenId: propScreenId }) => {
  const { screenId: urlScreenId } = useParams<{ screenId: string }>();
  const screenId = propScreenId || urlScreenId;
  
  const [content, setContent] = useState<ScreenContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wsConnected, setWsConnected] = useState(false);
  
  // WebSocket para actualizaciones en tiempo real
  const [ws, setWs] = useState<PublicationWebSocket | null>(null);
  
  // Función para cargar contenido
  const loadContent = useCallback(async () => {
    if (!screenId) {
      setError('ID de pantalla no proporcionado');
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const screenContent = await getScreenLive(screenId);
      setContent(screenContent);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading screen content:', err);
      setError(err.message || 'Error al cargar el contenido de la pantalla');
      setLoading(false);
    }
  }, [screenId]);
  
  // Configurar WebSocket
  useEffect(() => {
    if (!screenId) return;
    
    const websocket = new PublicationWebSocket((data) => {
      // Solo actualizar si es para nuestra pantalla
      if (data.screenId === screenId) {
        console.log('Received WebSocket update for screen:', screenId, 'version:', data.version);
        loadContent();
      }
    });
    
    websocket.connect();
    setWs(websocket);
    setWsConnected(true);
    
    return () => {
      websocket.disconnect();
      setWsConnected(false);
    };
  }, [screenId, loadContent]);
  
  // Polling de respaldo cada 15 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!wsConnected && isOnline) {
        console.log('WebSocket not connected, using polling fallback');
        loadContent();
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [loadContent, wsConnected, isOnline]);
  
  // Detectar cambios en la conectividad
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      loadContent();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadContent]);
  
  // Cargar contenido inicial
  useEffect(() => {
    loadContent();
  }, [loadContent]);
  
  // Manejar teclas para debugging (solo en desarrollo)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'development') {
        switch (e.key) {
          case 'r':
          case 'R':
            // Recargar contenido manualmente
            loadContent();
            break;
          case 'f':
          case 'F':
            // Toggle fullscreen
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
            break;
          case 'i':
          case 'I':
            // Mostrar información de debug
            console.log('Screen ID:', screenId);
            console.log('Content:', content);
            console.log('Last Update:', lastUpdate);
            console.log('WebSocket Connected:', wsConnected);
            console.log('Online:', isOnline);
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [screenId, content, lastUpdate, wsConnected, isOnline, loadContent]);
  
  // Entrar en fullscreen automáticamente en producción
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
  }, []);
  
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Cargando contenido...</p>
          <p className="text-sm opacity-75 mt-2">Pantalla: {screenId}</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="fixed inset-0 bg-red-900 flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Error de Conexión</h1>
          <p className="text-lg mb-4">{error}</p>
          <p className="text-sm opacity-75 mb-6">Pantalla: {screenId}</p>
          <button
            onClick={loadContent}
            className="bg-red-700 hover:bg-red-600 px-6 py-3 rounded-lg transition-colors"
          >
            Reintentar
          </button>
          {!isOnline && (
            <p className="text-sm mt-4 opacity-75">Sin conexión a internet</p>
          )}
        </div>
      </div>
    );
  }
  
  if (!content) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-6xl mb-4">📺</div>
          <h1 className="text-2xl font-bold mb-4">Sin Contenido</h1>
          <p className="text-lg mb-4">No hay contenido publicado para esta pantalla</p>
          <p className="text-sm opacity-75">Pantalla: {screenId}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Imagen principal */}
      <img
        src={content.imageUrl}
        alt="Contenido de pantalla"
        className="w-full h-full object-cover"
        style={{
          objectFit: 'cover',
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1
        }}
        onError={(e) => {
          console.error('Error loading image:', content.imageUrl);
          setError('Error al cargar la imagen');
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', content.imageUrl);
        }}
      />
      
      {/* Indicadores de estado (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-10 bg-black bg-opacity-75 text-white p-3 rounded-lg text-xs space-y-1">
          <div>Pantalla: {screenId}</div>
          <div>Versión: {content.version}</div>
          <div>Actualizado: {new Date(content.updatedAt).toLocaleTimeString()}</div>
          <div>WebSocket: {wsConnected ? '🟢' : '🔴'}</div>
          <div>Online: {isOnline ? '🟢' : '🔴'}</div>
          <div className="text-xs opacity-75 mt-2">
            R: Recargar | F: Fullscreen | I: Info
          </div>
        </div>
      )}
      
      {/* Overlay de reconexión */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-10 bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
          Sin conexión - Reintentando...
        </div>
      )}
    </div>
  );
};

export default Player;