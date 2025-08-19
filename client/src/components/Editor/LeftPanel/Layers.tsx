import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { polotnoStore } from '../../../store/editorStore';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  Trash2, 
  Edit3,
  ChevronDown,
  ChevronRight,
  Type,
  Image,
  Square,
  Circle,
  Star,
  QrCode,
  Folder
} from 'lucide-react';

interface LayerItemProps {
  element: any;
  level: number;
  isSelected: boolean;
  onSelect: (element: any) => void;
  onToggleVisibility: (element: any) => void;
  onToggleLock: (element: any) => void;
  onDuplicate: (element: any) => void;
  onDelete: (element: any) => void;
  onRename: (element: any) => void;
}

const LayerItem: React.FC<LayerItemProps> = observer(({
  element,
  level,
  isSelected,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDuplicate,
  onDelete,
  onRename
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(element.name || element.type);
  
  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'rect': return Square;
      case 'circle': return Circle;
      case 'star': return Star;
      case 'qr': return QrCode;
      case 'group': return Folder;
      default: return Square;
    }
  };
  
  const IconComponent = getElementIcon(element.type);
  const hasChildren = element.children && element.children.length > 0;
  
  const handleNameSubmit = () => {
    element.set({ name: editName });
    setIsEditing(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(element.name || element.type);
      setIsEditing(false);
    }
  };
  
  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 hover:bg-gray-50 cursor-pointer group ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(element)}
      >
        {/* Expand/Collapse para grupos */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-1 hover:bg-gray-200 rounded mr-1"
          >
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
        ) : (
          <div className="w-6" />
        )}
        
        {/* Icono del elemento */}
        <IconComponent size={16} className="text-gray-500 mr-2" />
        
        {/* Nombre del elemento */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={handleKeyDown}
              className="w-full px-1 py-0 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <span 
              className="text-sm text-gray-700 truncate block"
              onDoubleClick={() => setIsEditing(true)}
            >
              {element.name || element.type}
            </span>
          )}
        </div>
        
        {/* Controles */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Visibilidad */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(element);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title={element.visible ? 'Ocultar' : 'Mostrar'}
          >
            {element.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          
          {/* Bloqueo */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(element);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title={element.locked ? 'Desbloquear' : 'Bloquear'}
          >
            {element.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          
          {/* Duplicar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(element);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="Duplicar"
          >
            <Copy size={12} />
          </button>
          
          {/* Renombrar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-1 hover:bg-gray-200 rounded"
            title="Renombrar (F2)"
          >
            <Edit3 size={12} />
          </button>
          
          {/* Eliminar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element);
            }}
            className="p-1 hover:bg-red-200 rounded text-red-600"
            title="Eliminar"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
      
      {/* Elementos hijos */}
      {hasChildren && isExpanded && (
        <div>
          {element.children.map((child: any, index: number) => (
            <LayerItem
              key={child.id || index}
              element={child}
              level={level + 1}
              isSelected={polotnoStore.selectedElements.includes(child)}
              onSelect={onSelect}
              onToggleVisibility={onToggleVisibility}
              onToggleLock={onToggleLock}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </div>
  );
});

const Layers: React.FC = observer(() => {
  const activePage = polotnoStore.activePage;
  const elements = activePage?.children || [];
  
  const handleSelectElement = (element: any) => {
    polotnoStore.selectElements([element]);
  };
  
  const handleToggleVisibility = (element: any) => {
    element.set({ visible: !element.visible });
  };
  
  const handleToggleLock = (element: any) => {
    element.set({ locked: !element.locked });
  };
  
  const handleDuplicate = (element: any) => {
    const elementData = element.toJSON();
    const newElement = {
      ...elementData,
      x: elementData.x + 20,
      y: elementData.y + 20,
      name: `${elementData.name || elementData.type} (copia)`
    };
    activePage?.addElement(newElement);
  };
  
  const handleDelete = (element: any) => {
    polotnoStore.activePage?.children.remove(element);
  };
  
  const handleRename = (element: any) => {
    // Esta función se maneja en el componente LayerItem
  };
  
  // Función para mover elementos (drag & drop)
  const moveElement = (dragIndex: number, hoverIndex: number) => {
    // TODO: Implementar drag & drop para reordenar elementos
    console.log('Mover elemento de', dragIndex, 'a', hoverIndex);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Capas
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {elements.length} elemento{elements.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      {/* Lista de capas */}
      <div className="flex-1 overflow-y-auto">
        {elements.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No hay elementos</p>
            <p className="text-xs mt-1">Agrega elementos desde la paleta</p>
          </div>
        ) : (
          <div className="py-2">
            {/* Renderizar elementos en orden inverso (arriba = mayor z-index) */}
            {[...elements].reverse().map((element: any, index: number) => (
              <LayerItem
                key={element.id || index}
                element={element}
                level={0}
                isSelected={polotnoStore.selectedElements.includes(element)}
                onSelect={handleSelectElement}
                onToggleVisibility={handleToggleVisibility}
                onToggleLock={handleToggleLock}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
                onRename={handleRename}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer con acciones */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <span>Arrastra para reordenar</span>
          <span>Doble clic para renombrar</span>
        </div>
      </div>
    </div>
  );
});

export default Layers;