import React, { useEffect, useState } from 'react';
import { configurePolotnoImageDefaults } from '../../utils/polotno-image-config'; // Configuración segura de imágenes
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { SidePanel } from 'polotno/side-panel';
import { Workspace } from 'polotno/canvas/workspace';
import { Button, Card, HTMLSelect, NumericInput, Menu, MenuItem } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { polotnoStore } from '../../store/internalEditorStore';
// import '../../utils/forcePanelWidth'; // Desactivado temporalmente para evitar conflictos
// import { fixAllCanvasDragIssues } from '../../utils/fixCanvasDrag'; // Desactivado para simplificar
import { initializeForcedCentering } from '../../utils/forceCenterCanvas';
import { setupEmergencyCentering } from '../../utils/emergencyCentering';
import { setupAbsoluteCentering } from '../../utils/absoluteCentering';
// import { setupStructuralCenteringFix } from '../../utils/structuralCenteringFix';
import { debugWorkspaceCentering, monitorWorkspaceChanges, applyManualWorkspaceCentering } from '../../debug-workspace-centering';
import '../../test-panel-toggle'; // Script de prueba para depuración
import '../../test-specific-classes';
import '../../ultimate-centering-test'; // Script de testing definitivo
import '../../force-centering-javascript'; // Forzado de centrado mediante JavaScript
import '../../direct-centering-javascript'; // Solución JavaScript directa basada en inspección
import '../../hide-templates-tab'; // Script para ocultar la pestaña de Templates
// import '../../fix-image-resize'; // Corrección para el redimensionamiento de imágenes - DESACTIVADO: causa errores de MobX State Tree
// import '../../image-resize-patch'; // Parche adicional para redimensionamiento de imágenes - DESACTIVADO: causa errores de MobX State Tree
// import '../../debug-contextual-controls'; // Diagnóstico de controles contextuales
import '@blueprintjs/core/lib/css/blueprint.css';
import '../PolotnoEditor.css';
import '../../emergency-centering.css';
import '../../ultimate-centering-fix.css';
// import '../../structural-centering-fix.css'; // Corrección estructural definitiva - DESACTIVADA TEMPORALMENTE
import '../../safe-centering-fix.css'; // Solución segura de centrado
import '../../nuclear-centering-override.css'; // Override nuclear para centrado definitivo
import '../../direct-centering-fix.css'; // Solución directa basada en inspección del elemento
import '../../context-menu-styles.css'; // Estilos para el menú contextual mejorado
import './InternalEditor.css'; // Estilos específicos del editor interno

// Editor interno simplificado - sin animaciones

// Funciones de animación eliminadas - editor simplificado

// Funciones de ejecución de animaciones eliminadas

// Animaciones de entrada eliminadas

// Animaciones de salida eliminadas

// Animaciones de énfasis eliminadas

// Panel de animaciones eliminado - editor simplificado

// Función para calcular posición inteligente del menú contextual
const calculateSmartPosition = (x: number, y: number, menuWidth: number = 200, menuHeight: number = 400) => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const padding = 10; // Margen mínimo desde los bordes
  
  let finalX = x;
  let finalY = y;
  
  // Ajustar posición horizontal
  if (x + menuWidth + padding > viewportWidth) {
    // Si no cabe a la derecha, posicionar a la izquierda del cursor
    finalX = x - menuWidth;
    // Si tampoco cabe a la izquierda, ajustar al borde derecho
    if (finalX < padding) {
      finalX = viewportWidth - menuWidth - padding;
    }
  }
  
  // Ajustar posición vertical
  if (y + menuHeight + padding > viewportHeight) {
    // Si no cabe hacia abajo, posicionar hacia arriba del cursor
    finalY = y - menuHeight;
    // Si tampoco cabe hacia arriba, ajustar al borde inferior
    if (finalY < padding) {
      finalY = viewportHeight - menuHeight - padding;
    }
  }
  
  // Asegurar que no se salga de los límites mínimos
  finalX = Math.max(padding, finalX);
  finalY = Math.max(padding, finalY);
  
  return { x: finalX, y: finalY };
};

// Componente de menú contextual
const ContextMenu = ({ store, x, y, onClose }: { store: any, x: number, y: number, onClose: () => void }) => {
  const selectedElements = store.selectedElements;
  const hasSelection = selectedElements.length > 0;
  const selectedElement = selectedElements[0];
  const isMultipleSelection = selectedElements.length > 1;
  
  // Detectar tipos de elementos
  const isTextElement = selectedElement && (selectedElement.type === 'text' || selectedElement.className === 'Text');
  const isImageElement = selectedElement && (selectedElement.type === 'image' || selectedElement.className === 'Image');
  const isShapeElement = selectedElement && (selectedElement.type === 'rect' || selectedElement.type === 'circle' || selectedElement.type === 'triangle' || selectedElement.className === 'Rect' || selectedElement.className === 'Circle' || selectedElement.className === 'RegularPolygon');
  
  if (!hasSelection) return null;
  
  // Calcular posición inteligente del menú
  const menuWidth = 220; // Ancho estimado del menú
  const maxMenuHeight = Math.min(500, window.innerHeight * 0.8); // Máximo 80% de la altura de la ventana
  const smartPosition = calculateSmartPosition(x, y, menuWidth, maxMenuHeight);
  
  const handleDuplicate = async () => {
    await store.history.transaction(async () => {
      selectedElements.forEach((element: any) => {
        const newElement = { ...element.toJSON() };
        newElement.id = 'element_' + Math.random().toString(36).substr(2, 9);
        newElement.x = element.x + 20;
        newElement.y = element.y + 20;
        store.activePage.addElement(newElement);
      });
    });
    onClose();
  };
  
  const handleDelete = async () => {
    await store.history.transaction(async () => {
      // Use Polotno's official deleteElements method
      const elementIds = selectedElements.map((element: any) => element.id);
      store.deleteElements(elementIds);
      console.log('Elements deleted successfully:', elementIds);
    });
    onClose();
  };
  
  const handleBringToFront = async () => {
    await store.history.transaction(async () => {
      selectedElements.forEach((element: any) => {
        // Move element to the top by calling moveUp() multiple times
        const totalElements = store.activePage?.children.length || 0;
        for (let i = 0; i < totalElements; i++) {
          element.moveUp();
        }
      });
    });
    onClose();
  };
  
  const handleSendToBack = async () => {
    await store.history.transaction(async () => {
      selectedElements.forEach((element: any) => {
        // Move element to the bottom by calling moveDown() multiple times
        const totalElements = store.activePage?.children.length || 0;
        for (let i = 0; i < totalElements; i++) {
          element.moveDown();
        }
      });
    });
    onClose();
  };

  const handleBold = async () => {
    if (isTextElement) {
      await store.history.transaction(async () => {
        const currentWeight = selectedElement.fontWeight || 'normal';
        selectedElement.set({ fontWeight: currentWeight === 'bold' ? 'normal' : 'bold' });
      });
    }
    onClose();
  };

  const handleItalic = async () => {
    if (isTextElement) {
      await store.history.transaction(async () => {
        const currentStyle = selectedElement.fontStyle || 'normal';
        selectedElement.set({ fontStyle: currentStyle === 'italic' ? 'normal' : 'italic' });
      });
    }
    onClose();
  };

  const handleUnderline = async () => {
    if (isTextElement) {
      await store.history.transaction(async () => {
        const currentDecoration = selectedElement.textDecoration || 'none';
        selectedElement.set({ textDecoration: currentDecoration === 'underline' ? 'none' : 'underline' });
      });
    }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: smartPosition.x,
        top: smartPosition.y,
        zIndex: 10000,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '8px 0',
        minWidth: '200px',
        maxHeight: maxMenuHeight,
        overflowY: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Información del elemento seleccionado */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #eee', fontSize: '12px', color: '#666' }}>
        {isMultipleSelection ? (
          `${selectedElements.length} elementos seleccionados`
        ) : (
          `${selectedElement.type || selectedElement.className || 'Elemento'} seleccionado`
        )}
      </div>

      {/* Acciones básicas */}
      <MenuItem text="Duplicar" onClick={handleDuplicate} />
      <MenuItem text="Eliminar" onClick={handleDelete} intent="danger" />
      
      {/* Separador */}
      <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
      
      {/* Acciones de orden */}
      <MenuItem text="Traer al frente" onClick={handleBringToFront} />
      <MenuItem text="Enviar atrás" onClick={handleSendToBack} />
      
      {/* Opciones específicas para texto */}
      {isTextElement && (
        <>
          <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
          <MenuItem 
            text="Negrita" 
            onClick={handleBold}
            icon={selectedElement.fontWeight === 'bold' ? 'tick' : undefined}
          />
          <MenuItem 
            text="Cursiva" 
            onClick={handleItalic}
            icon={selectedElement.fontStyle === 'italic' ? 'tick' : undefined}
          />
          <MenuItem 
            text="Subrayado" 
            onClick={handleUnderline}
            icon={selectedElement.textDecoration === 'underline' ? 'tick' : undefined}
          />
        </>
      )}
      
      {/* Información adicional para imágenes */}
      {isImageElement && (
        <>
          <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
          <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666' }}>
            Imagen: {selectedElement.src ? 'Con fuente' : 'Sin fuente'}
          </div>
        </>
      )}
      
      {/* Información adicional para formas */}
      {isShapeElement && (
        <>
          <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
          <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666' }}>
            Forma: {selectedElement.type || selectedElement.className}
          </div>
        </>
      )}
    </div>
  );
};

