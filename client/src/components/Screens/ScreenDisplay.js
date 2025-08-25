import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { screensService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

const ScreenDisplay = () => {
  const { id: screenId } = useParams();
  const [screen, setScreen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { connected, joinScreen, leaveScreen, useSocketEvent } = useSocket();

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
      joinScreen(`screen-${screenId}`);
      return () => leaveScreen(`screen-${screenId}`);
    }
  }, [screenId, joinScreen, leaveScreen]);

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
      
      // Obtener dimensiones de la pantalla
      const screenWidth = screen.width || 1920;
      const screenHeight = screen.height || 1080;
      
      // Nuevo formato de GrapesJS con HTML y CSS
      if (content.html && content.css) {
        return (
          <div 
            className="design-renderer h-full w-full"
            style={{
              width: `${screenWidth}px`,
              height: `${screenHeight}px`,
              transform: `scale(${Math.min(window.innerWidth / screenWidth, window.innerHeight / screenHeight)})`,
              transformOrigin: 'top left'
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: content.css }} />
            <div dangerouslySetInnerHTML={{ __html: content.html }} />
          </div>
        );
      }
      
      // Formato de Polotno (con pages)
      if (content.pages && content.pages.length > 0) {
        return renderPolotnoContent(content, screenWidth, screenHeight);
      }
      
      // Formato anterior (para compatibilidad)
      if (content.elements) {
        return renderElements(content.elements, screenWidth, screenHeight);
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

  // Renderizar contenido de Polotno
  const renderPolotnoContent = (content, screenWidth, screenHeight) => {
    if (!content.pages || content.pages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">
              Sin páginas
            </h2>
            <p className="text-gray-500">
              El diseño no contiene páginas válidas
            </p>
          </div>
        </div>
      );
    }

    // Renderizar la primera página
    const page = content.pages[0];
    const designWidth = content.width || 768;
    const designHeight = content.height || 1366;
    
    // Calcular escala para ajustar al tamaño de la pantalla
    const scaleX = screenWidth / designWidth;
    const scaleY = screenHeight / designHeight;
    const scale = Math.min(scaleX, scaleY); // Mantener proporción
    
    // Calcular posición para centrar el contenido
    const scaledWidth = designWidth * scale;
    const scaledHeight = designHeight * scale;
    const offsetX = (screenWidth - scaledWidth) / 2;
    const offsetY = (screenHeight - scaledHeight) / 2;

    return (
      <div 
        className="design-renderer"
        style={{
          width: `${screenWidth}px`,
          height: `${screenHeight}px`,
          backgroundColor: '#000000' // Fondo negro para las barras
        }}
      >
        <div
          className="relative bg-white"
          style={{
            width: `${designWidth}px`,
            height: `${designHeight}px`,
            backgroundColor: page.fill || '#ffffff',
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
          {page.children && page.children.map((element, index) => 
            renderPolotnoElement(element, index)
          )}
        </div>
      </div>
    );
  };

  // Renderizar elemento individual de Polotno
  const renderPolotnoElement = (element, index) => {
    const style = {
      position: 'absolute',
      left: `${element.x || 0}px`,
      top: `${element.y || 0}px`,
      width: `${element.width || 100}px`,
      height: `${element.height || 100}px`,
      transform: element.rotation ? `rotate(${element.rotation}deg)` : 'none',
      opacity: element.opacity !== undefined ? element.opacity : 1,
      zIndex: element.zIndex || 1,
    };

    // Renderizar según el tipo de elemento
    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              fontSize: `${element.fontSize || 16}px`,
              fontFamily: element.fontFamily || 'Arial, sans-serif',
              fontWeight: element.fontWeight || 'normal',
              fontStyle: element.fontStyle || 'normal',
              color: element.fill || '#000000',
              textAlign: element.align || 'left',
              lineHeight: element.lineHeight || 1.2,
              letterSpacing: element.letterSpacing ? `${element.letterSpacing}px` : 'normal',
              textDecoration: element.textDecoration || 'none',
              display: 'flex',
              alignItems: element.verticalAlign === 'middle' ? 'center' : 
                         element.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
              justifyContent: element.align === 'center' ? 'center' : 
                            element.align === 'right' ? 'flex-end' : 'flex-start',
              padding: '4px',
              wordWrap: 'break-word',
              overflow: 'hidden'
            }}
          >
            {element.text || 'Texto'}
          </div>
        );

      case 'image':
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              overflow: 'hidden',
              borderRadius: element.cornerRadius ? `${element.cornerRadius}px` : '0px'
            }}
          >
            <img
              src={element.src}
              alt="Imagen del diseño"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: element.filters ? element.filters.join(' ') : 'none'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        );

      case 'svg':
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              overflow: 'hidden'
            }}
            dangerouslySetInnerHTML={{ __html: element.src }}
          />
        );

      case 'group':
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              overflow: 'visible'
            }}
          >
            {element.children && element.children.map((child, childIndex) => 
              renderPolotnoElement(child, `${index}-${childIndex}`)
            )}
          </div>
        );

      case 'rectangle':
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              backgroundColor: element.fill || 'transparent',
              border: element.stroke ? `${element.strokeWidth || 1}px solid ${element.stroke}` : 'none',
              borderRadius: element.cornerRadius ? `${element.cornerRadius}px` : '0px'
            }}
          />
        );

      case 'circle':
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              backgroundColor: element.fill || 'transparent',
              border: element.stroke ? `${element.strokeWidth || 1}px solid ${element.stroke}` : 'none',
              borderRadius: '50%'
            }}
          />
        );

      case 'line':
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              height: `${element.strokeWidth || 1}px`,
              backgroundColor: element.stroke || '#000000',
              transformOrigin: 'left center'
            }}
          />
        );

      case 'triangle':
      case 'star':
      case 'polygon':
        // Para formas complejas, intentar renderizar como SVG si está disponible
        if (element.src) {
          return (
            <div
              key={element.id || index}
              style={{
                ...style,
                overflow: 'hidden'
              }}
              dangerouslySetInnerHTML={{ __html: element.src }}
            />
          );
        }
        // Si no hay SVG, crear una forma básica usando CSS
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              backgroundColor: element.fill || 'transparent',
              border: element.stroke ? `${element.strokeWidth || 1}px solid ${element.stroke}` : 'none',
              clipPath: element.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' :
                       element.type === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' :
                       'none'
            }}
          />
        );

      default:
        // Para elementos no reconocidos, renderizar un placeholder
        return (
          <div
            key={element.id || index}
            style={{
              ...style,
              backgroundColor: element.fill || 'transparent',
              border: '1px dashed #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#666'
            }}
          >
            {element.type || 'Elemento'}
          </div>
        );
    }
  };

  // Renderizar elementos del diseño
  const renderElements = (elements, screenWidth, screenHeight) => {
    // Para elementos legacy, asumir dimensiones estándar si no están especificadas
    const designWidth = 1920;
    const designHeight = 1080;
    
    // Calcular escala
    const scaleX = screenWidth / designWidth;
    const scaleY = screenHeight / designHeight;
    const scale = Math.min(scaleX, scaleY);
    
    // Calcular offset para centrar
    const scaledWidth = designWidth * scale;
    const scaledHeight = designHeight * scale;
    const offsetX = (screenWidth - scaledWidth) / 2;
    const offsetY = (screenHeight - scaledHeight) / 2;

    return (
      <div 
        className="design-renderer"
        style={{
          width: `${screenWidth}px`,
          height: `${screenHeight}px`,
          backgroundColor: '#000000'
        }}
      >
        <div
          className="relative"
          style={{
            width: `${designWidth}px`,
            height: `${designHeight}px`,
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
          {elements.map((element, index) => {
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
                    className=""
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
                    className=""
                  >
                    {element.children && renderElements(element.children, designWidth, designHeight)}
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
                        {column.elements && renderElements(column.elements, designWidth, designHeight)}
                      </div>
                    ))}
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>
      </div>
    );
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
      <div className="relative w-full h-full">
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