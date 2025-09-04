import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Smartphone,
  Monitor,
  Tablet,
  Undo,
  Redo,
  Settings,
  Loader,
  Eye,
  X,
  ChevronLeft,
  Download,
  ChevronDown,
  FileImage,
  File,
  Sliders,

} from 'lucide-react';
import { designsService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import InternalEditor from './InternalEditor.tsx';
import DesignConfigModal from '../Designs/Editor/DesignConfigModal';
import toast from 'react-hot-toast';
import { internalEditorUtils, polotnoStore, useEditorStore } from '../../store/internalEditorStore';



const InternalDesignEditor = () => {
  const { id: designId } = useParams();
  const navigate = useNavigate();
  const { emit } = useSocket();
  
  // Estados principales
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentEditorData, setCurrentEditorData] = useState(null);
  
  // Estados de modales
  const [configModalOpen, setConfigModalOpen] = useState(false);
  
  // Estado para vista previa
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Estados para exportación
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalType, setExportModalType] = useState('png');
  const exportMenuRef = useRef(null);
  
  // Cerrar menú de exportación al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);
  
  // Funciones de exportación
  const handleExportPNG = async (options = { transparent: false }) => {
    try {
      // Si se requiere transparencia, temporalmente remover el fondo
      let originalBackground = null;
      if (options.transparent && polotnoStore.activePage) {
        originalBackground = polotnoStore.activePage.background;
        polotnoStore.activePage.set({ background: 'transparent' });
      }

      const dataURL = await polotnoStore.toDataURL({ 
        pixelRatio: 2,
        mimeType: 'image/png'
      });

      // Restaurar el fondo original si se removió
      if (originalBackground && polotnoStore.activePage) {
        polotnoStore.activePage.set({ background: originalBackground });
      }

      const link = document.createElement('a');
      link.download = `${design?.name || 'diseño-interno'}.png`;
      link.href = dataURL;
      link.click();
      toast.success('PNG exportado correctamente');
    } catch (error) {
      console.error('Error al exportar PNG:', error);
      toast.error('Error al exportar PNG');
    }
  };
  
  // Función de exportación JPEG eliminada - solo SVG permitido
  
  const handleExportSVG = async () => {
    try {
      const activePage = polotnoStore.activePage;
      if (!activePage) {
        toast.error('No hay página activa para exportar');
        return;
      }
      
      // Guardar el fondo actual
         const originalBackground = activePage.background;
         
         // Remover temporalmente el fondo para exportación transparente
         await polotnoStore.history.transaction(async () => {
           activePage.set({ background: 'transparent' });
         });
         
         // Exportar SVG sin fondo
         await polotnoStore.saveAsSVG();
         
         // Restaurar el fondo original
         await polotnoStore.history.transaction(async () => {
           activePage.set({ background: originalBackground });
         });
      
      toast.success('SVG exportado exitosamente sin fondo');
    } catch (error) {
      console.error('Error al exportar SVG:', error);
      toast.error('Error al exportar SVG');
    }
  };
  
  // Funciones de exportación JSON y PDF eliminadas - solo SVG permitido
  
  // Función para crear diseño con forma, exportar SVG y limpiar
  const createShapeDesignAndExport = async (shapeType = 'rect') => {
    try {
      // Limpiar el canvas actual
      polotnoStore.clear();
      
      // Crear nueva página con dimensiones estándar
      const page = polotnoStore.addPage();
      if (!page) {
        toast.error('Error al crear nueva página');
        return;
      }
      
      page.setSize({
        width: 800,
        height: 600,
        useMagic: true
      });
      
      // Agregar forma al centro del canvas
      let shapeElement;
      
      switch (shapeType) {
        case 'rect':
          shapeElement = {
            type: 'rect',
            x: 300,
            y: 200,
            width: 200,
            height: 200,
            fill: '#3B82F6', // Azul
            stroke: '#1E40AF',
            strokeWidth: 2
          };
          break;
        case 'circle':
          shapeElement = {
            type: 'circle',
            x: 300,
            y: 200,
            width: 200,
            height: 200,
            fill: '#EF4444', // Rojo
            stroke: '#DC2626',
            strokeWidth: 2
          };
          break;
        case 'triangle':
          shapeElement = {
            type: 'svg',
            x: 300,
            y: 200,
            width: 200,
            height: 200,
            src: 'data:image/svg+xml;base64,' + btoa(`
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,10 90,90 10,90" fill="#10B981" stroke="#059669" stroke-width="2"/>
              </svg>
            `)
          };
          break;
        default:
          shapeElement = {
            type: 'rect',
            x: 300,
            y: 200,
            width: 200,
            height: 200,
            fill: '#3B82F6',
            stroke: '#1E40AF',
            strokeWidth: 2
          };
      }
      
      // Agregar el elemento a la página
      page.addElement(shapeElement);
      
      toast.success(`Forma ${shapeType} creada exitosamente`);
      
      // Esperar un momento para que se renderice
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Exportar como SVG
      await handleExportSVG();
      
      // Esperar un momento antes de limpiar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Limpiar el diseño
      polotnoStore.clear();
      
      // Crear página vacía
      const newPage = polotnoStore.addPage();
      if (newPage) {
        newPage.setSize({
          width: 800,
          height: 600,
          useMagic: true
        });
      }
      
      toast.success('Diseño limpiado exitosamente');
      
    } catch (error) {
      console.error('Error en createShapeDesignAndExport:', error);
      toast.error('Error al crear y exportar el diseño');
    }
  };
  
  // Debug: función para mostrar dimensiones actuales
  const showCanvasDimensions = () => {
    const activePage = polotnoStore.activePage;
    if (activePage) {
      alert(`Dimensiones del canvas: ${activePage.width} x ${activePage.height}`);
      console.log('Canvas dimensions:', activePage.width, 'x', activePage.height);
      console.log('Total pages:', polotnoStore.pages.length);
    } else {
      alert('No hay página activa');
      console.log('No active page found');
    }
  };

  // Función para colapsar/expandir el panel lateral de Polotno
  const togglePolotnoSidePanel = () => {
    console.log('Toggle clicked, current openedSidePanel:', polotnoStore.openedSidePanel);
    
    if (polotnoStore.openedSidePanel) {
      polotnoStore.openSidePanel(''); // Cerrar panel
      console.log('Closing panel');
    } else {
      polotnoStore.openSidePanel('photos'); // Abrir panel por defecto
      console.log('Opening panel with photos');
    }
  };

  useEffect(() => {
    if (designId) {
      loadDesign();
    } else {
      // Redirigir a designs si no hay ID
      navigate('/internal-designs');
    }
  }, [designId, navigate]);

  // Prevenir salida accidental con cambios sin guardar
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (saving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saving]);

  const loadDesign = async () => {
    try {
      setLoading(true);
      const response = await designsService.getById(designId);
      const designData = response.data;
      
      setDesign(designData);
      
      // Cargar contenido JSON en el store de Polotno si existe
      let contentToLoad = null;
      
      if (designData.content) {
        // Si content es un objeto con propiedad json
        if (designData.content.json) {
          contentToLoad = designData.content.json;
        }
        // Si content es directamente el JSON de Polotno (nuevo formato)
        else if (designData.content.pages) {
          contentToLoad = designData.content;
        }
        // Si content es un string, parsearlo
        else if (typeof designData.content === 'string') {
          try {
            const parsed = JSON.parse(designData.content);
            contentToLoad = parsed.pages ? parsed : parsed.json;
          } catch (error) {
            console.error('Error parseando content:', error);
          }
        }
      }
      
      if (contentToLoad) {
        polotnoStore.loadJSON(contentToLoad);
      } else {
        // Si no hay contenido JSON, crear página con las dimensiones guardadas
        let content = designData.content;
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content);
          } catch (error) {
            console.error('Error parseando content:', error);
            content = {};
          }
        }
        
        const settings = content?.settings || {};
        const hasCustomDimensions = settings.canvasWidth && settings.canvasHeight;
        const width = settings.canvasWidth || 768;
        const height = settings.canvasHeight || 1366;
        const backgroundColor = settings.backgroundColor || '#ffffff';
        
        if (!hasCustomDimensions) {
          console.warn('⚠️ DISEÑO SIN DIMENSIONES PERSONALIZADAS - Usando valores por defecto');
        }
        
        internalEditorUtils.createPageWithDimensions(width, height, backgroundColor);
      }
      
    } catch (error) {
      console.error('Error cargando diseño:', error);
      toast.error('Error al cargar el diseño');
      navigate('/internal-designs');
    } finally {
      setLoading(false);
    }
  };

  const handleEditorDataChange = (newData) => {
    setCurrentEditorData(newData);
  };

  // Función para obtener datos actuales del editor Polotno
  const getCurrentEditorData = () => {
    try {
      const json = internalEditorUtils.saveDesign();
      return {
        content: json
      };
    } catch (error) {
      console.error('Error obteniendo datos del editor:', error);
      return null;
    }
  };

  // Función para generar vista previa
  const handlePreview = async () => {
    try {
      // Obtener dimensiones del canvas actual
      const activePage = polotnoStore.activePage;
      if (!activePage) {
        toast.error('No hay página activa para previsualizar');
        return;
      }

      // Generar imagen del canvas actual usando toDataURL
      const dataURL = await polotnoStore.toDataURL({
        pixelRatio: 1,
        mimeType: 'image/png',
        quality: 0.9
      });

      // Configurar datos de vista previa
      setPreviewData({
        imageUrl: dataURL,
        width: activePage.width,
        height: activePage.height,
        designName: design?.name || 'Diseño interno sin nombre',
        screenInfo: design?.screens || []
      });

      setShowPreview(true);
    } catch (error) {
      console.error('Error generando vista previa:', error);
      toast.error('Error al generar la vista previa');
    }
  };

  // Función para cerrar vista previa
  const closePreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  // Manejar tecla ESC para cerrar vista previa
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showPreview) {
        closePreview();
      }
    };

    if (showPreview) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showPreview]);

  const handleSave = async (editorData, isAutoSave = false) => {
    if (!design) return;
    
    try {
      setSaving(true);
      
      const designData = {
        ...design,
        content: editorData?.content || design.content
      };

      let response;
      if (designId) {
        response = await designsService.update(designId, designData);
      } else {
        response = await designsService.create(designData);
        // Redirigir al editor interno con el ID del diseño creado
        navigate(`/internal-designs/editor/${response.data.id}`, { replace: true });
      }
      
      setDesign(response.data);
      
      if (!isAutoSave) {
        toast.success('Diseño interno guardado correctamente');
      }
      
      // Emitir evento de actualización
      emit('design-updated', { designId: response.data.id });
      
    } catch (error) {
      console.error('Error guardando diseño:', error);
      if (!isAutoSave) {
        toast.error('Error al guardar el diseño interno');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/internal-designs');
  };

  const getViewportDimensions = () => {
    // Siempre usar las dimensiones del canvas desde la configuración del diseño
    if (design?.content?.settings?.canvasWidth && design?.content?.settings?.canvasHeight) {
      return { 
        width: design.content.settings.canvasWidth, 
        height: design.content.settings.canvasHeight 
      };
    }
    
    // Fallback por defecto
    return { width: 1920, height: 1080 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando editor interno...</p>
        </div>
      </div>
    );
  }

  // Si no hay designId, redirigir
  if (!designId) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar superior */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Lado izquierdo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="btn btn-outline btn-sm flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Volver
            </button>
            
            {/* Botón de debug */}
            <button
              onClick={showCanvasDimensions}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="Mostrar dimensiones del canvas"
            >
              Debug
            </button>
            

            
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {design?.name || 'Nuevo Diseño Interno'}
              </h1>
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Lado derecho */}
          <div className="flex items-center space-x-3">
            {/* Configuración */}
            <button
              onClick={() => setConfigModalOpen(true)}
              className="btn btn-outline btn-sm"
              title="Configuración del diseño"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Panel Lateral */}
            <button
              onClick={togglePolotnoSidePanel}
              className={`btn btn-outline btn-sm ${
                polotnoStore.openedSidePanel 
                  ? 'text-blue-600 bg-blue-50 border-blue-200' 
                  : ''
              }`}
              title="Mostrar/ocultar panel lateral"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${
                polotnoStore.openedSidePanel ? '' : 'rotate-180'
              }`} />
            </button>

            {/* Vista Previa */}
            <button
              onClick={handlePreview}
              className="btn btn-outline btn-sm"
              title="Vista previa del diseño"
            >
              <Eye className="h-4 w-4" />
            </button>

            {/* Exportar */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn btn-outline btn-sm flex items-center"
                title="Opciones de exportación"
              >
                <Download className="h-4 w-4 mr-1" />
                Exportar
                <ChevronDown className="h-3 w-3 ml-1" />
              </button>
              
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                  <button
                    onClick={() => {
                      handleExportPNG({ transparent: false });
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <FileImage className="h-4 w-4" />
                    PNG con fondo
                  </button>
                  <button
                    onClick={() => {
                      handleExportPNG({ transparent: true });
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 w-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <FileImage className="h-4 w-4" />
                    PNG sin fondo
                  </button>
                  <button
                    onClick={() => {
                      handleExportSVG();
                      setShowExportMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                  >
                    <File className="h-4 w-4" />
                    SVG
                  </button>
                </div>
              )}
            </div>

            {/* Guardar */}
            <button
              onClick={() => handleSave(getCurrentEditorData())}
              disabled={saving}
              className="btn btn-primary btn-sm flex items-center"
            >
              {saving ? (
                <Loader className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* Área principal del editor */}
      <div className="flex-1 relative">
        <InternalEditor
          design={design}
          onDataChange={handleEditorDataChange}
          onSave={handleSave}
          viewportDimensions={getViewportDimensions()}
        />
      </div>

      {/* Modal de configuración */}
      {configModalOpen && (
        <DesignConfigModal
          design={design}
          onClose={() => setConfigModalOpen(false)}
          onSave={(updatedDesign) => {
            setDesign(updatedDesign);
            setConfigModalOpen(false);
            // Recargar el diseño para aplicar las nuevas dimensiones
            loadDesign();
          }}
        />
      )}

      {/* Modal de vista previa */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Vista Previa - {previewData.designName}</h3>
              <button
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Dimensiones: {previewData.width} x {previewData.height} px
                </p>
              </div>
              <div className="flex justify-center">
                <img
                  src={previewData.imageUrl}
                  alt="Vista previa del diseño"
                  className="max-w-full max-h-[60vh] object-contain border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalDesignEditor;