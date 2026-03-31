import React, { useState, useEffect } from 'react';
import { X, Palette, FileText, Image, Layout, Loader } from 'lucide-react';
import { designsService } from '../../services/api';
import toast from 'react-hot-toast';

const TemplateModal = ({ isOpen, onClose, onSuccess }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [designName, setDesignName] = useState('');
  const [designDescription, setDesignDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setSelectedTemplate(null);
      setDesignName('');
      setDesignDescription('');
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await designsService.getTemplates();
      setTemplates(response.data);
    } catch (error) {
      console.error('Error cargando plantillas:', error);
      toast.error('Error al cargar las plantillas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Selecciona una plantilla');
      return;
    }

    if (!designName.trim()) {
      toast.error('Ingresa un nombre para el diseño');
      return;
    }

    try {
      setCreating(true);
      await designsService.createFromTemplate({
        templateId: selectedTemplate.id,
        name: designName.trim(),
        description: designDescription.trim()
      });
      
      toast.success('Diseño creado desde plantilla correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creando diseño desde plantilla:', error);
      toast.error('Error al crear el diseño desde plantilla');
    } finally {
      setCreating(false);
    }
  };

  const getTemplateIcon = (type) => {
    switch (type) {
      case 'basic':
        return <Layout className="w-6 h-6" />;
      case 'text':
        return <FileText className="w-6 h-6" />;
      case 'image':
        return <Image className="w-6 h-6" />;
      default:
        return <Palette className="w-6 h-6" />;
    }
  };

  const getTemplateColor = (type) => {
    switch (type) {
      case 'basic':
        return 'bg-blue-100 text-blue-600';
      case 'text':
        return 'bg-blue-100 text-blue-600';
      case 'image':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Crear desde Plantilla
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Selecciona una plantilla para comenzar tu diseño
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selección de plantilla */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Plantillas Disponibles
                </h3>
                
                {templates.length === 0 ? (
                  <div className="text-center py-8">
                    <Palette className="mx-auto h-12 w-12 text-gray-400" />
                    <h4 className="mt-2 text-sm font-medium text-gray-900">
                      No hay plantillas disponibles
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Las plantillas se cargarán automáticamente cuando estén disponibles
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 hover:shadow-md ${
                          selectedTemplate?.id === template.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        {/* Icono de tipo */}
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3 ${
                          getTemplateColor(template.type)
                        }`}>
                          {getTemplateIcon(template.type)}
                        </div>

                        {/* Información */}
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {template.name}
                        </h4>
                        {template.description && (
                          <p className="text-xs text-gray-600 mb-2">
                            {template.description}
                          </p>
                        )}

                        {/* Etiqueta de tipo */}
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {template.type}
                        </span>

                        {/* Indicador de selección */}
                        {selectedTemplate?.id === template.id && (
                          <div className="absolute top-2 right-2">
                            <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Formulario de creación */}
              {selectedTemplate && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Información del Diseño
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">
                        Nombre del diseño *
                      </label>
                      <input
                        type="text"
                        value={designName}
                        onChange={(e) => setDesignName(e.target.value)}
                        placeholder="Ej: Pantalla Principal"
                        className="input"
                        maxLength={100}
                      />
                    </div>
                    
                    <div>
                      <label className="label">
                        Descripción (opcional)
                      </label>
                      <input
                        type="text"
                        value={designDescription}
                        onChange={(e) => setDesignDescription(e.target.value)}
                        placeholder="Descripción del diseño"
                        className="input"
                        maxLength={255}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="btn btn-outline"
            disabled={creating}
          >
            Cancelar
          </button>
          
          <button
            onClick={handleCreateFromTemplate}
            disabled={!selectedTemplate || !designName.trim() || creating}
            className="btn btn-primary flex items-center"
          >
            {creating ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Palette className="h-4 w-4 mr-2" />
                Crear Diseño
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
