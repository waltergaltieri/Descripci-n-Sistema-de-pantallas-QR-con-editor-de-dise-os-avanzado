import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { designsService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import { 
  ArrowLeft, 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCcw,
  ExternalLink,
  Settings,
  Wifi,
  WifiOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DesignPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewport, setViewport] = useState('desktop'); // desktop, tablet, mobile
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    loadDesign();
  }, [id]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDesign(false); // No mostrar loading en auto-refresh
      }, 5000); // Refresh cada 5 segundos
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const loadDesign = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const response = await designsService.getById(id);
      setDesign(response.data);
    } catch (error) {
      console.error('Error loading design:', error);
      setError('Error al cargar el diseño');
      toast.error('Error al cargar el diseño');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const getViewportDimensions = () => {
    switch (viewport) {
      case 'mobile':
        return { width: 375, height: 667 };
      case 'tablet':
        return { width: 768, height: 1024 };
      case 'desktop':
      default:
        return { width: 1920, height: 1080 };
    }
  };

  const renderElement = (element) => {
    if (element.properties?.visible === false) {
      return null;
    }

    const baseStyle = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      zIndex: element.zIndex || 1,
    };

    switch (element.type) {
      case 'text':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              fontSize: `${element.properties.fontSize || 16}px`,
              fontFamily: element.properties.fontFamily || 'Arial, sans-serif',
              fontWeight: element.properties.fontWeight || 'normal',
              color: element.properties.color || '#000000',
              textAlign: element.properties.textAlign || 'left',
              lineHeight: element.properties.lineHeight || '1.5',
              display: 'flex',
              alignItems: element.properties.verticalAlign === 'middle' ? 'center' : 
                         element.properties.verticalAlign === 'bottom' ? 'flex-end' : 'flex-start',
              justifyContent: element.properties.textAlign === 'center' ? 'center' : 
                            element.properties.textAlign === 'right' ? 'flex-end' : 'flex-start',
              padding: `${element.properties.padding || 0}px`,
              backgroundColor: element.properties.backgroundColor || 'transparent',
              borderRadius: `${element.properties.borderRadius || 0}px`,
              border: element.properties.borderWidth ? 
                `${element.properties.borderWidth}px solid ${element.properties.borderColor || '#000000'}` : 'none',
              boxShadow: element.properties.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {element.properties.content || 'Texto'}
          </div>
        );

      case 'image':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              borderRadius: `${element.properties.borderRadius || 0}px`,
              overflow: 'hidden',
              backgroundColor: element.properties.backgroundColor || 'transparent',
              border: element.properties.borderWidth ? 
                `${element.properties.borderWidth}px solid ${element.properties.borderColor || '#000000'}` : 'none',
              boxShadow: element.properties.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {element.properties.src ? (
              <img
                src={element.properties.src}
                alt={element.properties.alt || 'Imagen'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: element.properties.objectFit || 'cover',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              style={{
                width: '100%',
                height: '100%',
                display: element.properties.src ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '14px',
              }}
            >
              Sin imagen
            </div>
          </div>
        );

      case 'container':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.properties.backgroundColor || 'transparent',
              borderRadius: `${element.properties.borderRadius || 0}px`,
              padding: `${element.properties.padding || 0}px`,
              border: element.properties.borderWidth ? 
                `${element.properties.borderWidth}px solid ${element.properties.borderColor || '#000000'}` : 'none',
              boxShadow: element.properties.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {/* Los contenedores pueden tener elementos hijos en el futuro */}
          </div>
        );

      case 'section':
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.properties.backgroundColor || 'transparent',
              borderRadius: `${element.properties.borderRadius || 0}px`,
              padding: `${element.properties.padding || 0}px`,
              display: 'grid',
              gridTemplateColumns: `repeat(${element.properties.columns || 1}, 1fr)`,
              gap: `${element.properties.gap || 0}px`,
              border: element.properties.borderWidth ? 
                `${element.properties.borderWidth}px solid ${element.properties.borderColor || '#000000'}` : 'none',
              boxShadow: element.properties.shadow ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {/* Las secciones pueden tener elementos hijos en el futuro */}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando diseño...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error al cargar el diseño
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => loadDesign()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Reintentar
            </button>
            <button
              onClick={() => navigate('/designs')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Volver a diseños
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dimensions = getViewportDimensions();
  const elements = design.content ? JSON.parse(design.content) : [];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/designs')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            
            <div className="h-6 w-px bg-gray-300" />
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {design.name}
              </h1>
              <p className="text-sm text-gray-600">
                Vista previa del diseño
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Conexión Socket */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span>{isConnected ? 'Conectado' : 'Desconectado'}</span>
            </div>

            {/* Auto-refresh */}
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Auto-actualizar</span>
            </label>

            {/* Refresh manual */}
            <button
              onClick={() => loadDesign()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              title="Actualizar"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Editar */}
            <button
              onClick={() => navigate(`/designs/${id}/edit`)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Settings className="w-4 h-4" />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Viewport selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Vista:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewport('desktop')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${
                    viewport === 'desktop'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>Escritorio</span>
                </button>
                <button
                  onClick={() => setViewport('tablet')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${
                    viewport === 'tablet'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Tablet className="w-4 h-4" />
                  <span>Tablet</span>
                </button>
                <button
                  onClick={() => setViewport('mobile')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded text-sm ${
                    viewport === 'mobile'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Móvil</span>
                </button>
              </div>
            </div>

            {/* Zoom */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Zoom:</span>
              <select
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value={25}>25%</option>
                <option value={50}>50%</option>
                <option value={75}>75%</option>
                <option value={100}>100%</option>
                <option value={125}>125%</option>
                <option value={150}>150%</option>
                <option value={200}>200%</option>
              </select>
            </div>

            {/* Grid toggle */}
            <label className="flex items-center space-x-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Mostrar cuadrícula</span>
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {dimensions.width} × {dimensions.height}px
            </span>
            <span className="text-sm text-gray-600">
              Elementos: {elements.length}
            </span>
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="flex justify-center">
          <div
            className="bg-white shadow-lg rounded-lg overflow-hidden"
            style={{
              width: `${(dimensions.width * zoom) / 100}px`,
              height: `${(dimensions.height * zoom) / 100}px`,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
          >
            <div
              className="relative"
              style={{
                width: `${dimensions.width}px`,
                height: `${dimensions.height}px`,
                backgroundImage: showGrid 
                  ? 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)'
                  : 'none',
                backgroundSize: showGrid ? '20px 20px' : 'auto',
                backgroundColor: design.backgroundColor || '#ffffff',
              }}
            >
              {elements.map(renderElement)}
              
              {elements.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-lg">Diseño vacío</p>
                    <p className="text-sm">No hay elementos para mostrar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info panel */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>Creado: {new Date(design.createdAt).toLocaleDateString()}</span>
            <span>Actualizado: {new Date(design.updatedAt).toLocaleDateString()}</span>
            {design.assignedScreens && design.assignedScreens.length > 0 && (
              <span>Asignado a {design.assignedScreens.length} pantalla(s)</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {autoRefresh && (
              <span className="text-green-600">Auto-actualizando cada 5s</span>
            )}
            <button
              onClick={() => window.open(`/screen-display/${design.id}`, '_blank')}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir en nueva ventana</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignPreview;