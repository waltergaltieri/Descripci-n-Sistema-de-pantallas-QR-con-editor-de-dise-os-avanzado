import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Group } from 'react-konva';
import Konva from 'konva';
import { useEditorStore, polotnoStore } from '../../store/editorStore';
import { CanvasElement } from './CanvasElement';
import { SelectionBox } from './SelectionBox';
import { Grid } from './Grid';
import { Rulers } from './Rulers';
import { Guides } from './Guides';
import { Background } from './Background';
import { snapToGrid, snapPointToGrid } from '../../utils/math';
import { getElementsAtPoint } from '../../utils/elements';
import { animationEngine } from '../../utils/animationEngine';
import type { AnimationFrame } from '../../utils/animationEngine';
import type { CanvasElement as CanvasElementType } from '../../types/editor';
import './CanvasEditor.css';

interface CanvasEditorProps {
  width: number;
  height: number;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ width, height }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [animationFrames, setAnimationFrames] = useState<AnimationFrame[]>([]);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, panX: 0, panY: 0 });

  const {
    previewMode,
    selectMultiple,
    clearSelection,
    setZoom
  } = useEditorStore();
  
  // Access Polotno store directly for canvas operations
  const store = polotnoStore;
  const activePage = store.activePage;
  const selectedElements = store.selectedElements;
  const viewport = { zoom: store.scale, panX: 0, panY: 0, showGuides: true, gridSize: 20, showGrid: true, showRulers: true };
  const composition = { elements: activePage?.children || [], screens: [{ width: 1920, height: 1080 }], background: { type: 'solid' as const, color: '#ffffff' } };
  const selection = { selectedIds: selectedElements.map((el: any) => el.id), hoveredId: null };

  // Add setPan function
  const setPan = (x: number, y: number) => {
    // For now, just log the pan values since we're using a simplified viewport
    console.log('Pan:', x, y);
  };

  // Add missing functions
  const selectElement = (id: string) => {
    store.selectElements([id]);
  };

  const transformElements = (ids: string[], transform: any) => {
    ids.forEach(id => {
      const element = store.getElementById(id);
      if (element) {
        element.set(transform);
      }
    });
  };

  const panBy = (deltaX: number, deltaY: number) => {
    console.log('Pan by:', deltaX, deltaY);
  };

  const setHoveredElement = (id: string | undefined) => {
    console.log('Hovered element:', id);
  };

  const getElementById = (id: string) => {
    return store.getElementById(id);
  };

  const isPlaying = false; // For now, animations are not playing

  // Configurar el motor de animación
  useEffect(() => {
    // Simplified animation setup to avoid type issues
    animationEngine.clear();

    // TODO: Implement animation engine integration properly
    console.log('Animation engine cleared');

    return () => {
      animationEngine.clear();
    };
  }, [composition.elements]);

  // Controlar reproducción de animaciones
  useEffect(() => {
    if (isPlaying) {
      animationEngine.play();
    } else {
      animationEngine.pause();
    }
  }, [isPlaying]);

  // Manejar eventos de teclado para el spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Calcular transformación del viewport
  const stageScale = viewport.zoom / 100;
  const stageX = viewport.panX;
  const stageY = viewport.panY;

  // Obtener elementos visibles ordenados por z-index
  const visibleElements = Object.values(composition.elements)
    .filter(element => element.visible && !element.parentId)
    .sort((a, b) => a.zIndex - b.zIndex);

  // Manejar clics en el canvas
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (previewMode) return;
    
    // Handle mouse events normally (no panning functionality)

    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Convertir coordenadas del stage a coordenadas del canvas
    const canvasX = (pointerPosition.x - stageX) / stageScale;
    const canvasY = (pointerPosition.y - stageY) / stageScale;

    // Si se hizo clic en el fondo, limpiar selección
    if (e.target === stage) {
      clearSelection();
      return;
    }

    // Buscar elemento en la posición del clic
    const elementsRecord = Object.fromEntries(composition.elements.map((el: any) => [el.id, el]));
    const elementsAtPoint = getElementsAtPoint({ x: canvasX, y: canvasY }, elementsRecord);

    if (elementsAtPoint.length > 0) {
      const topElement = elementsAtPoint[0];
      const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
      if (isMultiSelect) {
        selectMultiple([...selection.selectedIds, topElement.id]);
      } else {
        selectElement(topElement.id);
      }
    }
  }, [previewMode, stageX, stageY, stageScale, composition.elements, clearSelection, selectElement]);

  // Manejar inicio de arrastre
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (previewMode) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Si spacebar está presionado y es clic izquierdo, iniciar panning
    if (isSpacePressed && e.evt.button === 0) {
      e.evt.preventDefault();
      setIsPanning(true);
      setPanStart({
        x: pointerPosition.x,
        y: pointerPosition.y,
        panX: viewport.panX,
        panY: viewport.panY
      });
      return;
    }

    // Si se hace clic en el fondo con clic izquierdo, iniciar selección rectangular
    if (e.target === stage && e.evt.button === 0 && !isPanning) {
      setIsDragging(true);
      setDragStart({
        x: (pointerPosition.x - stageX) / stageScale,
        y: (pointerPosition.y - stageY) / stageScale
      });
      setSelectionRect({
        x: (pointerPosition.x - stageX) / stageScale,
        y: (pointerPosition.y - stageY) / stageScale,
        width: 0,
        height: 0
      });
    }
  }, [previewMode, stageX, stageY, stageScale, isPanning, isSpacePressed, viewport.panX, viewport.panY, setPan]);

  // Manejar movimiento del mouse
  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (previewMode) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    // Si estamos en modo panning, actualizar la posición del canvas
    if (isPanning) {
      const deltaX = pointerPosition.x - panStart.x;
      const deltaY = pointerPosition.y - panStart.y;
      setPan(panStart.panX + deltaX, panStart.panY + deltaY);
      return;
    }

    const canvasX = (pointerPosition.x - stageX) / stageScale;
    const canvasY = (pointerPosition.y - stageY) / stageScale;

    // Actualizar selección rectangular
    if (isDragging && selectionRect) {
      setSelectionRect({
        x: Math.min(dragStart.x, canvasX),
        y: Math.min(dragStart.y, canvasY),
        width: Math.abs(canvasX - dragStart.x),
        height: Math.abs(canvasY - dragStart.y)
      });
    }

    // Actualizar elemento hover
    if (!isDragging) {
      const elementsRecord = Object.fromEntries(composition.elements.map((el: any) => [el.id, el]));
      const elementsAtPoint = getElementsAtPoint({ x: canvasX, y: canvasY }, elementsRecord);
      const topElement = elementsAtPoint[0];
      setHoveredElement(topElement?.id);
    }
  }, [previewMode, stageX, stageY, stageScale, isDragging, selectionRect, dragStart, composition.elements, setHoveredElement, isPanning, panStart, setPan]);

  // Manejar fin de arrastre
  const handleMouseUp = useCallback(() => {
    // Si estamos en modo panning, finalizarlo
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (previewMode) return;
    
    if (isDragging && selectionRect) {
      // Seleccionar elementos dentro del rectángulo
      const selectedIds: string[] = [];
      
      Object.values(composition.elements).forEach(element => {
        if (!element.visible || element.parentId) return;
        
        const { x, y, width, height } = element.transform;
        
        // Verificar intersección con rectángulo de selección
        if (
          x < selectionRect.x + selectionRect.width &&
          x + width > selectionRect.x &&
          y < selectionRect.y + selectionRect.height &&
          y + height > selectionRect.y
        ) {
          selectedIds.push(element.id);
        }
      });
      
      if (selectedIds.length > 0) {
        selectMultiple(selectedIds);
      }
    }
    
    setIsDragging(false);
    setSelectionRect(null);
  }, [isDragging, selectionRect, composition.elements, selectMultiple, isPanning, previewMode]);

  // Manejar rueda del mouse para zoom y desplazamiento
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    if (!stage) return;

    // Shift + Ctrl = desplazamiento vertical
    if (e.evt.shiftKey && e.evt.ctrlKey) {
      const deltaY = e.evt.deltaY * 0.5;
      panBy(0, -deltaY);
      return;
    }
    
    // Solo Ctrl = desplazamiento horizontal
    if (e.evt.ctrlKey && !e.evt.shiftKey) {
      const deltaX = e.evt.deltaY * 0.5;
      panBy(-deltaX, 0);
      return;
    }
    
    // Sin modificadores = zoom
    if (!e.evt.ctrlKey && !e.evt.shiftKey) {
      const scaleBy = 1.1;
      const oldScale = viewport.zoom / 100;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const newZoom = Math.max(10, Math.min(800, newScale * 100));
      
      // Obtener posición del mouse para zoom centrado
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const mousePointTo = {
          x: (pointer.x - stageX) / oldScale,
          y: (pointer.y - stageY) / oldScale,
        };
        
        const newScale = newZoom / 100;
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };
        
        setZoom(newZoom);
        setPan(newPos.x, newPos.y);
      } else {
        setZoom(newZoom);
      }
    }
  }, [viewport.zoom, viewport.panX, viewport.panY, stageX, stageY, setZoom, setPan, panBy]);

  // Manejar teclas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewMode) return;
      
      // Ignore spacebar to allow parent Editor to handle panning
      if (e.code === 'Space') return;

      // Atajos de teclado
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          if (selection.selectedIds.length > 0) {
            // TODO: Implementar comando de eliminación
            console.log('Eliminar elementos seleccionados');
          }
          break;
        
        case 'Escape':
          clearSelection();
          break;
          
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allIds = Object.keys(composition.elements);
            selectMultiple(allIds);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewMode, selection.selectedIds, clearSelection, composition.elements, selectMultiple]);

  // Renderizar elemento con animación aplicada
  const renderElement = (element: CanvasElementType) => {
    // Buscar frame de animación para este elemento
    const animationFrame = animationFrames.find(frame => frame.elementId === element.id);
    
    // Aplicar transformaciones de animación si existen
    const finalTransform = animationFrame ? {
      ...element.transform,
      ...animationFrame.transform
    } : element.transform;
    
    const finalOpacity = animationFrame?.opacity !== undefined ? animationFrame.opacity : element.opacity;

    return (
      <CanvasElement
        key={element.id}
        element={{ ...element, transform: finalTransform, opacity: finalOpacity }}
        isSelected={selection.selectedIds.includes(element.id)}
        isHovered={selection.hoveredId === element.id}
        onSelect={() => selectElement(element.id)}
        onTransform={(transform) => transformElements([element.id], transform)}
        previewMode={previewMode}
      />
    );
  };

  // Calcular dimensiones del canvas virtual
  const canvasWidth = composition.screens[0]?.width || 1920;
  const canvasHeight = composition.screens[0]?.height || 1080;
  const scaledCanvasWidth = canvasWidth * stageScale;
  const scaledCanvasHeight = canvasHeight * stageScale;
  
  // Calcular límites de desplazamiento con márgenes más generosos
  const margin = 100; // Margen más amplio para mejor navegación
  const maxPanX = Math.max(margin, scaledCanvasWidth - width + margin);
  const maxPanY = Math.max(margin, scaledCanvasHeight - height + margin);
  const minPanX = Math.min(0, -margin);
  const minPanY = Math.min(0, -margin);
  
  // Manejar barras de desplazamiento
  const handleHorizontalScroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (maxPanX > minPanX) {
      const newPanX = -value * (maxPanX - minPanX) + minPanX;
      setPan(newPanX, viewport.panY);
    }
  };
  
  const handleVerticalScroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (maxPanY > minPanY) {
      const newPanY = -value * (maxPanY - minPanY) + minPanY;
      setPan(viewport.panX, newPanY);
    }
  };
  
  // Calcular valores de las barras de desplazamiento
  const horizontalScrollValue = maxPanX > minPanX ? (-viewport.panX + minPanX) / (maxPanX - minPanX) : 0;
  const verticalScrollValue = maxPanY > minPanY ? (-viewport.panY + minPanY) / (maxPanY - minPanY) : 0;
  
  // Determinar si mostrar barras de desplazamiento con condiciones más permisivas
  // Mostrar barra horizontal si el canvas escalado es mayor al 95% del ancho del contenedor
  const showHorizontalScrollbar = scaledCanvasWidth >= width * 0.95 || maxPanX > 0;
  // Mostrar barra vertical si el canvas escalado es mayor al 95% del alto del contenedor  
  const showVerticalScrollbar = scaledCanvasHeight >= height * 0.95 || maxPanY > 0;

  return (
    <div className="canvas-editor" style={{ width, height, overflow: 'hidden', position: 'relative' }}>
      {/* Rulers */}
      {viewport.showRulers && !previewMode && (
        <Rulers
          width={width}
          height={height}
          zoom={viewport.zoom}
          visible={viewport.showRulers}
          offsetX={0}
        offsetY={0}
        />
      )}
      
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stageX}
        y={stageY}
        onClick={handleStageClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        draggable={false}
        listening={true}
        style={{ cursor: isPanning ? 'grabbing' : (isSpacePressed ? 'grab' : 'default') }}
      >
        {/* Capa de fondo */}
        <Layer>
          <Background background={composition.background} />
          
          {/* Grid */}
          {viewport.showGrid && !previewMode && (
            <Grid
              width={composition.screens[0]?.width || 1920}
              height={composition.screens[0]?.height || 1080}
              gridSize={viewport.gridSize}
              opacity={0.1}
              visible={viewport.showGrid}
            />
          )}
        </Layer>

        {/* Capa de elementos */}
        <Layer>
          {visibleElements.map(renderElement)}
          
          {/* Rectángulo de selección */}
          {selectionRect && !previewMode && (
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="rgba(0, 123, 255, 0.1)"
              stroke="#007bff"
              strokeWidth={1 / stageScale}
              dash={[5 / stageScale, 5 / stageScale]}
            />
          )}
        </Layer>

        {/* Capa de selección y guías */}
        {!previewMode && (
          <Layer>
            {/* Caja de selección */}
            {selection.selectedIds.length > 0 && (
              <SelectionBox
                selectedElements={selection.selectedIds.map(id => composition.elements[id]).filter(Boolean)}
                zoom={viewport.zoom}
              />
            )}
            
            {/* Guías */}
            {viewport.showGuides && (
              <Guides
                width={composition.screens[0]?.width || 1920}
                height={composition.screens[0]?.height || 1080}
                zoom={viewport.zoom}
                visible={viewport.showGuides}
                offsetX={0}
                offsetY={0}
              />
            )}
          </Layer>
        )}
      </Stage>
      
      {/* Barras de desplazamiento */}
      {showHorizontalScrollbar && (
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={horizontalScrollValue}
          onChange={handleHorizontalScroll}
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '2px',
            right: showVerticalScrollbar ? '18px' : '2px',
            height: '12px',
            opacity: 0.7,
            cursor: 'pointer',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '6px',
            outline: 'none',
            appearance: 'none',
            WebkitAppearance: 'none'
          }}
          className="canvas-scrollbar-horizontal"
        />
      )}
      
      {showVerticalScrollbar && (
        <div
          style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            bottom: showHorizontalScrollbar ? '18px' : '2px',
            width: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={verticalScrollValue}
            onChange={handleVerticalScroll}
            style={{
              width: '100px',
              height: '12px',
              opacity: 0.7,
              cursor: 'pointer',
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '6px',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center'
            }}
            className="canvas-scrollbar-vertical"
          />
        </div>
      )}
    </div>
  );
};