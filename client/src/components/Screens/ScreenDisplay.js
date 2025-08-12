import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { screensService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

const ScreenDisplay = () => {
  const { screenId } = useParams();
  const [screen, setScreen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { connected, joinRoom, leaveRoom, useSocketEvent } = useSocket();

  // Cargar datos de la pantalla
  const loadScreen = useCallback(async () => {
    try {
      setError(null);
      const response = await screensService.getById(screenId);
      setScreen(response.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando pantalla:', error);
      setError(error.response?.data?.error || 'Error al cargar la pantalla');
    } finally {
      setLoading(false);
    }
  }, [screenId]);

  // Unirse a la sala de la pantalla para recibir actualizaciones
  useEffect(() => {
    if (screenId) {
      joinRoom(`screen-${screenId}`);
      return () => leaveRoom(`screen-${screenId}`);
    }
  }, [screenId, joinRoom, leaveRoom]);

  // Escuchar eventos de Socket.io
  useSocketEvent('screen-config-updated', (data) => {
    if (data.screenId === parseInt(screenId)) {
      loadScreen();
    }
  });

  useSocketEvent('design-updated', (data) => {
    if (screen && screen.design_id === data.designId) {
      loadScreen();
    }
  });

  useSocketEvent('design-content-updated', (data) => {
    if (screen && screen.design_id === data.designId) {
      loadScreen();
    }
  });

  useSocketEvent('design-removed', (data) => {
    if (data.screenId === parseInt(screenId)) {
      loadScreen();
    }
  });

  // Cargar pantalla inicial
  useEffect(() => {
    loadScreen();
  }, [loadScreen]);

  // Auto-refresh basado en el intervalo configurado
  useEffect(() => {
    if (screen && screen.refresh_interval) {
      const interval = setInterval(() => {
        loadScreen();
      }, screen.refresh_interval * 1000);

      return () => clearInterval(interval);
    }
  }, [screen, loadScreen]);

  // Renderizar el contenido del diseño
  const renderDesignContent = () => {
    if (!screen.design_content) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              Sin contenido
            </h2>
            <p className="text-gray-500">
              Esta pantalla no tiene un diseño asignado
            </p>
          </div>
        </div>
      );
    }

    try {
      const content = JSON.parse(screen.design_content);
      
      // Nuevo formato de GrapesJS con HTML y CSS
      if (content.html && content.css) {
        return (
          <div className="design-renderer h-full w-full">
            <style dangerouslySetInnerHTML={{ __html: content.css }} />
            <div dangerouslySetInnerHTML={{ __html: content.html }} />
          </div>
        );
      }
      
      // Formato anterior (para compatibilidad)
      if (content.elements) {
        return (
          <div className="design-renderer h-full w-full">
            {renderElements(content.elements)}
          </div>
        );
      }
      
      // Sin contenido válido
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              Sin contenido
            </h2>
            <p className="text-gray-500">
              El diseño no contiene elementos válidos
            </p>
          </div>
        </div>
      );
    } catch (error) {
      console.error('Error parseando contenido del diseño:', error);
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-semibold text-red-600 mb-2">
              Error en el diseño
            </h2>
            <p className="text-red-500">
              No se pudo cargar el contenido del diseño
            </p>
          </div>
        </div>
      );
    }
  };

  // Renderizar elementos del diseño
  const renderElements = (elements) => {
    return elements.map((element, index) => {
      const style = {
        position: 'absolute',
        left: `${element.x || 0}px`,
        top: `${element.y || 0}px`,
        width: `${element.width || 100}px`,
        height: `${element.height || 100}px`,
        zIndex: element.zIndex || 1,
        ...element.style,
      };

      switch (element.type) {
        case 'text':
          return (
            <div
              key={element.id || index}
              style={style}
              className="flex items-center justify-center"
            >
              <span
                style={{
                  fontSize: element.fontSize || '16px',
                  fontWeight: element.fontWeight || 'normal',
                  color: element.color || '#000000',
                  textAlign: element.textAlign || 'left',
                  fontFamily: element.fontFamily || 'inherit',
                }}
              >
                {element.content || 'Texto'}
              </span>
            </div>
          );

        case 'image':
          return (
            <div
              key={element.id || index}
              style={style}
              className="overflow-hidden"
            >
              <img
                src={element.src}
                alt={element.alt || 'Imagen'}
                className="w-full h-full object-cover"
                style={{
                  objectFit: element.objectFit || 'cover',
                  borderRadius: element.borderRadius || '0px',
                }}
              />
            </div>
          );

        case 'container':
          return (
            <div
              key={element.id || index}
              style={{
                ...style,
                backgroundColor: element.backgroundColor || 'transparent',
                borderRadius: element.borderRadius || '0px',
                border: element.border || 'none',
              }}
              className="overflow-hidden"
            >
              {element.children && renderElements(element.children)}
            </div>
          );

        case 'section':
          return (
            <div
              key={element.id || index}
              style={style}
              className="flex"
            >
              {element.columns && element.columns.map((column, colIndex) => (
                <div
                  key={colIndex}
                  style={{
                    flex: `0 0 ${100 / element.columns.length}%`,
                    padding: element.columnPadding || '10px',
                  }}
                >
                  {column.elements && renderElements(column.elements)}
                </div>
              ))}
            </div>
          );

        default:
          return null;
      }
    });
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="screen-display loading">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="loading-spinner mb-4" />
            <p className="text-gray-600">Cargando pantalla...</p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div className="screen-display error">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-red-400 mb-4" />
            <h2 className="text-2xl font-semibold text-red-600 mb-2">
              Error
            </h2>
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadScreen}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla inactiva
  if (!screen.is_active) {
    return (
      <div className="screen-display inactive">
        <div className="flex items-center justify-center h-full bg-gray-900">
          <div className="text-center text-white">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">
              Pantalla Inactiva
            </h2>
            <p className="text-gray-400">
              Esta pantalla está temporalmente desactivada
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen-display active">
      {/* Indicador de conexión (solo visible si no está conectado) */}
      {!connected && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center">
          <WifiOff className="h-4 w-4 mr-2" />
          <span className="text-sm">Sin conexión</span>
        </div>
      )}

      {/* Contenido principal */}
      <div className="relative w-full h-full overflow-hidden">
        {renderDesignContent()}
      </div>

      {/* Información de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-xs">
          <div>Pantalla: {screen.name}</div>
          <div>ID: {screen.id}</div>
          <div>Diseño: {screen.design_name || 'Sin asignar'}</div>
          <div>Última actualización: {lastUpdate.toLocaleTimeString()}</div>
          <div className="flex items-center mt-1">
            {connected ? (
              <><Wifi className="h-3 w-3 mr-1" /> Conectado</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenDisplay;