import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useDndMonitor, DndContext, DragOverlay } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import DraggableElement from './DraggableElement';
import ResizableElement from './ResizableElement';
import { Grid } from 'lucide-react';

const DesignCanvas = ({ 
  elements, 
  selectedElementId, 
  onSelectElement, 
  onUpdateElements, 
  viewportSize,
  zoom,
  showGrid,
  backgroundColor = '#ffffff',
  pendingElementType,
  onCanvasClick
}) => {
  const canvasRef = useRef(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [isResizing, setIsResizing] = useState(false);

  // Calcular dimensiones del canvas con zoom
  const canvasWidth = (viewportSize.width * zoom) / 100;
  const canvasHeight = (viewportSize.height * zoom) / 100;

  // Manejar clic en el canvas
  const handleCanvasClick = useCallback((e) => {
    // Solo actuar si se hace clic directamente en el canvas (no en un elemento)
    if (e.target === e.currentTarget || e.target.classList.contains('canvas-background')) {
      onSelectElement(null);
      
      // Si hay un callback para el clic en canvas, pasarle las coordenadas
      if (onCanvasClick) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) * 100) / zoom;
        const y = ((e.clientY - rect.top) * 100) / zoom;
        onCanvasClick({ x, y });
      }
    }
  }, [onSelectElement, onCanvasClick, zoom]);

  // Manejar inicio de arrastre
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const element = elements.find(el => el.id === active.id);
    setDraggedElement(element);
  }, [elements]);

  // Manejar fin de arrastre
  const handleDragEnd = useCallback((event) => {
    const { active, delta } = event;
    
    if (!delta.x && !delta.y) {
      setDraggedElement(null);
      return;
    }

    const elementId = active.id;
    const newElements = elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          x: Math.max(0, element.x + delta.x),
          y: Math.max(0, element.y + delta.y)
        };
      }
      return element;
    });

    onUpdateElements(newElements);
    setDraggedElement(null);
  }, [elements, onUpdateElements]);

  // Manejar redimensionamiento
  const handleResize = useCallback((elementId, newBounds) => {
    const newElements = elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          x: newBounds.x,
          y: newBounds.y,
          width: newBounds.width,
          height: newBounds.height
        };
      }
      return element;
    });

    onUpdateElements(newElements);
  }, [elements, onUpdateElements]);

  // Renderizar elemento
  const renderElement = (element, isDragging = false) => {
    const isSelected = selectedElementId === element.id && !isDragging;
    
    const elementComponent = (
      <DraggableElement
        key={element.id}
        element={element}
        isSelected={isSelected}
        onSelect={() => onSelectElement(element.id)}
        zoom={zoom}
        isDragging={isDragging}
      />
    );

    if (isSelected && !isResizing) {
      return (
        <ResizableElement
          key={element.id}
          element={element}
          onResize={(newBounds) => handleResize(element.id, newBounds)}
          onResizeStart={() => setIsResizing(true)}
          onResizeEnd={() => setIsResizing(false)}
          zoom={zoom}
        >
          {elementComponent}
        </ResizableElement>
      );
    }

    return elementComponent;
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8">
      <div className="flex justify-center">
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToParentElement]}
        >
          <div
            ref={canvasRef}
            className="relative bg-white shadow-lg overflow-hidden"
            style={{
              width: canvasWidth,
              height: canvasHeight,
              backgroundColor,
              backgroundImage: showGrid ? `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              ` : 'none',
              backgroundSize: showGrid ? `${20 * zoom / 100}px ${20 * zoom / 100}px` : 'auto',
              cursor: pendingElementType ? 'crosshair' : 'default'
            }}
            onClick={handleCanvasClick}
          >
            {/* Fondo del canvas */}
            <div className="canvas-background absolute inset-0" />

            {/* Elementos del diseño */}
            {elements.map(element => renderElement(element))}

            {/* Indicador de viewport en esquina */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              {viewportSize.width} × {viewportSize.height} ({zoom}%)
            </div>

            {/* Indicador de grid */}
            {showGrid && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs flex items-center">
                <Grid className="w-3 h-3 mr-1" />
                Grid
              </div>
            )}
          </div>

          {/* Overlay de arrastre */}
          <DragOverlay>
            {draggedElement ? renderElement(draggedElement, true) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Controles de canvas */}
      <div className="flex justify-center mt-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
          <div className="flex items-center space-x-4">
            {/* Toggle Grid */}
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => {
                  // Esta función debería venir como prop
                  // setShowGrid(e.target.checked);
                }}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Mostrar grid</span>
            </label>

            {/* Información del canvas */}
            <div className="text-sm text-gray-600 border-l border-gray-300 pl-4">
              {elements.length} elemento{elements.length !== 1 ? 's' : ''}
            </div>

            {/* Guías de ayuda */}
            <div className="text-xs text-gray-500 border-l border-gray-300 pl-4">
              <div>• Clic para seleccionar</div>
              <div>• Arrastra para mover</div>
              <div>• Redimensiona con los controles</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignCanvas;