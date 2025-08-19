import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import { AddElementCommand } from '../../commands';
import { createDefaultElement } from '../../utils/elements';
import { generateId } from '../../utils/id';
import type { ElementType } from '../../types/editor';
import './ElementsPalette.css';

interface ElementTypeInfo {
  type: ElementType;
  label: string;
  icon: string;
  description: string;
}

const ELEMENT_TYPES: ElementTypeInfo[] = [
  {
    type: 'text',
    label: 'Texto',
    icon: '📝',
    description: 'Agregar texto'
  },
  {
    type: 'image',
    label: 'Imagen',
    icon: '🖼️',
    description: 'Agregar imagen'
  },
  {
    type: 'shape',
    label: 'Forma',
    icon: '⬜',
    description: 'Agregar forma geométrica'
  },
  {
    type: 'container',
    label: 'Contenedor',
    icon: '📦',
    description: 'Agregar contenedor'
  },
  {
    type: 'qr',
    label: 'Código QR',
    icon: '📱',
    description: 'Agregar código QR'
  }
];

export const ElementsPalette: React.FC = () => {
  // Mock data for now - in real implementation this would come from Polotno store
  const executeCommand = (command: any) => console.log('Execute command:', command);
  const viewport = { x: 0, y: 0, width: 800, height: 600, zoom: 1 };

  const handleElementDragStart = (e: React.DragEvent, elementType: ElementType) => {
    e.dataTransfer.setData('application/element-type', elementType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleElementClick = (elementType: ElementType) => {
    // Agregar elemento en el centro del viewport
    const centerX = (800 / 2) / (viewport.zoom / 100);
    const centerY = (600 / 2) / (viewport.zoom / 100);
    
    const newElement = createDefaultElement(elementType, {
      id: generateId(),
      transform: {
        x: centerX - 50,
        y: centerY - 25,
        width: 100,
        height: 50,
        rotation: 0,
        scaleX: 1,
        scaleY: 1
      }
    });
    
    executeCommand(new AddElementCommand(newElement));
  };

  return (
    <div className="elements-palette">
      {ELEMENT_TYPES.map((elementType) => (
        <div
          key={elementType.type}
          className="element-item"
          draggable
          onDragStart={(e) => handleElementDragStart(e, elementType.type)}
          onClick={() => handleElementClick(elementType.type)}
          title={elementType.description}
        >
          <div className="element-icon">
            {elementType.icon}
          </div>
          <div className="element-label">
            {elementType.label}
          </div>
        </div>
      ))}
      
      <div className="palette-help">
        <p className="help-text">
          💡 <strong>Tip:</strong> Arrastra los elementos al canvas o haz clic para agregarlos al centro.
        </p>
      </div>
    </div>
  );
};