import React, { useState, useRef, useCallback } from 'react';

const ResizableElement = ({ 
  element, 
  children, 
  onResize, 
  onResizeStart, 
  onResizeEnd, 
  zoom 
}) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [startBounds, setStartBounds] = useState(null);
  const [startMousePos, setStartMousePos] = useState(null);
  const elementRef = useRef(null);

  const handleMouseDown = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setStartBounds({
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    });
    setStartMousePos({ x: e.clientX, y: e.clientY });
    
    onResizeStart?.();
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [element, onResizeStart]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !startBounds || !startMousePos || !resizeHandle) return;
    
    const deltaX = (e.clientX - startMousePos.x) * (100 / zoom);
    const deltaY = (e.clientY - startMousePos.y) * (100 / zoom);
    
    let newBounds = { ...startBounds };
    
    switch (resizeHandle) {
      case 'nw': // Noroeste
        newBounds.x = startBounds.x + deltaX;
        newBounds.y = startBounds.y + deltaY;
        newBounds.width = startBounds.width - deltaX;
        newBounds.height = startBounds.height - deltaY;
        break;
      case 'n': // Norte
        newBounds.y = startBounds.y + deltaY;
        newBounds.height = startBounds.height - deltaY;
        break;
      case 'ne': // Noreste
        newBounds.y = startBounds.y + deltaY;
        newBounds.width = startBounds.width + deltaX;
        newBounds.height = startBounds.height - deltaY;
        break;
      case 'e': // Este
        newBounds.width = startBounds.width + deltaX;
        break;
      case 'se': // Sureste
        newBounds.width = startBounds.width + deltaX;
        newBounds.height = startBounds.height + deltaY;
        break;
      case 's': // Sur
        newBounds.height = startBounds.height + deltaY;
        break;
      case 'sw': // Suroeste
        newBounds.x = startBounds.x + deltaX;
        newBounds.width = startBounds.width - deltaX;
        newBounds.height = startBounds.height + deltaY;
        break;
      case 'w': // Oeste
        newBounds.x = startBounds.x + deltaX;
        newBounds.width = startBounds.width - deltaX;
        break;
    }
    
    // Aplicar límites mínimos
    const minWidth = 20;
    const minHeight = 20;
    
    if (newBounds.width < minWidth) {
      if (resizeHandle.includes('w')) {
        newBounds.x = newBounds.x - (minWidth - newBounds.width);
      }
      newBounds.width = minWidth;
    }
    
    if (newBounds.height < minHeight) {
      if (resizeHandle.includes('n')) {
        newBounds.y = newBounds.y - (minHeight - newBounds.height);
      }
      newBounds.height = minHeight;
    }
    
    // Evitar posiciones negativas
    newBounds.x = Math.max(0, newBounds.x);
    newBounds.y = Math.max(0, newBounds.y);
    
    onResize(newBounds);
  }, [isResizing, startBounds, startMousePos, resizeHandle, zoom, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
    setStartBounds(null);
    setStartMousePos(null);
    
    onResizeEnd?.();
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [onResizeEnd, handleMouseMove]);

  const ResizeHandle = ({ position, cursor }) => {
    const handleSize = 8;
    const offset = -handleSize / 2;
    
    let style = {
      position: 'absolute',
      width: handleSize,
      height: handleSize,
      backgroundColor: '#3b82f6',
      border: '2px solid white',
      borderRadius: '50%',
      cursor,
      zIndex: 1001
    };
    
    switch (position) {
      case 'nw':
        style.top = offset;
        style.left = offset;
        break;
      case 'n':
        style.top = offset;
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        break;
      case 'ne':
        style.top = offset;
        style.right = offset;
        break;
      case 'e':
        style.top = '50%';
        style.right = offset;
        style.transform = 'translateY(-50%)';
        break;
      case 'se':
        style.bottom = offset;
        style.right = offset;
        break;
      case 's':
        style.bottom = offset;
        style.left = '50%';
        style.transform = 'translateX(-50%)';
        break;
      case 'sw':
        style.bottom = offset;
        style.left = offset;
        break;
      case 'w':
        style.top = '50%';
        style.left = offset;
        style.transform = 'translateY(-50%)';
        break;
    }
    
    return (
      <div
        style={style}
        onMouseDown={(e) => handleMouseDown(e, position)}
      />
    );
  };

  return (
    <div ref={elementRef} className="relative">
      {children}
      
      {/* Handles de redimensionamiento */}
      <ResizeHandle position="nw" cursor="nw-resize" />
      <ResizeHandle position="n" cursor="n-resize" />
      <ResizeHandle position="ne" cursor="ne-resize" />
      <ResizeHandle position="e" cursor="e-resize" />
      <ResizeHandle position="se" cursor="se-resize" />
      <ResizeHandle position="s" cursor="s-resize" />
      <ResizeHandle position="sw" cursor="sw-resize" />
      <ResizeHandle position="w" cursor="w-resize" />
      
      {/* Overlay durante redimensionamiento */}
      {isResizing && (
        <div 
          className="fixed inset-0 z-50" 
          style={{ cursor: `${resizeHandle}-resize` }}
        />
      )}
    </div>
  );
};

export default ResizableElement;