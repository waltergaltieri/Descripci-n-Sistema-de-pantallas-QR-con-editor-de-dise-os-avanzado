import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Palette, 
  Edit, 
  Trash2, 
  Copy, 
  Eye,
  Monitor,
  Calendar,
  Search
} from 'lucide-react';
import { designsService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import TemplateModal from './TemplateModal';
import DesignPreconfigModal from './Editor/DesignPreconfigModal';
import toast from 'react-hot-toast';

const DesignsManager = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [preconfigModalOpen, setPreconfigModalOpen] = useState(false);
  
  const { useSocketEvent } = useSocket();

  // Escuchar eventos de Socket.io
  useSocketEvent('designs-updated', () => {
    loadDesigns();
  });

  useEffect(() => {
    loadDesigns();
  }, []);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const response = await designsService.getAll();
      setDesigns(response.data);
    } catch (error) {
      console.error('Error cargando diseños:', error);
      toast.error('Error al cargar los diseños');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDesign = async (design) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el diseño "${design.name}"?`)) {
      return;
    }

    try {
      await designsService.delete(design.id);
      toast.success('Diseño eliminado correctamente');
      loadDesigns();
    } catch (error) {
      console.error('Error eliminando diseño:', error);
      
      if (error.response?.status === 400) {
        toast.error('No se puede eliminar un diseño que está asignado a pantallas');
      } else {
        toast.error('Error al eliminar el diseño');
      }
    }
  };

  const handleDuplicateDesign = async (design) => {
    const newName = prompt('Nombre para el diseño duplicado:', `${design.name} (Copia)`);
    
    if (!newName || newName.trim() === '') {
      return;
    }

    try {
      await designsService.duplicate(design.id, newName.trim());
      toast.success('Diseño duplicado correctamente');
      loadDesigns();
    } catch (error) {
      console.error('Error duplicando diseño:', error);
      toast.error('Error al duplicar el diseño');
    }
  };

  const handleCreateDesign = async (preconfigData) => {
    try {
      const designData = {
        name: preconfigData.name,
        description: preconfigData.description || '',
        content: {
          elements: [],
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
      toast.success('Diseño creado correctamente');
      setPreconfigModalOpen(false);
      
      // Navegar al editor del nuevo diseño
      navigate(`/designs/editor/${response.data.id}`);
    } catch (error) {
      console.error('Error creando diseño:', error);
      toast.error('Error al crear el diseño');
    }
  };

  const filteredDesigns = useMemo(() => {
    return designs.filter(design => {
      const name = design.name || '';
      const description = design.description || '';
      const searchLower = searchTerm.toLowerCase();
      
      return name.toLowerCase().includes(searchLower) ||
             description.toLowerCase().includes(searchLower);
    });
  }, [designs, searchTerm]);

  const DesignCard = ({ design }) => {
    const assignedScreensCount = design.assigned_screens?.length || 0;
    
    return (
      <div className="card hover:shadow-lg transition-shadow duration-200">
        <div className="card-body">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                <Palette className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {design.name}
                </h3>
                {design.description && (
                  <p className="text-sm text-gray-600 mt-1">
                    {design.description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Estado de asignación */}
            {assignedScreensCount > 0 && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center">
                <Monitor className="w-3 h-3 mr-1" />
                {assignedScreensCount} pantalla{assignedScreensCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Información adicional */}
          <div className="flex items-center text-xs text-gray-500 space-x-4 mb-4">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Creado: {new Date(design.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Actualizado: {new Date(design.updated_at).toLocaleDateString()}
            </span>
          </div>

          {/* Pantallas asignadas */}
          {assignedScreensCount > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Asignado a:</p>
              <div className="flex flex-wrap gap-2">
                {design.assigned_screens.map((screen) => (
                  <span
                    key={screen.id}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {screen.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              {/* Editar */}
              <Link
                to={`/designs/editor/${design.id}`}
                className="btn btn-outline btn-sm flex items-center"
                title="Editar diseño"
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Link>

              {/* Duplicar */}
              <button
                onClick={() => handleDuplicateDesign(design)}
                className="btn btn-outline btn-sm flex items-center"
                title="Duplicar diseño"
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicar
              </button>
            </div>

            <div className="flex items-center space-x-2">
              {/* Vista previa */}
              <button
                onClick={() => {
                  // TODO: Implementar vista previa
                  toast('Vista previa próximamente');
                }}
                className="btn btn-outline btn-sm"
                title="Vista previa"
              >
                <Eye className="h-4 w-4" />
              </button>

              {/* Eliminar */}
              <button
                onClick={() => handleDeleteDesign(design)}
                className="btn btn-outline btn-sm text-red-600 hover:text-red-700"
                title="Eliminar diseño"
                disabled={assignedScreensCount > 0}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Diseños</h1>
          <p className="mt-1 text-sm text-gray-600">
            Crea y administra los diseños para tus pantallas
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTemplateModalOpen(true)}
            className="btn btn-secondary flex items-center"
          >
            <Palette className="h-4 w-4 mr-2" />
            Desde Plantilla
          </button>
          
          <button
            onClick={() => setPreconfigModalOpen(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Diseño
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar diseños..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>


      {/* Lista de diseños */}
      {filteredDesigns.length === 0 ? (
        <div className="text-center py-12">
          {searchTerm ? (
            <>
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron diseños
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Intenta con otros términos de búsqueda
              </p>
            </>
          ) : (
            <>
              <Palette className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay diseños
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primer diseño
              </p>
              <div className="mt-6 flex justify-center space-x-3">
                <button
                  onClick={() => setTemplateModalOpen(true)}
                  className="btn btn-secondary"
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Desde Plantilla
                </button>
                
                <button
                  onClick={() => setPreconfigModalOpen(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Diseño
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesigns.map((design) => (
            <DesignCard key={design.id} design={design} />
          ))}
        </div>
      )}

      {/* Modal de plantillas */}
      <TemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSuccess={loadDesigns}
      />

      {/* Modal de preconfiguración para nuevos diseños */}
      <DesignPreconfigModal
        isOpen={preconfigModalOpen}
        onConfirm={handleCreateDesign}
        onCancel={() => setPreconfigModalOpen(false)}
      />
    </div>
  );
};

export default DesignsManager;