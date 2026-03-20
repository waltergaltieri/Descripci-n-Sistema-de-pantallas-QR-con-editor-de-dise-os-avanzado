import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Monitor, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  GripVertical,
  ExternalLink,
  Palette
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { screensService, designsService } from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import ScreenModal from './ScreenModal';
import AssignDesignModal from './AssignDesignModal';
import toast from 'react-hot-toast';

// Componente SortableScreenItem
const SortableScreenItem = ({ screen, onEdit, onDelete, onToggleActive, onAssignDesign, onRemoveDesign, openScreenPreview, getScreenUrl }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screen.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card transition-shadow duration-200 ${
        isDragging ? 'shadow-lg' : 'hover:shadow-md'
      }`}
    >
      <div className="card-body">
        <div className="flex items-center justify-between">
          {/* Información de la pantalla */}
          <div className="flex items-center flex-1">
            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="mr-4 p-1 text-gray-400 hover:text-gray-600 cursor-grab"
            >
              <GripVertical className="h-5 w-5" />
            </div>

            {/* Estado */}
            <div className={`w-3 h-3 rounded-full mr-3 ${
                screen.is_active ? 'bg-blue-400' : 'bg-gray-400'
              }`} />

            {/* Detalles */}
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {screen.name}
                </h3>
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  screen.is_active 
                    ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
                }`}>
                  {screen.is_active ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {screen.description}
              </p>
              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                <span>Orden: {screen.display_order}</span>
                <span>Refresco: {screen.refresh_interval}s</span>
                {screen.design_name ? (
                  <span className="flex items-center">
                    <Palette className="h-3 w-3 mr-1" />
                    {screen.design_name}
                  </span>
                ) : (
                  <span className="text-orange-600">Sin diseño asignado</span>
                )}
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-2">
            {/* Vista previa */}
            <button
              onClick={() => openScreenPreview(screen.id)}
              className="btn btn-outline btn-sm"
              title="Vista previa"
            >
              <ExternalLink className="h-4 w-4" />
            </button>

            {/* Toggle activo/inactivo */}
            <button
              onClick={() => onToggleActive(screen)}
              className={`btn btn-sm ${
                screen.is_active ? 'btn-outline' : 'btn-success'
              }`}
              title={screen.is_active ? 'Desactivar' : 'Activar'}
            >
              {screen.is_active ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>

            {/* Asignar/Quitar diseño */}
            {screen.design_id ? (
              <button
                onClick={() => onRemoveDesign(screen)}
                className="btn btn-outline btn-sm text-orange-600 hover:bg-orange-50"
                title="Quitar diseño"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onAssignDesign(screen)}
                className="btn btn-success btn-sm"
                title="Asignar diseño"
              >
                <Palette className="h-4 w-4" />
              </button>
            )}

            {/* Editar */}
            <button
              onClick={() => onEdit(screen)}
              className="btn btn-outline btn-sm"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </button>

            {/* Eliminar */}
            <button
              onClick={() => onDelete(screen)}
              className="btn btn-outline btn-sm text-red-600 hover:bg-red-50"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
         </div>

         {/* URL de la pantalla */}
         <div className="mt-4 p-3 bg-gray-50 rounded-lg">
           <p className="text-xs text-gray-500 mb-1">URL de la pantalla:</p>
           <code className="text-sm text-gray-700 break-all">
             {getScreenUrl(screen.id)}
           </code>
         </div>
       </div>
     </div>
   );
 };

