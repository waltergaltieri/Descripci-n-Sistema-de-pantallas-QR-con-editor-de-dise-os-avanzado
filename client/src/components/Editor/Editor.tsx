import React, { useEffect, useRef, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { useEditorStore, polotnoStore } from '../../store/editorStore';
import { CanvasEditor } from '../Canvas/CanvasEditor';
import { LeftPanel } from '../Panels/LeftPanel';
import { RightPanel } from '../Panels/RightPanel';
import { StatusBar } from '../StatusBar/StatusBar';
import { AddElementCommand } from '../../commands';
import { createDefaultElement } from '../../utils/elements';
import { generateId } from '../../utils/id';
import './Editor.css';

export const Editor: React.FC = observer(() => {
  const editorRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const {
    clearSelection,
    selectMultiple,
    deleteElement,
    duplicateElement,
    groupElements,
    ungroupElements,
    setZoom,
    toggleLeftPanel,
    toggleRightPanel,
    undo,
    redo,
    showLeftPanel,
    showRightPanel
  } = useEditorStore();
  
  // Access Polotno store directly for canvas operations
  const store = polotnoStore;

  // Initialize editor on mount
  useEffect(() => {
    // Focus the editor to ensure keyboard events are captured
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Handle viewport resize
  useEffect(() => {
    const updateViewportSize = () => {
      if (canvasContainerRef.current) {
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        setContainerSize({ width: clientWidth, height: clientHeight });
      }
    };

    // Initial size
    updateViewportSize();

    // Listen for resize events
    const resizeObserver = new ResizeObserver(updateViewportSize);
    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default browser shortcuts when editor is focused
    if (editorRef.current?.contains(document.activeElement)) {
      const { ctrlKey, metaKey, key } = e;
      const isModifier = ctrlKey || metaKey;
      const currentSelection = polotnoStore.selectedElements;
      const currentElements = polotnoStore.activePage?.children || [];
      const hasSelection = currentSelection.length > 0;

      switch (key.toLowerCase()) {
        case 'z':
          if (isModifier) {
            e.preventDefault();
            if (e.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'y':
          if (isModifier) {
            e.preventDefault();
            redo();
          }
          break;
        case 'a':
          if (isModifier) {
            e.preventDefault();
            const allElementIds = currentElements.map((el: any) => el.id);
            selectMultiple(allElementIds);
          }
          break;
        case 'backspace':
          if (!isModifier && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
            e.preventDefault();
            currentSelection.forEach((el: any) => deleteElement(el.id));
          }
          break;
        case 'delete':
          if (hasSelection) {
            e.preventDefault();
            currentSelection.forEach((el: any) => deleteElement(el.id));
          }
          break;
        case 'd':
          if (isModifier) {
            e.preventDefault();
            currentSelection.forEach((el: any) => duplicateElement(el.id));
          }
          break;
        case 'g':
          if (isModifier) {
            e.preventDefault();
            if (e.shiftKey) {
              currentSelection.forEach((_el: any) => ungroupElements());
            } else {
              if (currentSelection.length > 1) {
                groupElements();
              }
            }
          }
          break;
        case 'escape':
          e.preventDefault();
          clearSelection();
          break;
        case '+':
        case '=':
          if (isModifier) {
            e.preventDefault();
            const currentZoom = polotnoStore.scale * 100;
            setZoom(Math.min(currentZoom * 1.2, 5));
          }
          break;
        case '-':
          if (isModifier) {
            e.preventDefault();
            const currentZoom = polotnoStore.scale * 100;
            setZoom(Math.max(currentZoom / 1.2, 0.1));
          }
          break;
        case '0':
          if (isModifier) {
            e.preventDefault();
            setZoom(100);
          }
          break;
      }
    }
  }, [undo, redo, deleteElement, duplicateElement, selectMultiple, groupElements, ungroupElements, clearSelection, setZoom]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Handle drag and drop from external sources
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      
      if (!canvasContainerRef.current?.contains(e.target as Node)) {
        return;
      }

      // Handle element type from ElementsPalette
      const elementType = e.dataTransfer?.getData('application/element-type');
      if (elementType) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert screen coordinates to canvas coordinates (without panning)
        const canvasX = x / (store.scale);
        const canvasY = y / (store.scale);
        
        // Add element directly to polotno store with position
        polotnoStore.history.transaction(() => {
          polotnoStore.activePage?.addElement({
            type: elementType,
            x: canvasX - 50,
            y: canvasY - 25,
            width: 100,
            height: 50
          });
        });
        return;
      }

      // Handle image files
      const files = Array.from(e.dataTransfer?.files || []);
      const imageFiles = files.filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert screen coordinates to canvas coordinates (without panning)
        const canvasX = x / (store.scale);
        const canvasY = y / (store.scale);
        
        imageFiles.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const newElement = createDefaultElement('image', {
              id: generateId(),
              src: event.target?.result as string,
              transform: {
                x: canvasX - 100 + (index * 20),
                y: canvasY - 100 + (index * 20),
                width: 200,
                height: 200,
                rotation: 0,
                scaleX: 1,
                scaleY: 1
              }
            });
            
            polotnoStore.history.transaction(() => {
              polotnoStore.activePage?.addElement(newElement);
            });
          };
          reader.readAsDataURL(file);
        });
      }
    };

    if (canvasContainerRef.current) {
      canvasContainerRef.current.addEventListener('dragover', handleDragOver);
      canvasContainerRef.current.addEventListener('drop', handleDrop);
    }

    return () => {
      if (canvasContainerRef.current) {
        canvasContainerRef.current.removeEventListener('dragover', handleDragOver);
        canvasContainerRef.current.removeEventListener('drop', handleDrop);
      }
    };
  }, [store.scale]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const currentZoom = polotnoStore.scale * 100;
      const newZoom = Math.min(Math.max(currentZoom * delta, 10), 500);
      setZoom(newZoom);
    }
  }, [setZoom]);

  useEffect(() => {
    if (canvasContainerRef.current) {
      canvasContainerRef.current.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      if (canvasContainerRef.current) {
        canvasContainerRef.current.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);

  return (
    <div className="editor" ref={editorRef} tabIndex={0}>
      <div className="editor-header">
        {/* Header content can be added here */}
      </div>
      
      <div className="editor-body">
        {showLeftPanel && (
          <div className="editor-left">
            <LeftPanel />
          </div>
        )}
        
        <div className="editor-center">
          <div className="canvas-container" ref={canvasContainerRef}>
            <CanvasEditor 
              width={containerSize.width} 
              height={containerSize.height} 
            />
          </div>
        </div>
        
        {showRightPanel && (
          <div className="editor-right">
            <RightPanel />
          </div>
        )}
      </div>
      
      <StatusBar />
    </div>
  );
});