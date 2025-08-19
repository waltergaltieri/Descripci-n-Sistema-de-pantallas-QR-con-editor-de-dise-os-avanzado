import React, { useEffect, useState, useMemo } from 'react';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { SidePanel } from 'polotno/side-panel';
import { Workspace } from 'polotno/canvas/workspace';
import { PagesTimeline } from 'polotno/pages-timeline';
import { Button, Card, HTMLSelect, NumericInput, Popover, Position, Menu, MenuItem } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';
import { polotnoStore } from '../store/editorStore';
// import '../utils/forcePanelWidth'; // Desactivado temporalmente para evitar conflictos
import { fixAllCanvasDragIssues } from '../utils/fixCanvasDrag';
import { initializeForcedCentering } from '../utils/forceCenterCanvas';
import { setupEmergencyCentering } from '../utils/emergencyCentering';
import { setupAbsoluteCentering } from '../utils/absoluteCentering';
// import { setupStructuralCenteringFix } from '../utils/structuralCenteringFix';
import { debugWorkspaceCentering, monitorWorkspaceChanges, applyManualWorkspaceCentering } from '../debug-workspace-centering';
import '../test-panel-toggle'; // Script de prueba para depuración
import '../test-specific-classes';
import '../ultimate-centering-test'; // Script de testing definitivo
import '../force-centering-javascript'; // Forzado de centrado mediante JavaScript
import '../direct-centering-javascript'; // Solución JavaScript directa basada en inspección
import '@blueprintjs/core/lib/css/blueprint.css';
import './PolotnoEditor.css';
import '../emergency-centering.css';
import '../ultimate-centering-fix.css';
// import '../structural-centering-fix.css'; // Corrección estructural definitiva - DESACTIVADA TEMPORALMENTE
import '../safe-centering-fix.css'; // Solución segura de centrado
import '../nuclear-centering-override.css'; // Override nuclear para centrado definitivo
import '../direct-centering-fix.css'; // Solución directa basada en inspección del elemento

// Tipos de animaciones disponibles
const ANIMATION_TYPES = {
  entrance: {
    fadeIn: { name: 'Aparecer gradualmente', duration: 1000 },
    slideInLeft: { name: 'Deslizar desde izquierda', duration: 800 },
    slideInRight: { name: 'Deslizar desde derecha', duration: 800 },
    slideInUp: { name: 'Deslizar desde abajo', duration: 800 },
    slideInDown: { name: 'Deslizar desde arriba', duration: 800 },
    scaleIn: { name: 'Escalar hacia adentro', duration: 600 },
    bounceIn: { name: 'Rebotar hacia adentro', duration: 1200 },
    rotateIn: { name: 'Rotar hacia adentro', duration: 800 }
  },
  exit: {
    fadeOut: { name: 'Desvanecer', duration: 1000 },
    slideOutLeft: { name: 'Deslizar hacia izquierda', duration: 800 },
    slideOutRight: { name: 'Deslizar hacia derecha', duration: 800 },
    slideOutUp: { name: 'Deslizar hacia arriba', duration: 800 },
    slideOutDown: { name: 'Deslizar hacia abajo', duration: 800 },
    scaleOut: { name: 'Escalar hacia afuera', duration: 600 },
    bounceOut: { name: 'Rebotar hacia afuera', duration: 1200 },
    rotateOut: { name: 'Rotar hacia afuera', duration: 800 }
  },
  emphasis: {
    pulse: { name: 'Pulsar', duration: 1000 },
    shake: { name: 'Sacudir', duration: 800 },
    bounce: { name: 'Rebotar', duration: 1200 },
    flash: { name: 'Parpadear', duration: 1000 },
    wobble: { name: 'Tambalearse', duration: 1000 },
    swing: { name: 'Balancearse', duration: 1000 },
    rubberBand: { name: 'Banda elástica', duration: 1000 }
  }
};

// Función para aplicar animación a un elemento
const applyAnimation = (element: any, konvaStage: any, animationType: string, category: string, duration: number, delay: number) => {
  if (!element || !konvaStage) return;
  
  console.log(`Aplicando animación ${animationType} (${category}) al elemento:`, element);
  
  // Obtener el nodo Konva del elemento usando el stage
  const konvaNode = konvaStage.findOne(`#${element.id}`);
  if (!konvaNode) {
    console.warn('No se pudo obtener el nodo Konva del elemento con ID:', element.id);
    return;
  }
  
  // Verificar que el nodo tiene las funciones necesarias
  if (typeof konvaNode.x !== 'function') {
    console.warn('El nodo encontrado no es un nodo Konva válido');
    return;
  }
  
  // Configuración base de la animación
  const animConfig = {
    duration: duration / 1000, // Konva usa segundos
    easing: 'EaseInOut'
  };
  
  // Aplicar delay si se especifica
  if (delay > 0) {
    setTimeout(() => executeAnimation(konvaNode, animationType, category, animConfig), delay);
  } else {
    executeAnimation(konvaNode, animationType, category, animConfig);
  }
};

// Función para ejecutar la animación específica
const executeAnimation = (node: any, animationType: string, category: string, config: any) => {
  const originalProps = {
    x: node.x(),
    y: node.y(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    rotation: node.rotation(),
    opacity: node.opacity()
  };
  
  switch (category) {
    case 'entrance':
      executeEntranceAnimation(node, animationType, config, originalProps);
      break;
    case 'exit':
      executeExitAnimation(node, animationType, config, originalProps);
      break;
    case 'emphasis':
      executeEmphasisAnimation(node, animationType, config, originalProps);
      break;
  }
};

// Animaciones de entrada
const executeEntranceAnimation = (node: any, type: string, config: any, original: any) => {
  switch (type) {
    case 'fadeIn':
      node.opacity(0);
      node.to({ ...config, opacity: original.opacity });
      break;
    case 'slideInLeft':
      node.x(original.x - 200);
      node.to({ ...config, x: original.x });
      break;
    case 'slideInRight':
      node.x(original.x + 200);
      node.to({ ...config, x: original.x });
      break;
    case 'slideInUp':
      node.y(original.y + 200);
      node.to({ ...config, y: original.y });
      break;
    case 'slideInDown':
      node.y(original.y - 200);
      node.to({ ...config, y: original.y });
      break;
    case 'scaleIn':
      node.scaleX(0);
      node.scaleY(0);
      node.to({ ...config, scaleX: original.scaleX, scaleY: original.scaleY });
      break;
    case 'bounceIn':
      node.scaleX(0);
      node.scaleY(0);
      node.to({ ...config, scaleX: original.scaleX, scaleY: original.scaleY, easing: 'ElasticEaseOut' });
      break;
    case 'rotateIn':
      node.rotation(original.rotation - 180);
      node.to({ ...config, rotation: original.rotation });
      break;
  }
};

// Animaciones de salida
const executeExitAnimation = (node: any, type: string, config: any, original: any) => {
  switch (type) {
    case 'fadeOut':
      node.to({ ...config, opacity: 0 });
      break;
    case 'slideOutLeft':
      node.to({ ...config, x: original.x - 200 });
      break;
    case 'slideOutRight':
      node.to({ ...config, x: original.x + 200 });
      break;
    case 'slideOutUp':
      node.to({ ...config, y: original.y - 200 });
      break;
    case 'slideOutDown':
      node.to({ ...config, y: original.y + 200 });
      break;
    case 'scaleOut':
      node.to({ ...config, scaleX: 0, scaleY: 0 });
      break;
    case 'bounceOut':
      node.to({ ...config, scaleX: 0, scaleY: 0, easing: 'ElasticEaseIn' });
      break;
    case 'rotateOut':
      node.to({ ...config, rotation: original.rotation + 180 });
      break;
  }
};

// Animaciones de énfasis
const executeEmphasisAnimation = (node: any, type: string, config: any, original: any) => {
  switch (type) {
    case 'pulse':
      node.to({
        duration: config.duration / 2,
        scaleX: original.scaleX * 1.1,
        scaleY: original.scaleY * 1.1,
        onFinish: () => {
          node.to({
            duration: config.duration / 2,
            scaleX: original.scaleX,
            scaleY: original.scaleY
          });
        }
      });
      break;
    case 'shake':
      const shakeAnimation = () => {
        node.to({
          duration: 0.1,
          x: original.x + 10,
          onFinish: () => {
            node.to({
              duration: 0.1,
              x: original.x - 10,
              onFinish: () => {
                node.to({ duration: 0.1, x: original.x });
              }
            });
          }
        });
      };
      for (let i = 0; i < 3; i++) {
        setTimeout(shakeAnimation, i * 300);
      }
      break;
    case 'bounce':
      node.to({
        duration: config.duration / 2,
        y: original.y - 30,
        easing: 'EaseOut',
        onFinish: () => {
          node.to({
            duration: config.duration / 2,
            y: original.y,
            easing: 'BounceEaseOut'
          });
        }
      });
      break;
    case 'flash':
      node.to({
        duration: config.duration / 4,
        opacity: 0.3,
        onFinish: () => {
          node.to({
            duration: config.duration / 4,
            opacity: original.opacity,
            onFinish: () => {
              node.to({
                duration: config.duration / 4,
                opacity: 0.3,
                onFinish: () => {
                  node.to({ duration: config.duration / 4, opacity: original.opacity });
                }
              });
            }
          });
        }
      });
      break;
    case 'wobble':
      node.to({
        duration: config.duration / 4,
        rotation: original.rotation + 15,
        onFinish: () => {
          node.to({
            duration: config.duration / 4,
            rotation: original.rotation - 10,
            onFinish: () => {
              node.to({
                duration: config.duration / 4,
                rotation: original.rotation + 5,
                onFinish: () => {
                  node.to({ duration: config.duration / 4, rotation: original.rotation });
                }
              });
            }
          });
        }
      });
      break;
    case 'swing':
      node.to({
        duration: config.duration / 2,
        rotation: original.rotation + 15,
        onFinish: () => {
          node.to({
            duration: config.duration / 2,
            rotation: original.rotation - 15,
            onFinish: () => {
              node.to({ duration: config.duration / 4, rotation: original.rotation });
            }
          });
        }
      });
      break;
    case 'rubberBand':
      node.to({
        duration: config.duration / 3,
        scaleX: original.scaleX * 1.25,
        scaleY: original.scaleY * 0.75,
        onFinish: () => {
          node.to({
            duration: config.duration / 3,
            scaleX: original.scaleX * 0.75,
            scaleY: original.scaleY * 1.25,
            onFinish: () => {
              node.to({
                duration: config.duration / 3,
                scaleX: original.scaleX,
                scaleY: original.scaleY
              });
            }
          });
        }
      });
      break;
  }
};

// Componente del panel de animaciones
const AnimationsPanel = ({ store, onClose }: { store: any, onClose: () => void }) => {
  const [selectedCategory, setSelectedCategory] = useState('entrance');
  const [selectedAnimation, setSelectedAnimation] = useState('');
  const [duration, setDuration] = useState(1000);
  const [delay, setDelay] = useState(0);
  
  const selectedElements = store.selectedElements;
  
  const handleApplyAnimation = () => {
    if (!selectedAnimation || selectedElements.length === 0) return;
    
    // Obtener el stage de Konva desde el store
    const konvaStage = store.stage;
    if (!konvaStage) {
      console.warn('No se pudo obtener el stage de Konva');
      return;
    }
    
    selectedElements.forEach((element: any) => {
      applyAnimation(element, konvaStage, selectedAnimation, selectedCategory, duration, delay);
    });
    
    console.log(`Animación ${selectedAnimation} aplicada a ${selectedElements.length} elemento(s)`);
  };
  
  const currentAnimations = ANIMATION_TYPES[selectedCategory as keyof typeof ANIMATION_TYPES];
  
  return (
    <Card style={{ width: '320px', padding: '16px' }}>
      <h4 style={{ margin: '0 0 16px 0' }}>Panel de Animaciones</h4>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
          Tipo de Animación:
        </label>
        <HTMLSelect
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setSelectedAnimation('');
          }}
          fill
        >
          <option value="entrance">Entrada</option>
          <option value="exit">Salida</option>
          <option value="emphasis">Énfasis</option>
        </HTMLSelect>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
          Animación:
        </label>
        <HTMLSelect
           value={selectedAnimation}
           onChange={(e) => {
             setSelectedAnimation(e.target.value);
             if (e.target.value && (currentAnimations as any)[e.target.value]) {
               setDuration((currentAnimations as any)[e.target.value].duration);
             }
           }}
          fill
          disabled={!selectedCategory}
        >
          <option value="">Seleccionar animación...</option>
          {Object.entries(currentAnimations).map(([key, anim]) => (
            <option key={key} value={key}>{anim.name}</option>
          ))}
        </HTMLSelect>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
          Duración (ms):
        </label>
        <NumericInput
          value={duration}
          onValueChange={(value) => setDuration(value || 1000)}
          min={100}
          max={5000}
          stepSize={100}
          fill
        />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: 'bold' }}>
          Retraso (ms):
        </label>
        <NumericInput
          value={delay}
          onValueChange={(value) => setDelay(value || 0)}
          min={0}
          max={10000}
          stepSize={100}
          fill
        />
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button
          intent="primary"
          onClick={handleApplyAnimation}
          disabled={!selectedAnimation || selectedElements.length === 0}
          fill
        >
          Aplicar Animación
        </Button>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </div>
      
      {selectedElements.length === 0 && (
        <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '12px' }}>
          Selecciona un elemento para aplicar animaciones
        </div>
      )}
    </Card>
  );
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
  
  const handleDuplicate = () => {
    selectedElements.forEach((element: any) => {
      const newElement = { ...element.toJSON() };
      newElement.id = 'element_' + Math.random().toString(36).substr(2, 9);
      newElement.x = element.x + 20;
      newElement.y = element.y + 20;
      store.activePage.addElement(newElement);
    });
    onClose();
  };
  
  const handleDelete = () => {
    selectedElements.forEach((element: any) => {
      element.remove();
    });
    onClose();
  };
  
  const handleBringToFront = () => {
    selectedElements.forEach((element: any) => {
      element.moveToTop();
    });
    onClose();
  };
  
  const handleSendToBack = () => {
    selectedElements.forEach((element: any) => {
      element.moveToBottom();
    });
    onClose();
  };

  const handleBold = () => {
    if (isTextElement) {
      const currentStyle = selectedElement.fontStyle || '';
      const isBold = currentStyle.includes('bold');
      selectedElement.set({
        fontStyle: isBold ? currentStyle.replace('bold', '').trim() : `${currentStyle} bold`.trim()
      });
    }
    onClose();
  };

  const handleItalic = () => {
    if (isTextElement) {
      const currentStyle = selectedElement.fontStyle || '';
      const isItalic = currentStyle.includes('italic');
      selectedElement.set({
        fontStyle: isItalic ? currentStyle.replace('italic', '').trim() : `${currentStyle} italic`.trim()
      });
    }
    onClose();
  };

  const handleUnderline = () => {
    if (isTextElement) {
      const currentDecoration = selectedElement.textDecoration || '';
      const isUnderlined = currentDecoration.includes('underline');
      selectedElement.set({
        textDecoration: isUnderlined ? currentDecoration.replace('underline', '').trim() : `${currentDecoration} underline`.trim()
      });
    }
    onClose();
  };

  const handleAlignLeft = () => {
    if (isTextElement) {
      selectedElement.set({ align: 'left' });
    }
    onClose();
  };

  const handleAlignCenter = () => {
    if (isTextElement) {
      selectedElement.set({ align: 'center' });
    }
    onClose();
  };

  const handleAlignRight = () => {
    if (isTextElement) {
      selectedElement.set({ align: 'right' });
    }
    onClose();
  };

  const handleFlipHorizontal = () => {
    if (selectedElement) {
      const currentScaleX = selectedElement.scaleX || 1;
      selectedElement.set({ scaleX: -currentScaleX });
    }
    onClose();
  };

  const handleFlipVertical = () => {
    if (selectedElement) {
      const currentScaleY = selectedElement.scaleY || 1;
      selectedElement.set({ scaleY: -currentScaleY });
    }
    onClose();
  };

  const handleLock = () => {
    selectedElements.forEach((element: any) => {
      element.set({ selectable: false, draggable: false });
    });
    onClose();
  };

  const handleGroup = () => {
    if (isMultipleSelection) {
      // Crear un grupo con los elementos seleccionados
      const group = {
        type: 'group',
        id: 'group_' + Math.random().toString(36).substr(2, 9),
        x: Math.min(...selectedElements.map((el: any) => el.x)),
        y: Math.min(...selectedElements.map((el: any) => el.y)),
        children: selectedElements.map((el: any) => el.toJSON())
      };
      
      // Eliminar elementos individuales
      selectedElements.forEach((element: any) => element.remove());
      
      // Agregar el grupo
      store.activePage.addElement(group);
    }
    onClose();
  };

  const handleResetTransform = () => {
    selectedElements.forEach((element: any) => {
      element.set({
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        skewX: 0,
        skewY: 0
      });
    });
    onClose();
  };
  
  return (
    <div 
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: '150px'
      }}
    >
      <Menu>
        {/* Selector de colores */}
        <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', marginBottom: '4px' }}>Color</div>
          <ColorPickerContextMenu store={store} onClose={onClose} />
        </div>
        
        {/* Opciones específicas para texto */}
        {isTextElement && (
          <div style={{ borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', padding: '8px 12px 4px', borderBottom: '1px solid #f0f0f0' }}>Formato de Texto</div>
            <MenuItem 
              icon="bold" 
              text="Negrita" 
              onClick={handleBold}
            />
            <MenuItem 
              icon="italic" 
              text="Cursiva" 
              onClick={handleItalic}
            />
            <MenuItem 
              icon="underline" 
              text="Subrayado" 
              onClick={handleUnderline}
            />
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', padding: '8px 12px 4px', borderBottom: '1px solid #f0f0f0' }}>Alineación</div>
            <MenuItem 
              icon="align-left" 
              text="Alinear izquierda" 
              onClick={handleAlignLeft}
            />
            <MenuItem 
              icon="align-center" 
              text="Centrar" 
              onClick={handleAlignCenter}
            />
            <MenuItem 
              icon="align-right" 
              text="Alinear derecha" 
              onClick={handleAlignRight}
            />
          </div>
        )}
        
        {/* Opciones específicas para imágenes */}
        {isImageElement && (
          <div style={{ borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', padding: '8px 12px 4px', borderBottom: '1px solid #f0f0f0' }}>Imagen</div>
            <MenuItem 
              icon="swap-horizontal" 
              text="Voltear horizontal" 
              onClick={handleFlipHorizontal}
            />
            <MenuItem 
              icon="swap-vertical" 
              text="Voltear vertical" 
              onClick={handleFlipVertical}
            />
            <MenuItem 
              icon="reset" 
              text="Restablecer transformación" 
              onClick={handleResetTransform}
            />
          </div>
        )}
        
        {/* Opciones específicas para formas */}
        {isShapeElement && (
          <div style={{ borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', padding: '8px 12px 4px', borderBottom: '1px solid #f0f0f0' }}>Forma</div>
            <MenuItem 
              icon="swap-horizontal" 
              text="Voltear horizontal" 
              onClick={handleFlipHorizontal}
            />
            <MenuItem 
              icon="swap-vertical" 
              text="Voltear vertical" 
              onClick={handleFlipVertical}
            />
            <MenuItem 
              icon="reset" 
              text="Restablecer transformación" 
              onClick={handleResetTransform}
            />
          </div>
        )}
        
        {/* Opciones para selección múltiple */}
        {isMultipleSelection && (
          <div style={{ borderBottom: '1px solid #eee' }}>
            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', padding: '8px 12px 4px', borderBottom: '1px solid #f0f0f0' }}>Selección Múltiple</div>
            <MenuItem 
              icon="group-objects" 
              text="Agrupar elementos" 
              onClick={handleGroup}
            />
          </div>
        )}
        
        {/* Opciones generales */}
        <div style={{ borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', padding: '8px 12px 4px', borderBottom: '1px solid #f0f0f0' }}>Acciones</div>
          <MenuItem 
            icon="duplicate" 
            text="Duplicar" 
            onClick={handleDuplicate}
          />
          <MenuItem 
            icon="lock" 
            text="Bloquear elemento" 
            onClick={handleLock}
          />
        </div>
        
        <div style={{ borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold', padding: '8px 12px 4px', borderBottom: '1px solid #f0f0f0' }}>Orden</div>
          <MenuItem 
            icon="bring-data" 
            text="Traer al frente" 
            onClick={handleBringToFront}
          />
          <MenuItem 
            icon="send-to-map" 
            text="Enviar atrás" 
            onClick={handleSendToBack}
          />
        </div>
        
        <MenuItem 
          icon="trash" 
          text="Eliminar" 
          intent="danger"
          onClick={handleDelete}
        />
      </Menu>
    </div>
  );
};

// Componente de selector de colores para el menú contextual
const ColorPickerContextMenu = ({ store, onClose }: { store: any, onClose: () => void }) => {
  const [currentColor, setCurrentColor] = useState('#000000');
  
  // Calcular hasSelection directamente (MobX se encarga de la reactividad)
  const hasSelection = store.selectedElements.length > 0;
  
  // Obtener el color actual del elemento seleccionado
  React.useEffect(() => {
    if (hasSelection && store.selectedElements.length > 0) {
      const selectedElement = store.selectedElements[0];
      if (selectedElement && selectedElement.fill) {
        setCurrentColor(selectedElement.fill);
      }
    }
  }, [hasSelection, store.selectedElements]); // Usar las dependencias correctas

  const handleColorChange = (color: string) => {
    setCurrentColor(color);
    if (hasSelection) {
      store.selectedElements.forEach((element: any) => {
        element.set({ fill: color });
      });
    }
    onClose();
  };
  
  const colorOptions = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];
  
  return (
    <div style={{ padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', minWidth: '150px' }}>
      {colorOptions.map((color) => (
        <button
          key={color}
          style={{
            width: '24px',
            height: '24px',
            backgroundColor: color,
            border: currentColor === color ? '2px solid #1f4788' : '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onClick={() => handleColorChange(color)}
          title={`Color: ${color}`}
        />
      ))}
    </div>
  );
};

// Componente personalizado para controles de acción en el toolbar - OCULTO POR SOLICITUD DEL USUARIO
const ActionControls = observer(({ store }: { store: any }) => {
  // const [showAnimationsPanel, setShowAnimationsPanel] = useState(false);
  
  // Verificar si hay elementos seleccionados usando useMemo para evitar re-renders
  // const hasSelection = useMemo(() => store.selectedElements.length > 0, [store.selectedElements.length]);
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {/* Botón de animaciones - OCULTO POR SOLICITUD DEL USUARIO */}
      {/* {hasSelection && (
        <Popover
          content={<AnimationsPanel store={store} onClose={() => setShowAnimationsPanel(false)} />}
          position={Position.BOTTOM_LEFT}
          isOpen={showAnimationsPanel}
          onClose={() => setShowAnimationsPanel(false)}
        >
          <Button
            icon="video"
            small
            intent={showAnimationsPanel ? 'primary' : 'none'}
            onClick={() => setShowAnimationsPanel(!showAnimationsPanel)}
            title="Agregar animaciones al elemento seleccionado"
          />
        </Popover>
      )} */}
    </div>
  );
});

const PolotnoEditor: React.FC = observer(() => {
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  
  // Calcular hasSelection directamente (MobX se encarga de la reactividad)
  const hasSelection = polotnoStore.selectedElements.length > 0;
  
  // Hacer el store disponible globalmente para depuración
  React.useEffect(() => {
    (window as any).polotnoStore = polotnoStore;
  }, []);
  
  // Manejar clic derecho en el workspace
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Solo mostrar menú contextual si hay elementos seleccionados
      if (polotnoStore.selectedElements.length > 0) {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
      }
    };
    
    const handleClick = () => {
      setContextMenu(null);
    };
    
    // Agregar event listeners al documento
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClick);
    };
  }, []);
  
  // Observar cambios en las dimensiones de la página activa (ejecutar solo una vez)
  useEffect(() => {
    const activePage = polotnoStore.activePage;
    if (!activePage) return;
    
    // Solo ejecutar si las dimensiones son válidas (no 'auto')
    if (activePage.width === 'auto' || activePage.height === 'auto') {
      console.log('PolotnoEditor: Skipping viewport update for auto dimensions');
      return;
    }
    
    // Función simple para disparar evento de resize
    const handleResize = () => {
      setTimeout(() => {
        try {
          // Solo disparar evento de resize en el workspace
          if (typeof window !== 'undefined') {
            const event = new Event('resize');
            window.dispatchEvent(event);
          }
        } catch (error) {
          console.warn('Error dispatching resize event:', error);
        }
      }, 100);
    };
    
    // Ejecutar una sola vez al montar el componente
    handleResize();
    
  }, []); // Ejecutar solo una vez al montar

  // Observar cambios en la selección para aplicar/quitar clase CSS y corregir arrastre
  useEffect(() => {
    const updateSelectionClass = () => {
      const container = document.getElementById('polotno-container');
      if (container) {
        // Comentamos la adición de la clase pero mantenemos la eliminación
        // if (hasSelection) {
        //   container.classList.add('polotno-editor-has-selection');
        // } else {
        //   container.classList.remove('polotno-editor-has-selection');
        // }
        
        // Siempre eliminar la clase para evitar problemas con la barra lateral
        container.classList.remove('polotno-editor-has-selection');
        
        // Mantener la corrección de problemas de arrastre cuando hay selección
        if (hasSelection) {
          setTimeout(() => {
            try {
              const result = fixAllCanvasDragIssues(polotnoStore as any);
              if (result.fixes.fixed > 0) {
                console.log(`🔧 Corregidos ${result.fixes.fixed} elementos al seleccionar`);
              }
            } catch (error) {
              console.warn('Error corrigiendo arrastre en selección:', error);
            }
          }, 100);
        }
      }
    };
    
    updateSelectionClass();
  }, [hasSelection]);

  // Efecto para arreglar el div problemático de herramientas de texto
  useEffect(() => {
    const fixTextToolsDiv = () => {
      // Buscar el div específico con padding: 10px y display: flex
      const textToolsDiv = document.querySelector('.polotno-side-panel div[style*="padding: 10px"][style*="display: flex"]');
      if (textToolsDiv && !textToolsDiv.classList.contains('text-tools-container')) {
        textToolsDiv.classList.add('text-tools-container');
        console.log('PolotnoEditor: Added text-tools-container class to problematic div');
      }
    };

    // Ejecutar inmediatamente
    fixTextToolsDiv();

    // Ejecutar cada 500ms para capturar cambios dinámicos
    const interval = setInterval(fixTextToolsDiv, 500);

    // Script de investigación desactivado para evitar bucle infinito
    // import('../investigate-polotno-classes.js').then((module) => {
    //   console.log('🔍 Script de investigación de clases Polotno cargado');
    //   // La función se auto-ejecuta al importar
    // }).catch(err => {
    //   console.error('❌ Error cargando script de investigación:', err);
    // });

    // Script de diagnóstico para problemas de arrastre - Activado
    import('../debug-canvas-drag').then(() => {
      console.log('🔧 Script de diagnóstico de canvas cargado');
      console.log('💡 Ejecuta debugCanvasDrag() en la consola para diagnosticar');
      console.log('💡 Ejecuta enableDragForAllElements() para habilitar arrastre');
      
      // Hacer el store disponible globalmente para diagnóstico
      (window as any).polotnoStore = polotnoStore;
      
      // TEMPORALMENTE DESHABILITADO: Ejecutar corrección automática de problemas de arrastre
       // setTimeout(() => {
       //   try {
       //     console.log('🔧 Ejecutando corrección automática de arrastre...');
       //     const result = fixAllCanvasDragIssues(polotnoStore as any);
       //     if (result.fixes.fixed > 0) {
       //       console.log(`✅ Se corrigieron ${result.fixes.fixed} elementos con problemas de arrastre`);
       //     }
           
       //     // Configurar verificación periódica cada 5 segundos
       //     const dragFixInterval = setInterval(() => {
       //       try {
       //         const periodicResult = fixAllCanvasDragIssues(polotnoStore as any);
       //         if (periodicResult.fixes.fixed > 0) {
       //           console.log(`🔄 Corrección periódica: ${periodicResult.fixes.fixed} elementos corregidos`);
       //         }
       //       } catch (error) {
       //         console.warn('Error en corrección periódica:', error);
       //       }
       //     }, 5000);
           
       //     // Limpiar intervalo cuando el componente se desmonte
       //     (window as any).dragFixInterval = dragFixInterval;
       //   } catch (error) {
       //     console.error('❌ Error en corrección automática:', error);
       //   }
       // }, 1000);
    }).catch(err => {
      console.error('❌ Error cargando script de diagnóstico:', err);
    });
    
    // DESACTIVAR sistemas anteriores para evitar conflictos
    // const cleanupCentering = initializeForcedCentering();
    // const cleanupEmergency = setupEmergencyCentering();
    
    // Inicializar sistema de centrado estructural (solución final) - DESACTIVADO TEMPORALMENTE
    console.log('🎯 Sistema de centrado estructural desactivado temporalmente');
    // const cleanupStructural = setupStructuralCenteringFix();
    
    // Limpiar al desmontar el componente
     return () => {
       // if (cleanupCentering) {
       //   cleanupCentering();
       // }
       // if (cleanupEmergency) {
       //   cleanupEmergency();
       // }
       // if (cleanupStructural) {
       //   cleanupStructural();
       // }
      clearInterval(interval);
      // Limpiar también el intervalo de corrección de arrastre
      if ((window as any).dragFixInterval) {
        clearInterval((window as any).dragFixInterval);
      }
    };
  }, []); // Ejecutar solo una vez al montar el componente
  
  // Detectar el estado del panel lateral para aplicar clases CSS apropiadas
  const [sidePanelVisible, setSidePanelVisible] = React.useState(!!polotnoStore.openedSidePanel);
  
  React.useEffect(() => {
    const dispose = reaction(
      () => polotnoStore.openedSidePanel,
      (openedSidePanel) => {
        setSidePanelVisible(!!openedSidePanel);
        
        // DESHABILITADO: Permitir que las reglas CSS manejen el centrado
        // setTimeout(() => {
        //   try {
        //     debugWorkspaceCentering();
        //     applyManualWorkspaceCentering();
        //   } catch (error) {
        //     console.warn('Error en depuración del workspace:', error);
        //   }
        // }, 100);
      },
      { fireImmediately: true }
    );
    
    return dispose;
  }, []);
  
  return (
    // Contenedor de aislamiento CSS según las mejores prácticas de la guía
    <div 
      id="polotno-container" 
      className="polotno-editor-isolation"
      data-side-panel={sidePanelVisible ? 'visible' : 'hidden'}
    >
      <PolotnoContainer className="kaze-polotno-editor-container">
        <SidePanelWrap className="kaze-side-panel-fixed">
          <SidePanel store={polotnoStore} />
        </SidePanelWrap>
        <WorkspaceWrap className="kaze-workspace-container">
          <div className="kaze-workspace-inner">
            <Toolbar 
              store={polotnoStore} 
              downloadButtonEnabled 
              components={{
                ActionControls,
              }}
            />
            <Workspace store={polotnoStore} />
            <ZoomButtons store={polotnoStore} />
            <PagesTimeline store={polotnoStore} />
          </div>
        </WorkspaceWrap>
      </PolotnoContainer>
      
      {/* Menú contextual */}
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

export default PolotnoEditor;