// Componente del selector de color contextual
const ColorPickerContextMenu = ({ store, onClose }: { store: any, onClose: () => void }) => {
  const selectedElements = store.selectedElements;
  const selectedElement = selectedElements[0];
  
  if (!selectedElement) return null;
  
  const colors = [
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#000000', '#FFFFFF', '#808080', '#FFA500', '#800080', '#008000'
  ];
  
  const handleColorChange = async (color: string) => {
    await store.history.transaction(async () => {
      if (selectedElement.type === 'text' || selectedElement.className === 'Text') {
        selectedElement.set({ fill: color });
      } else {
        selectedElement.set({ fill: color });
      }
    });
    onClose();
  };
  
  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 10001,
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      padding: '16px'
    }}>
      <h4 style={{ margin: '0 0 12px 0' }}>Seleccionar Color</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
        {colors.map((color) => (
          <div
            key={color}
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: color,
              border: '2px solid #ccc',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => handleColorChange(color)}
          />
        ))}
      </div>
      <Button onClick={onClose} style={{ marginTop: '12px', width: '100%' }}>
        Cerrar
      </Button>
    </div>
  );
};

// Componente de controles de acción simplificado
const ActionControls = observer(({ store }: { store: any }) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const selectedElements = store.selectedElements;
  const hasSelection = selectedElements.length > 0;
  
  return (
    <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1000 }}>
      {hasSelection && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon="tint"
            text="Color"
            onClick={() => setShowColorPicker(true)}
          />
        </div>
      )}
      
      {showColorPicker && (
        <ColorPickerContextMenu store={store} onClose={() => setShowColorPicker(false)} />
      )}
    </div>
  );
});

const InternalEditor: React.FC = observer(() => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
  
  useEffect(() => {
    // Configurar valores por defecto para imágenes
    configurePolotnoImageDefaults(polotnoStore);
    
    // Configurar el manejo de clics derechos
    const handleRightClick = (e: MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    };
    
    document.addEventListener('contextmenu', handleRightClick);
    
    return () => {
      document.removeEventListener('contextmenu', handleRightClick);
    };
  }, []);
  
  useEffect(() => {
    // Observar cambios en las dimensiones de la página activa
    const disposer = reaction(
      () => ({
        width: polotnoStore.activePage?.width,
        height: polotnoStore.activePage?.height,
        selectedElements: polotnoStore.selectedElements.length
      }),
      ({ width, height, selectedElements }) => {
        console.log('Dimensiones de página:', { width, height, selectedElements });
      }
    );
    
    return disposer;
  }, []);
  
  useEffect(() => {
    // Funciones de corrección de arrastre desactivadas para simplificar el editor
    // const dragFixInterval = setInterval(() => {
    //   try {
    //     fixAllCanvasDragIssues(polotnoStore);
    //   } catch (error) {
    //     console.log('Error en fixAllCanvasDragIssues:', error);
    //   }
    // }, 1000);
    
    // Corrección específica para el div de herramientas de texto
    const textToolsInterval = setInterval(() => {
      const textToolsDiv = document.querySelector('div[style*="pointer-events: none"][style*="position: absolute"]');
      if (textToolsDiv && textToolsDiv instanceof HTMLElement) {
        textToolsDiv.style.pointerEvents = 'auto';
      }
    }, 500);
    
    return () => {
      // clearInterval(dragFixInterval);
      clearInterval(textToolsInterval);
    };
  }, []);
  
  useEffect(() => {
    // Scripts de diagnóstico desactivados para simplificar el editor
    // Desactivar sistemas de centrado anteriores y estructurales temporalmente
    // setupStructuralCenteringFix();
    
    return () => {
      // Limpiar intervalos al desmontar el componente
    };
  }, []);
  
  // Detectar el estado del panel lateral para aplicar clases CSS
  const sidePanelClass = sidePanelCollapsed ? 'side-panel-collapsed' : 'side-panel-expanded';
  
  return (
    <div className={`polotno-container ${sidePanelClass}`}>
      <PolotnoContainer className="polotno-app-container">
        <SidePanelWrap>
          <div className="internal-editor-side-panel">
            <SidePanel store={polotnoStore} />
          </div>
        </SidePanelWrap>
        <WorkspaceWrap>
          <Toolbar store={polotnoStore} />
          <Workspace store={polotnoStore} />
          <ActionControls store={polotnoStore} />
        </WorkspaceWrap>
      </PolotnoContainer>
      
      {contextMenu && (
        <ContextMenu
          store={polotnoStore}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
});

export default InternalEditor;