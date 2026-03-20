import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { polotnoStore, useEditorUIStore, editorUtils } from '../../store/editorStore';
import ExportModal from './ExportModal';
import toast from 'react-hot-toast';
import { 
  Save, 
  Upload, 
  Download, 
  Play, 
  Pause, 
  Grid3X3, 
  Ruler, 
  Eye, 
  EyeOff,
  PanelLeft,
  PanelRight,
  Undo,
  Redo,
  Settings,
  ChevronLeft,
  FileImage,
  FileText,
  File,
  ChevronDown,
  Sliders
} from 'lucide-react';

const TopBar: React.FC = observer(() => {
  const {
    showLeftPanel,
    showRightPanel,
    showGrid,
    showRulers,
    showGuides,
    previewMode,
    toggleLeftPanel,
    toggleRightPanel,
    toggleGrid,
    toggleRulers,
    toggleGuides,
    setPreviewMode
  } = useEditorUIStore();
  
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Función para colapsar/expandir el panel lateral de Polotno
  const togglePolotnoSidePanel = () => {
    if (polotnoStore.openedSidePanel) {
      polotnoStore.openSidePanel('');
    } else {
      polotnoStore.openSidePanel('photos'); // Abrir panel por defecto
    }
  };
  
  const handleSave = async () => {
    try {
      const designData = editorUtils.saveDesign();
      const thumbnail = await editorUtils.generateThumbnail() as string;
      
      // Aquí iría la llamada a la API para guardar
      console.log('Guardando diseño:', { designData, thumbnail });
      
      // TODO: Implementar llamada a PUT /api/designs/:id
    } catch (error) {
      console.error('Error al guardar:', error);
    }
  };
  
  const handleLoad = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string);
            editorUtils.loadDesign(json);
          } catch (error) {
            console.error('Error al cargar diseño:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportModalType, setExportModalType] = useState<'png' | 'jpeg' | 'svg' | 'pdf'>('png');

  // Cerrar menú de exportación al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
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

  const handleExportPNG = async (options?: { pixelRatio?: number; quality?: number; transparent?: boolean }) => {
    try {
      // Si se requiere transparencia, temporalmente remover el fondo
      let originalBackground = null;
      if (options?.transparent && polotnoStore.activePage) {
        originalBackground = polotnoStore.activePage.background;
        polotnoStore.activePage.set({ background: 'transparent' });
      }

      const dataURL = await polotnoStore.toDataURL({
        pixelRatio: options?.pixelRatio || 1,
        mimeType: 'image/png',
        quality: options?.quality || 1
      });

      // Restaurar el fondo original si se removió
      if (originalBackground && polotnoStore.activePage) {
        polotnoStore.activePage.set({ background: originalBackground });
      }

      const link = document.createElement('a');
      link.download = 'design.png';
      link.href = dataURL;
      link.click();
    } catch (error) {
      console.error('Error al exportar PNG:', error);
    }
  };

  const handleExportJPEG = async (options?: { pixelRatio?: number; quality?: number }) => {
    try {
      const dataURL = await polotnoStore.toDataURL({
        pixelRatio: options?.pixelRatio || 1,
        mimeType: 'image/jpeg',
        quality: options?.quality || 0.9
      });
      const link = document.createElement('a');
      link.download = 'design.jpg';
      link.href = dataURL;
      link.click();
    } catch (error) {
      console.error('Error al exportar JPEG:', error);
    }
  };

  const handleExportSVG = async (options?: { pixelRatio?: number; transparent?: boolean }) => {
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

  const handleExportJSON = () => {
    try {
      const json = polotnoStore.toJSON();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'design.json';
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar JSON:', error);
    }
  };

  const handleExportPDF = async (options?: { pixelRatio?: number }) => {
    try {
      // Para PDF, exportamos como PNG de alta resolución
      // En el futuro se puede integrar con jsPDF o similar
      const dataURL = await polotnoStore.toDataURL({
        pixelRatio: options?.pixelRatio || 2,
        mimeType: 'image/png'
      });
      const link = document.createElement('a');
      link.download = 'design.png'; // Nota: Para PDF real se necesitaría jsPDF
      link.href = dataURL;
      link.click();
    } catch (error) {
      console.error('Error al exportar PDF:', error);
    }
  };

  const handleAdvancedExport = (options: any) => {
    switch (exportModalType) {
      case 'png':
        handleExportPNG(options);
        break;
      case 'jpeg':
        handleExportJPEG(options);
        break;
      case 'svg':
        handleExportSVG(options);
        break;
      case 'pdf':
        handleExportPDF(options);
        break;
    }
  };

  const openExportModal = (type: 'png' | 'jpeg' | 'svg' | 'pdf') => {
    setExportModalType(type);
    setShowExportModal(true);
    setShowExportMenu(false);
  };
  
  const handlePublish = async () => {
    try {
      const pngData = await editorUtils.exportPNG() as string;
      
      // TODO: Implementar llamada a POST /api/publish
      console.log('Publicando diseño:', pngData);
    } catch (error) {
      console.error('Error al publicar:', error);
    }
  };
  
  const canUndo = polotnoStore.history.canUndo;
  const canRedo = polotnoStore.history.canRedo;
  
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      {/* Logo y título */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-semibold text-gray-800">Editor de Diseños</h1>
      </div>
      
      {/* Controles centrales */}
      <div className="flex items-center space-x-2">
        {/* Archivo */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
          <button
            onClick={handleSave}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Guardar (Ctrl+S)"
          >
            <Save size={18} />
          </button>
          <button
            onClick={handleLoad}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Cargar diseño"
          >
            <Upload size={18} />
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors flex items-center"
              title="Opciones de exportación"
            >
              <Download size={18} />
              <ChevronDown size={14} className="ml-1" />
            </button>
            
            {showExportMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
                <button
                  onClick={() => {
                    handleExportPNG();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <FileImage size={16} />
                  PNG (Rápido)
                </button>
                <button
                  onClick={() => openExportModal('png')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <Sliders size={16} />
                  PNG (Opciones)
                </button>
                <button
                  onClick={() => {
                    handleExportJPEG();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <FileImage size={16} />
                  JPEG (Rápido)
                </button>
                <button
                  onClick={() => openExportModal('jpeg')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <Sliders size={16} />
                  JPEG (Opciones)
                </button>
                <button
                  onClick={() => {
                    handleExportSVG();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <File size={16} />
                  SVG (Rápido)
                </button>
                <button
                  onClick={() => openExportModal('svg')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <Sliders size={16} />
                  SVG (Opciones)
                </button>
                <button
                  onClick={() => {
                    handleExportJSON();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <FileText size={16} />
                  JSON
                </button>
                <button
                  onClick={() => {
                    handleExportPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <File size={16} />
                  PDF (Rápido)
                </button>
                <button
                  onClick={() => openExportModal('pdf')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <Sliders size={16} />
                  PDF (Opciones)
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Historial */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
          <button
            onClick={() => polotnoStore.history.undo()}
            disabled={!canUndo}
            className={`p-2 rounded transition-colors ${
              canUndo 
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Deshacer (Ctrl+Z)"
          >
            <Undo size={18} />
          </button>
          <button
            onClick={() => polotnoStore.history.redo()}
            disabled={!canRedo}
            className={`p-2 rounded transition-colors ${
              canRedo 
                ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' 
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Rehacer (Ctrl+Y)"
          >
            <Redo size={18} />
          </button>
        </div>
        
        {/* Vista */}
        <div className="flex items-center space-x-1 border-r border-gray-200 pr-3">
          <button
            onClick={toggleGrid}
            className={`p-2 rounded transition-colors ${
              showGrid 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Mostrar/ocultar grid"
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={toggleRulers}
            className={`p-2 rounded transition-colors ${
              showRulers 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Mostrar/ocultar reglas"
          >
            <Ruler size={18} />
          </button>
          <button
            onClick={toggleGuides}
            className={`p-2 rounded transition-colors ${
              showGuides 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Mostrar/ocultar guías"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={togglePolotnoSidePanel}
            className={`p-2 rounded transition-colors ${
              polotnoStore.openedSidePanel 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Mostrar/ocultar panel lateral"
          >
            <ChevronLeft size={18} className={polotnoStore.openedSidePanel ? '' : 'rotate-180'} />
          </button>
        </div>
        
        {/* Preview */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`p-2 rounded transition-colors ${
              previewMode 
                ? 'text-green-600 bg-green-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Modo preview"
          >
            {previewMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      
      {/* Controles derechos */}
      <div className="flex items-center space-x-2">
        {/* Paneles */}
        <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
          <button
            onClick={toggleLeftPanel}
            className={`p-2 rounded transition-colors ${
              showLeftPanel 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Panel izquierdo"
          >
            <PanelLeft size={18} />
          </button>
          <button
            onClick={toggleRightPanel}
            className={`p-2 rounded transition-colors ${
              showRightPanel 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Panel derecho"
          >
            <PanelRight size={18} />
          </button>
        </div>
        
        {/* Publicar */}
        <button
          onClick={handlePublish}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
        >
          Publicar
        </button>
      </div>
      
      {/* Modal de exportación */}
      {showExportModal && (
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleAdvancedExport}
          exportType={exportModalType}
        />
      )}
    </div>
  );
});

export default TopBar;