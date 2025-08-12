import React from 'react';
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
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Type, 
  Image, 
  Square, 
  Layout, 
  Eye, 
  EyeOff, 
  Trash2, 
  GripVertical,
  Lock,
  Unlock
} from 'lucide-react';

// Componente para cada elemento sorteable
const SortableLayerItem = ({ element, isSelected, onSelect, onToggleVisibility, onToggleLock, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVisible = element.properties.visible !== false;
  const isLocked = element.properties.locked;

  const getElementIcon = () => {
    switch (element.type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'shape': return <Square className="w-4 h-4" />;
      case 'section': return <Layout className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'border-primary-500 bg-primary-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      } ${
        !isVisible ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center p-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={`mr-2 text-gray-400 hover:text-gray-600 ${
            isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-grab'
          }`}
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* Icono del elemento */}
        <div className={`mr-3 p-1 rounded ${
          isSelected ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {getElementIcon()}
        </div>

        {/* Información del elemento */}
        <div 
          className="flex-1 cursor-pointer"
          onClick={() => onSelect(element.id)}
        >
          <div className="text-sm font-medium text-gray-900">
            {element.properties.name || `${element.type.charAt(0).toUpperCase() + element.type.slice(1)} ${element.id.split('_')[1]}`}
          </div>
          <div className="text-xs text-gray-500">
            {element.width}×{element.height}px
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Visibilidad */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(element.id);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title={isVisible ? 'Ocultar' : 'Mostrar'}
          >
            {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Bloqueo */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(element.id);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title={isLocked ? 'Desbloquear' : 'Bloquear'}
          >
            {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>

          {/* Eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            className="p-1 text-red-400 hover:text-red-600 rounded"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const LayersPanel = ({ 
  elements, 
  selectedElementId, 
  onSelectElement, 
  onReorderElements, 
  onDeleteElement 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = elements.findIndex((item) => item.id === active.id);
      const newIndex = elements.findIndex((item) => item.id === over.id);

      onReorderElements(arrayMove(elements, oldIndex, newIndex));
    }
  };

  const handleToggleVisibility = (elementId) => {
    const updatedElements = elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          properties: {
            ...element.properties,
            visible: element.properties.visible !== false ? false : true
          }
        };
      }
      return element;
    });
    onReorderElements(updatedElements);
  };

  const handleToggleLock = (elementId) => {
    const updatedElements = elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          properties: {
            ...element.properties,
            locked: !element.properties.locked
          }
        };
      }
      return element;
    });
    onReorderElements(updatedElements);
  };

  const getElementIcon = (type) => {
    switch (type) {
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'container': return <Square className="w-4 h-4" />;
      case 'section': return <Layout className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const getElementName = (element) => {
    switch (element.type) {
      case 'text':
        const content = element.properties.content || 'Texto';
        return content.length > 20 ? content.substring(0, 20) + '...' : content;
      case 'image':
        return element.properties.alt || 'Imagen';
      case 'container':
        return 'Contenedor';
      case 'section':
        return `Sección (${element.properties.columns || 1} col)`;
      default:
        return element.type;
    }
  };

  if (elements.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <div className="mb-4">
          <Layout className="w-12 h-12 mx-auto text-gray-300" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Sin elementos
        </h3>
        <p className="text-xs text-gray-600">
          Agrega elementos desde el panel de elementos para verlos aquí
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">
          Capas ({elements.length})
        </h3>
        <p className="text-xs text-gray-600">
          Arrastra para reordenar, haz clic para seleccionar
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={elements.map(el => el.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {elements.map((element) => (
              <SortableLayerItem
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                onSelect={onSelectElement}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
                onDelete={onDeleteElement}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Acciones globales */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Elementos: {elements.length}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                // Mostrar todos los elementos
                const updatedElements = elements.map(element => ({
                  ...element,
                  properties: {
                    ...element.properties,
                    visible: true
                  }
                }));
                onReorderElements(updatedElements);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              Mostrar todos
            </button>
            <span className="text-gray-400">•</span>
            <button
              onClick={() => {
                // Desbloquear todos los elementos
                const updatedElements = elements.map(element => ({
                  ...element,
                  properties: {
                    ...element.properties,
                    locked: false
                  }
                }));
                onReorderElements(updatedElements);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              Desbloquear todos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayersPanel;