/**
 * Sistema de animaciones en tiempo real para el canvas del editor
 * Aplica animaciones a los elementos seleccionados usando Konva
 */

// @ts-ignore
import Konva from 'konva';

interface Animation {
  type: string;
  duration: number;
  delay: number;
  loop: boolean;
}

// Mapa para almacenar las animaciones activas
const activeAnimations = new Map<string, any>();

/**
 * Aplica una animación a un elemento del canvas
 * @param store - Store de Polotno
 * @param elementId - ID del elemento
 * @param animation - Configuración de la animación
 */
export function applyCanvasAnimation(store: any, elementId: string, animation: Animation) {
  console.log('🎬 Intentando aplicar animación:', animation.type, 'a elemento:', elementId);
  
  // Detener animación anterior si existe
  stopCanvasAnimation(elementId);
  
  // Buscar el elemento en el store
  const element = store.getElementById(elementId);
  if (!element) {
    console.warn('❌ Elemento no encontrado en store:', elementId);
    return;
  }
  
  console.log('✅ Elemento encontrado en store');
  
  // Función para intentar obtener el stage y aplicar la animación
  const tryApplyAnimation = (attempt: number = 1) => {
    console.log(`🔄 Intento ${attempt} de aplicar animación...`);
    
    // Obtener el stage de Konva desde el DOM
    const canvas = document.querySelector('.konvajs-content canvas') as any;
    if (!canvas || !canvas._konva) {
      console.warn(`⚠️ Stage de Konva no disponible (intento ${attempt})`);
      
      // Reintentar hasta 5 veces
      if (attempt < 5) {
        setTimeout(() => tryApplyAnimation(attempt + 1), 200 * attempt);
      } else {
        console.error('❌ No se pudo acceder al stage de Konva después de 5 intentos');
      }
      return;
    }
    
    const stage = canvas._konva;
    console.log('✅ Stage de Konva obtenido');
    
    // Buscar el nodo de Konva correspondiente
    const allNodes = stage.find('*');
    console.log(`📊 Total de nodos en el stage: ${allNodes.length}`);
    
    // Intentar múltiples métodos para encontrar el nodo
    let node = null;
    
    // Método 1: Por ID directo
    node = allNodes.find((n: any) => n.id() === elementId);
    if (node) console.log('✅ Nodo encontrado por ID directo');
    
    // Método 2: Por atributo id
    if (!node) {
      node = allNodes.find((n: any) => n.getAttr('id') === elementId);
      if (node) console.log('✅ Nodo encontrado por atributo id');
    }
    
    // Método 3: Por name
    if (!node) {
      node = allNodes.find((n: any) => n.name() === elementId);
      if (node) console.log('✅ Nodo encontrado por name');
    }
    
    // Método 4: Buscar en grupos
    if (!node) {
      const groups = stage.find('Group');
      for (const group of groups) {
        const children = group.getChildren();
        for (const child of children) {
          const childId = child.id() || child.getAttr('id') || child.name();
          if (childId === elementId) {
            node = child;
            console.log('✅ Nodo encontrado en grupo hijo');
            break;
          }
        }
        if (node) break;
      }
    }
    
    if (!node) {
      console.error('❌ Nodo Konva no encontrado para elemento:', elementId);
      console.log('📋 IDs disponibles (primeros 20):', 
        allNodes.slice(0, 20).map((n: any) => ({
          id: n.id(),
          attrId: n.getAttr('id'),
          name: n.name(),
          type: n.getClassName()
        }))
      );
      return;
    }
    
    console.log('✅ Nodo encontrado:', {
      id: node.id(),
      type: node.getClassName(),
      x: node.x(),
      y: node.y()
    });
    
    // Aplicar la animación
    executeAnimation(node, animation, elementId);
  };
  
  // Iniciar el proceso
  tryApplyAnimation();
}

/**
 * Ejecuta la animación en un nodo de Konva
 */
