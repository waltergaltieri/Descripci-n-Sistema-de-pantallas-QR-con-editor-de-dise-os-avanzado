import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save,
  ArrowLeft,
  Plus,
  Eye,
  Smartphone,
  Monitor,
  Tablet,
  Undo,
  Redo,
  Settings,
  Loader
} from 'lucide-react';
import { designsService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import GrapesJSEditor from './Editor/GrapesJSEditor';
import DesignSettingsModal from './Editor/DesignSettingsModal';
import DesignPreconfigModal from './Editor/DesignPreconfigModal';
import toast from 'react-hot-toast';

const DesignEditor = () => {
  const { id: designId } = useParams();
  const navigate = useNavigate();
  const { emitEvent } = useSocket();
  
  // Estados principales
  const [design, setDesign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Estados de modales
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [preconfigModalOpen, setPreconfigModalOpen] = useState(false);
  
  // Estado para vista previa
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (designId) {
      loadDesign();
    } else {
      // Nuevo diseño - mostrar modal de preconfiguración
      setPreconfigModalOpen(true);
      setLoading(false);
    }
  }, [designId]);

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
      
    } catch (error) {
      console.error('Error cargando diseño:', error);
      toast.error('Error al cargar el diseño');
      navigate('/designs');
    } finally {
      setLoading(false);
    }
  };

  const handlePreconfigConfirm = async (preconfigData) => {
    try {
      const designData = {
        name: preconfigData.name,
        description: preconfigData.description || '',
        content: {
          html: '<div class="container"><h1>Bienvenido a tu diseño</h1><p>Comienza a editar arrastrando elementos desde el panel lateral.</p></div>',
          css: `
            .container {
              padding: 20px;
              max-width: ${preconfigData.width}px;
              height: ${preconfigData.height}px;
              margin: 0 auto;
              background: #ffffff;
            }
            h1 {
              color: #333;
              font-family: Arial, sans-serif;
              margin-bottom: 20px;
            }
            p {
              color: #666;
              font-family: Arial, sans-serif;
              line-height: 1.6;
            }
          `,
          components: null,
          settings: {
            backgroundColor: '#ffffff',
            backgroundImage: null,
            canvasWidth: preconfigData.width,
            canvasHeight: preconfigData.height,
            screenSizeName: preconfigData.screenSizeName,
            orientation: preconfigData.orientation
          }
        }
      };

      const response = await designsService.create(designData);
      setDesign(response.data);
      setPreconfigModalOpen(false);
      toast.success('Diseño creado correctamente');
      
    } catch (error) {
      console.error('Error creando diseño:', error);
      toast.error('Error al crear el diseño');
    }
  };

  const handlePreconfigCancel = () => {
    setPreconfigModalOpen(false);
    navigate('/designs');
  };

  const handleSave = async (editorData, isAutoSave = false) => {
    if (!design) return;
    
    try {
      setSaving(true);
      
      const designData = {
        ...design,
        content: {
          ...design.content,
          html: editorData?.html || design.content.html,
          css: editorData?.css || design.content.css,
          components: editorData?.components || design.content.components
        }
      };

      let response;
      if (designId) {
        response = await designsService.update(designId, designData);
      } else {
        response = await designsService.create(designData);
        // Redirigir al editor con el ID del diseño creado
        navigate(`/designs/editor/${response.data.id}`, { replace: true });
      }
      
      setDesign(response.data);
      
      if (!isAutoSave) {
        toast.success('Diseño guardado correctamente');
      }
      
      // Emitir evento de actualización
      emitEvent('design-updated', { designId: response.data.id });
      
    } catch (error) {
      console.error('Error guardando diseño:', error);
      if (!isAutoSave) {
        toast.error('Error al guardar el diseño');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/designs');
  };

  const handlePreview = (previewData) => {
    setPreviewData(previewData);
    setShowPreview(true);
    
    // Abrir en nueva ventana
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vista Previa - ${design?.name || 'Diseño'}</title>
          <style>
            body { margin: 0; padding: 0; }
            ${previewData.css}
          </style>
        </head>
        <body>
          ${previewData.html}
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
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
          <p className="text-gray-600">Cargando editor...</p>
        </div>
      </div>
    );
  }

  // Si es un nuevo diseño y no se ha completado la preconfiguración, no mostrar el editor
  if (!designId && !design) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <DesignPreconfigModal
          isOpen={preconfigModalOpen}
          onConfirm={handlePreconfigConfirm}
          onCancel={handlePreconfigCancel}
        />
      </div>
    );
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
            
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {design?.name || 'Nuevo Diseño'}
          </h1>
            </div>
          </div>

          <div className="flex-1"></div>

          {/* Lado derecho */}
          <div className="flex items-center space-x-3">
            {/* Configuración */}
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="btn btn-outline btn-sm"
              title="Configuración del diseño"
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Vista previa */}
            <button
              onClick={() => {
                // TODO: Implementar vista previa
                toast('Vista previa próximamente');
              }}
              className="btn btn-secondary btn-sm flex items-center"
            >
              <Eye className="h-4 w-4 mr-1" />
              Vista Previa
            </button>

            {/* Guardar */}
            <button
              onClick={() => handleSave(null)}
              disabled={saving}
              className="btn btn-primary btn-sm flex items-center"
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Guardar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Área principal - Editor GrapesJS */}
       <div className="flex-1 overflow-hidden">
         <GrapesJSEditor
           design={design}
           onSave={handleSave}
           onPreview={handlePreview}
           saving={saving}
         />
       </div>

      {/* Modal de configuración */}
      <DesignSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        design={design}
        onUpdateDesign={(updatedDesign) => {
          setDesign(updatedDesign);
        }}
      />

      {/* Modal de preconfiguración para nuevos diseños */}
      <DesignPreconfigModal
        isOpen={preconfigModalOpen}
        onConfirm={handlePreconfigConfirm}
        onCancel={handlePreconfigCancel}
      />
    </div>
  );
};

export default DesignEditor;