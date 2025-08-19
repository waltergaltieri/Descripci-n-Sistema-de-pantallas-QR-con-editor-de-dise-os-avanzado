import React from 'react';
import { Group, Rect, Line, Circle, Transformer } from 'react-konva';
import type { CanvasElement } from '../../types/editor';
import { calculateBoundingBox } from '../../utils/elements';
import { polotnoStore } from '../../store/editorStore';

interface SelectionBoxProps {
  selectedElements: CanvasElement[];
  zoom: number;
}

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  selectedElements,
  zoom
}) => {
  if (selectedElements.length === 0) {
    return null;
  }

  const bbox = calculateBoundingBox(selectedElements);
  const handleSize = 8 / zoom; // Tamaño de los handles ajustado al zoom
  const strokeWidth = 1 / zoom; // Grosor del borde ajustado al zoom

  const handleTransform = (elementId: string, newTransform: any) => {
    const element = polotnoStore.getElementById(elementId);
    if (element) {
      element.set(newTransform);
    }
  };

  const renderSelectionBox = () => {
    return (
      <Rect
        x={bbox.x}
        y={bbox.y}
        width={bbox.width}
        height={bbox.height}
        stroke="#0066cc"
        strokeWidth={strokeWidth}
        fill="transparent"
        dash={[4 / zoom, 4 / zoom]}
        listening={false}
      />
    );
  };

  const renderResizeHandles = () => {
    if (selectedElements.length !== 1) {
      return null; // Solo mostrar handles para un elemento
    }

    const handles = [
      // Esquinas
      { x: bbox.x, y: bbox.y, cursor: 'nw-resize', type: 'corner' },
      { x: bbox.x + bbox.width, y: bbox.y, cursor: 'ne-resize', type: 'corner' },
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height, cursor: 'se-resize', type: 'corner' },
      { x: bbox.x, y: bbox.y + bbox.height, cursor: 'sw-resize', type: 'corner' },
      // Lados
      { x: bbox.x + bbox.width / 2, y: bbox.y, cursor: 'n-resize', type: 'side' },
      { x: bbox.x + bbox.width, y: bbox.y + bbox.height / 2, cursor: 'e-resize', type: 'side' },
      { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height, cursor: 's-resize', type: 'side' },
      { x: bbox.x, y: bbox.y + bbox.height / 2, cursor: 'w-resize', type: 'side' }
    ];

    return handles.map((handle, index) => (
      <Circle
        key={index}
        x={handle.x}
        y={handle.y}
        radius={handleSize / 2}
        fill="#0066cc"
        stroke="#ffffff"
        strokeWidth={strokeWidth}
        draggable
        onMouseEnter={(e) => {
          e.target.getStage()!.container().style.cursor = handle.cursor;
        }}
        onMouseLeave={(e) => {
          e.target.getStage()!.container().style.cursor = 'default';
        }}
        onDragMove={(e) => {
          // Lógica de redimensionamiento
          const element = selectedElements[0];
          const stage = e.target.getStage()!;
          const pointerPos = stage.getPointerPosition()!;
          
          // Calcular nuevo tamaño basado en la posición del handle
          // Esta es una implementación simplificada
          const newWidth = Math.abs(pointerPos.x - bbox.x);
          const newHeight = Math.abs(pointerPos.y - bbox.y);
          
          const newTransform = {
            ...element.transform,
            width: Math.max(10, newWidth),
            height: Math.max(10, newHeight)
          };
          
          handleTransform(element.id, newTransform);
        }}
      />
    ));
  };

  const renderRotationHandle = () => {
    if (selectedElements.length !== 1) {
      return null;
    }

    const rotationHandleDistance = 30 / zoom;
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const handleX = centerX;
    const handleY = bbox.y - rotationHandleDistance;

    return (
      <Group>
        {/* Línea conectora */}
        <Line
          points={[centerX, bbox.y, handleX, handleY]}
          stroke="#0066cc"
          strokeWidth={strokeWidth}
          listening={false}
        />
        
        {/* Handle de rotación */}
        <Circle
          x={handleX}
          y={handleY}
          radius={handleSize / 2}
          fill="#00cc66"
          stroke="#ffffff"
          strokeWidth={strokeWidth}
          draggable
          onMouseEnter={(e) => {
            e.target.getStage()!.container().style.cursor = 'grab';
          }}
          onMouseLeave={(e) => {
            e.target.getStage()!.container().style.cursor = 'default';
          }}
          onDragMove={(e) => {
            const element = selectedElements[0];
            const stage = e.target.getStage()!;
            const pointerPos = stage.getPointerPosition()!;
            
            // Calcular ángulo de rotación
            const dx = pointerPos.x - centerX;
            const dy = pointerPos.y - centerY;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
            
            const newTransform = {
              ...element.transform,
              rotation: angle
            };
            
            handleTransform(element.id, newTransform);
          }}
        />
      </Group>
    );
  };

  return (
    <Group listening={false}>
      {renderSelectionBox()}
      {renderResizeHandles()}
      {renderRotationHandle()}
    </Group>
  );
};