function executeAnimation(node: any, animation: Animation, elementId: string) {
  console.log('🎬 Ejecutando animación:', animation.type);
  
  // Guardar propiedades originales
  const originalProps = {
    x: node.x(),
    y: node.y(),
    scaleX: node.scaleX(),
    scaleY: node.scaleY(),
    rotation: node.rotation(),
    opacity: node.opacity()
  };
  
  const { type, duration, delay } = animation;
  const durationSec = duration / 1000;
  
  // Guardar la animación activa
  activeAnimations.set(elementId, { node, animation });
  
  // Función para ejecutar la animación
  function runAnimation() {
    console.log('▶️ Ejecutando ciclo de animación:', type);
    let anim: any;
    
    switch(type) {
      case 'pulse':
        anim = new Konva.Tween({
          node: node,
          duration: durationSec / 2,
          scaleX: originalProps.scaleX * 1.05,
          scaleY: originalProps.scaleY * 1.05,
          easing: Konva.Easings.EaseInOut,
          onFinish: function() {
            const anim2 = new Konva.Tween({
              node: node,
              duration: durationSec / 2,
              scaleX: originalProps.scaleX,
              scaleY: originalProps.scaleY,
              easing: Konva.Easings.EaseInOut,
              onFinish: runAnimation
            });
            anim2.play();
            activeAnimations.set(elementId, anim2);
          }
        });
        break;
        
      case 'bounce':
        anim = new Konva.Tween({
          node: node,
          duration: durationSec / 2,
          y: originalProps.y - 20,
          easing: Konva.Easings.EaseOut,
          onFinish: function() {
            const anim2 = new Konva.Tween({
              node: node,
              duration: durationSec / 2,
              y: originalProps.y,
              easing: Konva.Easings.BounceEaseOut,
              onFinish: runAnimation
            });
            anim2.play();
            activeAnimations.set(elementId, anim2);
          }
        });
        break;
        
      case 'rotate':
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          rotation: originalProps.rotation + 360,
          easing: Konva.Easings.Linear,
          onFinish: function() {
            node.rotation(originalProps.rotation);
            runAnimation();
          }
        });
        break;
        
      case 'swing':
        anim = new Konva.Tween({
          node: node,
          duration: durationSec / 2,
          rotation: originalProps.rotation + 15,
          easing: Konva.Easings.EaseInOut,
          onFinish: function() {
            const anim2 = new Konva.Tween({
              node: node,
              duration: durationSec / 2,
              rotation: originalProps.rotation - 15,
              easing: Konva.Easings.EaseInOut,
              onFinish: function() {
                const anim3 = new Konva.Tween({
                  node: node,
                  duration: durationSec / 4,
                  rotation: originalProps.rotation,
                  easing: Konva.Easings.EaseInOut,
                  onFinish: runAnimation
                });
                anim3.play();
                activeAnimations.set(elementId, anim3);
              }
            });
            anim2.play();
            activeAnimations.set(elementId, anim2);
          }
        });
        break;
        
      case 'flash':
        anim = new Konva.Tween({
          node: node,
          duration: durationSec / 2,
          opacity: 0.3,
          easing: Konva.Easings.EaseInOut,
          onFinish: function() {
            const anim2 = new Konva.Tween({
              node: node,
              duration: durationSec / 2,
              opacity: originalProps.opacity,
              easing: Konva.Easings.EaseInOut,
              onFinish: runAnimation
            });
            anim2.play();
            activeAnimations.set(elementId, anim2);
          }
        });
        break;
        
      case 'fadeIn':
        node.opacity(0);
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          opacity: originalProps.opacity,
          easing: Konva.Easings.EaseInOut
        });
        break;
        
      case 'slideInLeft':
        node.x(originalProps.x - 200);
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          x: originalProps.x,
          easing: Konva.Easings.EaseOut
        });
        break;
        
      case 'slideInRight':
        node.x(originalProps.x + 200);
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          x: originalProps.x,
          easing: Konva.Easings.EaseOut
        });
        break;
        
      case 'slideInUp':
        node.y(originalProps.y + 200);
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          y: originalProps.y,
          easing: Konva.Easings.EaseOut
        });
        break;
        
      case 'slideInDown':
        node.y(originalProps.y - 200);
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          y: originalProps.y,
          easing: Konva.Easings.EaseOut
        });
        break;
        
      case 'scaleIn':
        node.scaleX(0);
        node.scaleY(0);
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          scaleX: originalProps.scaleX,
          scaleY: originalProps.scaleY,
          easing: Konva.Easings.EaseOut
        });
        break;
        
      case 'bounceIn':
        node.scaleX(0);
        node.scaleY(0);
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          scaleX: originalProps.scaleX,
          scaleY: originalProps.scaleY,
          easing: Konva.Easings.ElasticEaseOut
        });
        break;
        
      case 'rotateIn':
        node.rotation(originalProps.rotation - 180);
        anim = new Konva.Tween({
          node: node,
          duration: durationSec,
          rotation: originalProps.rotation,
          easing: Konva.Easings.EaseOut
        });
        break;
        
      default:
        console.warn('Tipo de animación no soportado:', type);
        return;
    }
    
    if (anim) {
      activeAnimations.set(elementId, anim);
      if (delay > 0) {
        setTimeout(() => anim.play(), delay);
      } else {
        anim.play();
      }
    }
  }
  
  // Iniciar la animación
  runAnimation();
}

/**
 * Detiene la animación de un elemento
 * @param elementId - ID del elemento
 */
export function stopCanvasAnimation(elementId: string) {
  const anim = activeAnimations.get(elementId);
  if (anim) {
    try {
      anim.destroy();
    } catch (e) {
      // Ignorar errores al destruir
    }
    activeAnimations.delete(elementId);
  }
}

/**
 * Detiene todas las animaciones activas
 */
export function stopAllCanvasAnimations() {
  activeAnimations.forEach((anim, elementId) => {
    try {
      anim.destroy();
    } catch (e) {
      // Ignorar errores
    }
  });
  activeAnimations.clear();
}

/**
 * Reinicia las animaciones de todos los elementos que tienen animación configurada
 * @param store - Store de Polotno
 */
export function restartAllAnimations(store: any) {
  // Detener todas las animaciones actuales
  stopAllCanvasAnimations();
  
  // Buscar todos los elementos con animaciones
  if (!store.activePage) return;
  
  store.activePage.children.forEach((element: any) => {
    if (element.custom && element.custom.animation) {
      applyCanvasAnimation(store, element.id, element.custom.animation);
    }
  });
}
