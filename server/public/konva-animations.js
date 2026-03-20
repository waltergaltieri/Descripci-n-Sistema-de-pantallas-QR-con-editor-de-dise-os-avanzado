/**
 * Sistema de animaciones para Konva
 * Este archivo se carga en el HTML generado y aplica animaciones a los nodos
 */

// Función global para aplicar animaciones
window.applyKonvaAnimations = function(stage, animationsData) {
  console.log('🎬 Aplicando', animationsData.length, 'animación(es) con Konva...');
  
  animationsData.forEach(({ elementId, animation }) => {
    console.log('🔍 Buscando nodo con elementId:', elementId);
    
    // Obtener todos los nodos del stage (layers y sus hijos)
    let node = null;
    
    // Buscar en todas las capas
    const layers = stage.getLayers();
    console.log('📊 Capas encontradas:', layers.length);
    
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const children = layer.getChildren();
      console.log('👶 Hijos en capa', i, ':', children.length);
      
      // Buscar en los hijos de la capa
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        const childElementId = child.getAttr('elementId');
        
        console.log('  - Nodo', j, ':', {
          elementId: childElementId,
          id: child.id(),
          name: child.name(),
          type: child.getClassName()
        });
        
        if (childElementId === elementId) {
          node = child;
          console.log('✅ Nodo encontrado!');
          break;
        }
      }
      
      if (node) break;
    }
    
    if (!node) {
      console.error('❌ Nodo no encontrado:', elementId);
      return;
    }
    
    console.log('✅ Aplicando animación:', animation.type, 'a elemento', elementId);
    
    const { type, duration, delay } = animation;
    const durationSec = duration / 1000;
    
    // Guardar propiedades originales
    const originalProps = {
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
      opacity: node.opacity()
    };
    
    // Función para ejecutar la animación
    function runAnimation() {
      switch(type) {
        case 'fadeIn':
          node.opacity(0);
          new Konva.Tween({
            node: node,
            duration: durationSec,
            opacity: originalProps.opacity,
            easing: Konva.Easings.EaseInOut
          }).play();
          break;
          
        case 'slideInLeft':
          node.x(originalProps.x - 200);
          new Konva.Tween({
            node: node,
            duration: durationSec,
            x: originalProps.x,
            easing: Konva.Easings.EaseOut
          }).play();
          break;
          
        case 'slideInRight':
          node.x(originalProps.x + 200);
          new Konva.Tween({
            node: node,
            duration: durationSec,
            x: originalProps.x,
            easing: Konva.Easings.EaseOut
          }).play();
          break;
          
        case 'slideInUp':
          node.y(originalProps.y + 200);
          new Konva.Tween({
            node: node,
            duration: durationSec,
            y: originalProps.y,
            easing: Konva.Easings.EaseOut
          }).play();
          break;
          
        case 'slideInDown':
          node.y(originalProps.y - 200);
          new Konva.Tween({
            node: node,
            duration: durationSec,
            y: originalProps.y,
            easing: Konva.Easings.EaseOut
          }).play();
          break;
          
        case 'scaleIn':
          node.scaleX(0);
          node.scaleY(0);
          new Konva.Tween({
            node: node,
            duration: durationSec,
            scaleX: originalProps.scaleX,
            scaleY: originalProps.scaleY,
            easing: Konva.Easings.EaseOut
          }).play();
          break;
          
        case 'bounceIn':
          node.scaleX(0);
          node.scaleY(0);
          new Konva.Tween({
            node: node,
            duration: durationSec,
            scaleX: originalProps.scaleX,
            scaleY: originalProps.scaleY,
            easing: Konva.Easings.ElasticEaseOut
          }).play();
          break;
          
        case 'rotateIn':
          node.rotation(originalProps.rotation - 180);
          new Konva.Tween({
            node: node,
            duration: durationSec,
            rotation: originalProps.rotation,
            easing: Konva.Easings.EaseOut
          }).play();
          break;
          
        case 'pulse':
          new Konva.Tween({
            node: node,
            duration: durationSec / 2,
            scaleX: originalProps.scaleX * 1.05,
            scaleY: originalProps.scaleY * 1.05,
            easing: Konva.Easings.EaseInOut,
            onFinish: function() {
              new Konva.Tween({
                node: node,
                duration: durationSec / 2,
                scaleX: originalProps.scaleX,
                scaleY: originalProps.scaleY,
                easing: Konva.Easings.EaseInOut,
                onFinish: runAnimation // Bucle infinito
              }).play();
            }
          }).play();
          break;
          
        case 'bounce':
          new Konva.Tween({
            node: node,
            duration: durationSec / 2,
            y: originalProps.y - 20,
            easing: Konva.Easings.EaseOut,
            onFinish: function() {
              new Konva.Tween({
                node: node,
                duration: durationSec / 2,
                y: originalProps.y,
                easing: Konva.Easings.BounceEaseOut,
                onFinish: runAnimation // Bucle infinito
              }).play();
            }
          }).play();
          break;
          
        case 'rotate':
          new Konva.Tween({
            node: node,
            duration: durationSec,
            rotation: originalProps.rotation + 360,
            easing: Konva.Easings.Linear,
            onFinish: function() {
              node.rotation(originalProps.rotation);
              runAnimation(); // Bucle infinito
            }
          }).play();
          break;
          
        case 'swing':
          new Konva.Tween({
            node: node,
            duration: durationSec / 2,
            rotation: originalProps.rotation + 15,
            easing: Konva.Easings.EaseInOut,
            onFinish: function() {
              new Konva.Tween({
                node: node,
                duration: durationSec / 2,
                rotation: originalProps.rotation - 15,
                easing: Konva.Easings.EaseInOut,
                onFinish: function() {
                  new Konva.Tween({
                    node: node,
                    duration: durationSec / 4,
                    rotation: originalProps.rotation,
                    easing: Konva.Easings.EaseInOut,
                    onFinish: runAnimation // Bucle infinito
                  }).play();
                }
              }).play();
            }
          }).play();
          break;
          
        case 'wobble':
          let wobbleStep = 0;
          function wobbleAnimation() {
            const steps = [
              { x: originalProps.x - 10, rotation: originalProps.rotation - 5 },
              { x: originalProps.x + 10, rotation: originalProps.rotation + 5 },
              { x: originalProps.x - 10, rotation: originalProps.rotation - 5 },
              { x: originalProps.x, rotation: originalProps.rotation }
            ];
            
            if (wobbleStep < steps.length) {
              new Konva.Tween({
                node: node,
                duration: durationSec / 4,
                x: steps[wobbleStep].x,
                rotation: steps[wobbleStep].rotation,
                easing: Konva.Easings.EaseInOut,
                onFinish: function() {
                  wobbleStep++;
                  if (wobbleStep >= steps.length) {
                    wobbleStep = 0;
                  }
                  wobbleAnimation();
                }
              }).play();
            }
          }
          wobbleAnimation();
          break;
          
        case 'flash':
          new Konva.Tween({
            node: node,
            duration: durationSec / 2,
            opacity: 0.3,
            easing: Konva.Easings.EaseInOut,
            onFinish: function() {
              new Konva.Tween({
                node: node,
                duration: durationSec / 2,
                opacity: originalProps.opacity,
                easing: Konva.Easings.EaseInOut,
                onFinish: runAnimation // Bucle infinito
              }).play();
            }
          }).play();
          break;
          
        case 'shake':
          let shakeStep = 0;
          function shakeAnimation() {
            const steps = [
              originalProps.x + 10,
              originalProps.x - 10,
              originalProps.x + 10,
              originalProps.x
            ];
            
            if (shakeStep < steps.length) {
              new Konva.Tween({
                node: node,
                duration: durationSec / 4,
                x: steps[shakeStep],
                easing: Konva.Easings.EaseInOut,
                onFinish: function() {
                  shakeStep++;
                  if (shakeStep >= steps.length) {
                    shakeStep = 0;
                  }
                  shakeAnimation();
                }
              }).play();
            }
          }
          shakeAnimation();
          break;
      }
    }
    
    // Iniciar la animación con delay
    if (delay > 0) {
      setTimeout(runAnimation, delay);
    } else {
      runAnimation();
    }
  });
};
