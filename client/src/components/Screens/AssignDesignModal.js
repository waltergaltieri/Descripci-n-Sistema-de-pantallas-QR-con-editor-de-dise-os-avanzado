import React, { useState, useEffect } from 'react';
import { X, Palette, Search } from 'lucide-react';
import { screensService } from '../../services/api';
import toast from 'react-hot-toast';

const AssignDesignModal = ({ isOpen, onClose, screen, designs, onSuccess }) => {
  const [selectedDesignId, setSelectedDesignId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && screen) {
      setSelectedDesignId(screen.design_id || '');
      setSearchTerm('');
    }
  }, [isOpen, screen]);

  const filteredDesigns = designs.filter(design =>
    design.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    design.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedDesignId) {
      toast.error('Por favor selecciona un diseño');
      return;
    }

    setLoading(true);
    
    try {
      await screensService.assignDesign(screen.id, selectedDesignId);
      toast.success('Diseño asignado correctamente');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error asignando diseño:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al asignar el diseño');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen || !screen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Asignar Diseño
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Pantalla: {screen.name}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Barra de búsqueda */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar diseños..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Lista de diseños */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredDesigns.length === 0 ? (
              <div className="text-center py-8">
                <Palette className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchTerm ? 'No se encontraron diseños' : 'No hay diseños disponibles'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Crea un diseño primero para poder asignarlo'
                  }
                </p>
              </div>
            ) : (
              filteredDesigns.map((design) => (
                <div
                  key={design.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                    selectedDesignId === design.id
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDesignId(design.id)}
                >
                  <div className="flex items-start">
                    {/* Radio button */}
                    <div className="flex items-center h-5">
                      <input
                        type="radio"
                        name="design"
                        value={design.id}
                        checked={selectedDesignId === design.id}
                        onChange={() => setSelectedDesignId(design.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                        disabled={loading}
                      />
                    </div>
                    
                    {/* Información del diseño */}
                    <div className="ml-3 flex-1">
                      <div className="flex items-center">
                        <h4 className="text-sm font-medium text-gray-900">
                          {design.name}
                        </h4>
                        {screen.design_id === design.id && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Actual
                          </span>
                        )}
                      </div>
                      
                      {design.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {design.description}
                        </p>
                      )}
                      
                      <div className="flex items-center mt-2 text-xs text-gray-500 space-x-4">
                        <span>
                          Creado: {new Date(design.created_at).toLocaleDateString()}
                        </span>
                        <span>
                          Actualizado: {new Date(design.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Icono */}
                    <div className="ml-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Palette className="w-5 h-5 text-primary-600" />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Información adicional */}
          {selectedDesignId && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Nota:</strong> Al asignar este diseño, se removerá cualquier diseño previamente asignado a esta pantalla.
              </p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedDesignId}
            className="btn btn-primary flex items-center"
          >
            {loading && <div className="loading-spinner mr-2" />}
            Asignar Diseño
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignDesignModal;