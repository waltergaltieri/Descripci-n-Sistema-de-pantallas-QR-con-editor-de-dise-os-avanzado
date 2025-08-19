import React from 'react';
import { observer } from 'mobx-react-lite';
import { polotnoStore, useEditorUIStore, editorUtils } from '../../store/editorStore';
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
  ChevronLeft
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
  
  const handleExport = async () => {
    try {
      const dataURL = await editorUtils.exportPNG() as string;
      const link = document.createElement('a');
      link.download = 'design.png';
      link.href = dataURL;
      link.click();
    } catch (error) {
      console.error('Error al exportar:', error);
    }
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
          <button
            onClick={handleExport}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="Exportar PNG"
          >
            <Download size={18} />
          </button>
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
    </div>
  );
});

export default TopBar;