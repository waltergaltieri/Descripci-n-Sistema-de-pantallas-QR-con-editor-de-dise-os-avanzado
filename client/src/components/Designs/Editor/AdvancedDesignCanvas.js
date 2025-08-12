import React, { useRef, useCallback, useState, useEffect } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { 
  Grid, 
  Ruler, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Copy, 
  Trash2,
  AlignCenter
} from 'lucide-react';
import DraggableElement from './DraggableElement';
import ResizableElement from './ResizableElement';

const AdvancedDesignCanvas = ({
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElements,
  viewportSize,
  zoom,
  showGrid,
  backgroundColor,
  showRulers = true,
  snapToGrid = true,
  gridSize = 20
}) => {
  const canvasRef = useRef(null);
  const [draggedElement, setDraggedElement] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);

  // Calcular dimensiones del canvas con zoom
  const canvasWidth = (viewportSize.width * zoom) / 100;
  const canvasHeight = (viewportSize.height * zoom) / 100;



  // Manejar clic en el canvas
  const handleCanvasClick = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-background')) {
      onSelectElement(null);
      setContextMenu(null);
    }
  }, [onSelectElement]);

  // Manejar clic derecho para menú contextual
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    setContextMenu({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      elementId: selectedElementId
    });
  }, [selectedElementId]);

  // Manejar inicio de arrastre
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const element = elements.find(el => el.id === active.id);
    setDraggedElement(element);
    setContextMenu(null);
  }, [elements]);

  // Función para ajustar a la grilla
  const snapToGridValue = useCallback((value) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

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
        const newX = snapToGridValue(Math.max(0, element.x + delta.x));
        const newY = snapToGridValue(Math.max(0, element.y + delta.y));
        return {
          ...element,
          x: newX,
          y: newY
        };
      }
      return element;
    });

    onUpdateElements(newElements);
    setDraggedElement(null);
  }, [elements, onUpdateElements, snapToGridValue]);

  // Manejar redimensionamiento
  const handleResize = useCallback((elementId, newBounds) => {
    const newElements = elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          x: snapToGridValue(newBounds.x),
          y: snapToGridValue(newBounds.y),
          width: snapToGridValue(newBounds.width),
          height: snapToGridValue(newBounds.height)
        };
      }
      return element;
    });

    onUpdateElements(newElements);
  }, [elements, onUpdateElements, snapToGridValue]);

  // Funciones de manipulación de elementos
  const duplicateElement = useCallback((elementId) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      const newElement = {
        ...element,
        id: `element_${Date.now()}`,
        x: element.x + 20,
        y: element.y + 20
      };
      onUpdateElements([...elements, newElement]);
      onSelectElement(newElement.id);
    }
    setContextMenu(null);
  }, [elements, onUpdateElements, onSelectElement]);

  const deleteElement = useCallback((elementId) => {
    const newElements = elements.filter(el => el.id !== elementId);
    onUpdateElements(newElements);
    if (selectedElementId === elementId) {
      onSelectElement(null);
    }
    setContextMenu(null);
  }, [elements, onUpdateElements, selectedElementId, onSelectElement]);

  const toggleElementLock = useCallback((elementId) => {
    const newElements = elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          locked: !element.locked
        };
      }
      return element;
    });
    onUpdateElements(newElements);
    setContextMenu(null);
  }, [elements, onUpdateElements]);

  const toggleElementVisibility = useCallback((elementId) => {
    const newElements = elements.map(element => {
      if (element.id === elementId) {
        return {
          ...element,
          properties: {
            ...element.properties,
            visible: element.properties?.visible !== false ? false : true
          }
        };
      }
      return element;
    });
    onUpdateElements(newElements);
    setContextMenu(null);
  }, [elements, onUpdateElements]);

  // Renderizar reglas
  const renderRulers = () => {
    if (!showRulers) return null;

    const rulerSize = 20;
    const step = 50 * (zoom / 100);

    return (
      <>
        {/* Regla horizontal */}
        <div 
          className="absolute bg-gray-100 border-b border-gray-300 flex items-end"
          style={{
            top: 0,
            left: rulerSize,
            width: canvasWidth,
            height: rulerSize,
            fontSize: '10px'
          }}
        >
          {Array.from({ length: Math.ceil(canvasWidth / step) + 1 }, (_, i) => (
            <div
              key={i}
              className="relative border-l border-gray-400"
              style={{ width: step, height: '100%' }}
            >
              <span className="absolute bottom-0 left-1 text-gray-600">
                {Math.round((i * step * 100) / zoom)}
              </span>
            </div>
          ))}
        </div>

        {/* Regla vertical */}
        <div 
          className="absolute bg-gray-100 border-r border-gray-300 flex flex-col justify-end"
          style={{
            top: rulerSize,
            left: 0,
            width: rulerSize,
            height: canvasHeight,
            fontSize: '10px'
          }}
        >
          {Array.from({ length: Math.ceil(canvasHeight / step) + 1 }, (_, i) => (
            <div
              key={i}
              className="relative border-t border-gray-400"
              style={{ height: step, width: '100%' }}
            >
              <span 
                className="absolute top-1 right-1 text-gray-600"
                style={{ transform: 'rotate(-90deg)', transformOrigin: 'right top' }}
              >
                {Math.round((i * step * 100) / zoom)}
              </span>
            </div>
          ))}
        </div>

        {/* Esquina de las reglas */}
        <div 
          className="absolute bg-gray-200 border-r border-b border-gray-300"
          style={{
            top: 0,
            left: 0,
            width: rulerSize,
            height: rulerSize
          }}
        />
      </>
    );
  };

  // Renderizar menú contextual
  const renderContextMenu = () => {
    if (!contextMenu) return null;

    const element = elements.find(el => el.id === contextMenu.elementId);

    return (
      <div
        className="absolute bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
        style={{
          left: contextMenu.x,
          top: contextMenu.y
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {element && (
          <>
            <button
              onClick={() => duplicateElement(element.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
            >
              <Copy className="w-4 h-4" />
              Duplicar
            </button>
            <button
              onClick={() => toggleElementLock(element.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
            >
              {element.locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {element.locked ? 'Desbloquear' : 'Bloquear'}
            </button>
            <button
              onClick={() => toggleElementVisibility(element.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-100"
            >
              {element.properties?.visible === false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {element.properties?.visible === false ? 'Mostrar' : 'Ocultar'}
            </button>
            <hr className="my-1" />
            <button
              onClick={() => deleteElement(element.id)}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </>
        )}
      </div>
    );
  };

  // Renderizar elemento
  const renderElement = (element, isDragging = false) => {
    // No renderizar elementos ocultos
    if (element.properties?.visible === false && !isDragging) {
      return null;
    }

    const isSelected = selectedElementId === element.id && !isDragging;
    const isLocked = element.locked;
    
    const elementComponent = (
      <DraggableElement
        key={element.id}
        element={element}
        isSelected={isSelected}
        onSelect={() => !isLocked && onSelectElement(element.id)}
        zoom={zoom}
        isDragging={isDragging}
        isLocked={isLocked}
      />
    );

    if (isSelected && !isResizing && !isLocked) {
      return (
        <ResizableElement
          key={element.id}
          element={element}
          onResize={(newBounds) => handleResize(element.id, newBounds)}
          onResizeStart={() => setIsResizing(true)}
          onResizeEnd={() => setIsResizing(false)}
          zoom={zoom}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
        >
          {elementComponent}
        </ResizableElement>
      );
    }

    return elementComponent;
  };

  // Renderizar guías de alineación
  const renderAlignmentGuides = () => {
    if (!showGuides || !selectedElementId) return null;

    const selectedElement = elements.find(el => el.id === selectedElementId);
    if (!selectedElement) return null;

    const guides = [];
    const centerX = selectedElement.x + selectedElement.width / 2;
    const centerY = selectedElement.y + selectedElement.height / 2;

    // Guías de centro del canvas
    const canvasCenterX = viewportSize.width / 2;
    const canvasCenterY = viewportSize.height / 2;

    if (Math.abs(centerX - canvasCenterX) < 5) {
      guides.push(
        <div
          key="center-x"
          className="absolute border-l border-blue-500 border-dashed"
          style={{
            left: (canvasCenterX * zoom) / 100,
            top: 0,
            height: canvasHeight
          }}
        />
      );
    }

    if (Math.abs(centerY - canvasCenterY) < 5) {
      guides.push(
        <div
          key="center-y"
          className="absolute border-t border-blue-500 border-dashed"
          style={{
            top: (canvasCenterY * zoom) / 100,
            left: 0,
            width: canvasWidth
          }}
        />
      );
    }

    return guides;
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-8 relative">
      <div className="flex justify-center">
        <div className="relative">
          {renderRulers()}
          
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
                marginLeft: showRulers ? 20 : 0,
                marginTop: showRulers ? 20 : 0,
                backgroundImage: showGrid ? `
                  linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                ` : 'none',
                backgroundSize: showGrid ? `${gridSize * zoom / 100}px ${gridSize * zoom / 100}px` : 'auto'
              }}
              onClick={handleCanvasClick}
              onContextMenu={handleContextMenu}
            >
              {/* Fondo del canvas */}
              <div className="canvas-background absolute inset-0" />

              {/* Guías de alineación */}
              {renderAlignmentGuides()}

              {/* Elementos del diseño */}
              {elements.map(element => renderElement(element))}

              {/* Indicador de viewport en esquina */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                {viewportSize.width} × {viewportSize.height} ({zoom}%)
              </div>

              {/* Menú contextual */}
              {renderContextMenu()}
            </div>

            {/* Overlay de arrastre */}
            <DragOverlay>
              {draggedElement ? renderElement(draggedElement, true) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Controles del canvas */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center space-x-3">
          {/* Toggle grid */}
          <button
            onClick={() => {/* Esta función debería venir como prop */}}
            className={`p-2 rounded ${showGrid ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Mostrar/Ocultar grilla"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Toggle rulers */}
          <button
            onClick={() => {/* Esta función debería venir como prop */}}
            className={`p-2 rounded ${showRulers ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Mostrar/Ocultar reglas"
          >
            <Ruler className="w-4 h-4" />
          </button>

          {/* Toggle guides */}
          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`p-2 rounded ${showGuides ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title="Mostrar/Ocultar guías"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          {/* Información del canvas */}
          <div className="text-sm text-gray-600 border-l border-gray-300 pl-3">
            {elements.length} elemento{elements.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDesignCanvas;