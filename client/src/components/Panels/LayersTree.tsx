import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { DeleteElementCommand, UpdateElementCommand, DuplicateElementCommand } from '../../commands';
import type { CanvasElement } from '../../types/editor';
import './LayersTree.css';

interface LayerItemProps {
  element: CanvasElement;
  level: number;
  isSelected: boolean;
  onSelect: (elementId: string, multiSelect: boolean) => void;
  onRename: (elementId: string, newName: string) => void;
  onToggleVisibility: (elementId: string) => void;
  onToggleLock: (elementId: string) => void;
  onDelete: (elementId: string) => void;
  onDuplicate: (elementId: string) => void;
  composition: any;
  selection: any;
}

const LayerItem: React.FC<LayerItemProps> = ({
  element,
  level,
  isSelected,
  onSelect,
  onRename,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  composition,
  selection
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(element.name);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleNameSubmit = () => {
    if (editName.trim() && editName !== element.name) {
      onRename(element.id, editName.trim());
    } else {
      setEditName(element.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(element.name);
      setIsEditing(false);
    }
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'shape': return '⬜';
      case 'container': return '📦';
      case 'qr': return '📱';
      case 'group': return '📁';
      default: return '❓';
    }
  };

  const hasChildren = element.type === 'group' && element.children && element.children.length > 0;

  return (
    <div className="layer-item-container">
      <div 
        className={`layer-item ${isSelected ? 'selected' : ''} ${element.locked ? 'locked' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={(e) => onSelect(element.id, e.ctrlKey || e.metaKey)}
      >
        {/* Expand/Collapse button */}
        {hasChildren && (
          <button
            className={`expand-button ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            ▶
          </button>
        )}
        
        {/* Element icon */}
        <span className="element-icon">
          {getElementIcon(element.type)}
        </span>
        
        {/* Element name */}
        {isEditing ? (
          <input
            className="name-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className="element-name"
            onDoubleClick={() => setIsEditing(true)}
          >
            {element.name}
          </span>
        )}
        
        {/* Actions */}
        <div className="layer-actions">
          <button
            className={`action-button visibility ${element.visible ? 'visible' : 'hidden'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility(element.id);
            }}
            title={element.visible ? 'Ocultar' : 'Mostrar'}
          >
            {element.visible ? '👁️' : '🙈'}
          </button>
          
          <button
            className={`action-button lock ${element.locked ? 'locked' : 'unlocked'}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock(element.id);
            }}
            title={element.locked ? 'Desbloquear' : 'Bloquear'}
          >
            {element.locked ? '🔒' : '🔓'}
          </button>
          
          <button
            className="action-button duplicate"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(element.id);
            }}
            title="Duplicar"
          >
            📋
          </button>
          
          <button
            className="action-button delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.id);
            }}
            title="Eliminar"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && isExpanded && element.children && (
        <div className="layer-children">
          {element.children.map((childId: string) => {
            const childElement = composition.elements[childId];
            if (!childElement) return null;
            return (
              <LayerItem
                   key={childElement.id}
                   element={childElement}
                   level={level + 1}
                   isSelected={selection.selectedIds.includes(childElement.id)}
                   onSelect={onSelect}
                   onRename={onRename}
                   onToggleVisibility={onToggleVisibility}
                   onToggleLock={onToggleLock}
                   onDelete={onDelete}
                   onDuplicate={onDuplicate}
                   composition={composition}
                   selection={selection}
                 />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const LayersTree: React.FC = () => {
  // Mock data for now - in real implementation this would come from Polotno store
  const composition = { 
    screens: [{}], 
    elementOrder: [] as string[], 
    elements: {} as { [key: string]: any } 
  };
  const selection = { selectedIds: [] as string[] };
  const executeCommand = (command: any) => console.log('Execute command:', command);
  const selectElement = (id: string) => console.log('Select element:', id);
  const selectMultiple = (ids: string[]) => console.log('Select multiple:', ids);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const currentScreen = composition.screens[0]; // Use first screen for now
  const elements = composition.elementOrder.map((id: string) => composition.elements[id]).filter(Boolean);

  const filteredElements = elements.filter((element: any) => {
    const matchesSearch = element.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || element.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleSelect = (elementId: string, multiSelect: boolean) => {
    if (multiSelect) {
      if (selection.selectedIds.includes(elementId)) {
        const newSelection = selection.selectedIds.filter((id: string) => id !== elementId);
        selectMultiple(newSelection);
      } else {
        selectMultiple([...selection.selectedIds, elementId]);
      }
    } else {
      selectElement(elementId);
    }
  };

  const handleRename = (elementId: string, newName: string) => {
    executeCommand(new UpdateElementCommand(elementId, { name: newName }));
  };

  const handleToggleVisibility = (elementId: string) => {
    const element = elements.find((el: any) => el.id === elementId);
    if (element) {
      executeCommand(new UpdateElementCommand(elementId, { visible: !element.visible }));
    }
  };

  const handleToggleLock = (elementId: string) => {
    const element = elements.find((el: any) => el.id === elementId);
    if (element) {
      executeCommand(new UpdateElementCommand(elementId, { locked: !element.locked }));
    }
  };

  const handleDelete = (elementId: string) => {
    executeCommand(new DeleteElementCommand(elementId));
  };

  const handleDuplicate = (elementId: string) => {
    executeCommand(new DuplicateElementCommand(elementId));
  };

  return (
    <div className="layers-tree">
      {/* Search and filter */}
      <div className="layers-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar capas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="text">Texto</option>
          <option value="image">Imagen</option>
          <option value="shape">Forma</option>
          <option value="container">Contenedor</option>
          <option value="qr">QR</option>
          <option value="group">Grupo</option>
        </select>
      </div>
      
      {/* Layers list */}
      <div className="layers-list">
        {filteredElements.length === 0 ? (
          <div className="empty-state">
            {searchTerm || filterType !== 'all' ? (
              <p>No se encontraron elementos que coincidan con los filtros.</p>
            ) : (
              <p>No hay elementos en esta pantalla. Arrastra elementos desde la paleta para comenzar.</p>
            )}
          </div>
        ) : (
          filteredElements.map((element: any) => (
            <LayerItem
          key={element.id}
          element={element}
          level={0}
          isSelected={selection.selectedIds.includes(element.id)}
          onSelect={handleSelect}
          onRename={handleRename}
          onToggleVisibility={handleToggleVisibility}
          onToggleLock={handleToggleLock}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          composition={composition}
          selection={selection}
        />
          ))
        )}
      </div>
      
      {/* Layer count */}
      <div className="layers-footer">
        <span className="layer-count">
          {filteredElements.length} de {elements.length} elementos
        </span>
      </div>
    </div>
  );
};