const ScreensManager = () => {
  const [screens, setScreens] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState(null);
  
  const { useSocketEvent } = useSocket();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Escuchar eventos de Socket.io
  useSocketEvent('screens-updated', () => {
    loadScreens();
  });

  useSocketEvent('designs-updated', () => {
    loadDesigns();
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadScreens(), loadDesigns()]);
  };

  const loadScreens = async () => {
    try {
      setLoading(true);
      const response = await screensService.getAll();
      setScreens(response.data);
    } catch (error) {
      console.error('Error cargando pantallas:', error);
      toast.error('Error al cargar las pantallas');
    } finally {
      setLoading(false);
    }
  };

  const loadDesigns = async () => {
    try {
      const response = await designsService.getAll();
      setDesigns(response.data);
    } catch (error) {
      console.error('Error cargando diseños:', error);
    }
  };

  const handleCreateScreen = () => {
    setSelectedScreen(null);
    setModalOpen(true);
  };

  const handleEditScreen = (screen) => {
    setSelectedScreen(screen);
    setModalOpen(true);
  };

  const handleDeleteScreen = async (screen) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la pantalla "${screen.name}"?`)) {
      return;
    }

    try {
      await screensService.delete(screen.id);
      toast.success('Pantalla eliminada correctamente');
      loadScreens();
    } catch (error) {
      console.error('Error eliminando pantalla:', error);
      toast.error('Error al eliminar la pantalla');
    }
  };

  const handleToggleActive = async (screen) => {
    try {
      await screensService.update(screen.id, {
        ...screen,
        is_active: !screen.is_active
      });
      toast.success(`Pantalla ${!screen.is_active ? 'activada' : 'desactivada'} correctamente`);
      loadScreens();
    } catch (error) {
      console.error('Error actualizando pantalla:', error);
      toast.error('Error al actualizar la pantalla');
    }
  };

  const handleAssignDesign = (screen) => {
    setSelectedScreen(screen);
    setAssignModalOpen(true);
  };

  const handleRemoveDesign = async (screen) => {
    if (!window.confirm(`¿Estás seguro de que quieres quitar el diseño de la pantalla "${screen.name}"?`)) {
      return;
    }

    try {
      await screensService.removeDesign(screen.id);
      toast.success('Diseño removido correctamente');
      loadScreens();
    } catch (error) {
      console.error('Error removiendo diseño:', error);
      toast.error('Error al remover el diseño');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = screens.findIndex(screen => screen.id === active.id);
    const newIndex = screens.findIndex(screen => screen.id === over.id);

    const newScreens = arrayMove(screens, oldIndex, newIndex);
    
    // Actualizar el estado local inmediatamente para mejor UX
    setScreens(newScreens);

    try {
      // Enviar el nuevo orden al servidor
      const screenIds = newScreens.map(screen => screen.id);
      await screensService.reorder(screenIds);
      toast.success('Orden actualizado correctamente');
    } catch (error) {
      console.error('Error reordenando pantallas:', error);
      toast.error('Error al actualizar el orden');
      // Revertir el cambio local
      loadScreens();
    }
  };

  const getScreenUrl = (screenId) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/screen-display/${screenId}`;
  };

  const openScreenPreview = (screenId) => {
    const url = getScreenUrl(screenId);
    window.open(url, '_blank');
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Pantallas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Administra las pantallas del sistema y asigna diseños
          </p>
        </div>
        <button
          onClick={handleCreateScreen}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Pantalla
        </button>
      </div>

      {/* Lista de pantallas */}
      {screens.length === 0 ? (
        <div className="text-center py-12">
          <Monitor className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pantallas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando tu primera pantalla
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateScreen}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Pantalla
            </button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={screens.map(screen => screen.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {screens.map((screen) => (
                <SortableScreenItem
                  key={screen.id}
                  screen={screen}
                  onEdit={handleEditScreen}
                  onDelete={handleDeleteScreen}
                  onToggleActive={handleToggleActive}
                  onAssignDesign={handleAssignDesign}
                  onRemoveDesign={handleRemoveDesign}
                  openScreenPreview={openScreenPreview}
                  getScreenUrl={getScreenUrl}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modales */}
      <ScreenModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        screen={selectedScreen}
        onSuccess={loadScreens}
      />

      <AssignDesignModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        screen={selectedScreen}
        designs={designs}
        onSuccess={loadScreens}
      />
    </div>
  );
};

export default ScreensManager;