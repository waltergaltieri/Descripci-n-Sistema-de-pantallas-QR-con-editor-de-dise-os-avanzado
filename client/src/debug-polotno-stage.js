/**
 * Script de debug para verificar cómo acceder al stage de Konva en Polotno
 * Ejecutar en la consola del navegador
 */

console.log('🔍 Debugging Polotno Stage Access...');

// Verificar que el store está disponible
if (typeof window.polotnoStore === 'undefined') {
  console.error('❌ polotnoStore no está disponible en window');
} else {
  console.log('✅ polotnoStore encontrado');
  
  // Verificar propiedades del store
  console.log('📊 Propiedades del store:', Object.keys(window.polotnoStore));
  
  // Verificar si tiene stage
  if (window.polotnoStore.stage) {
    console.log('✅ store.stage existe:', window.polotnoStore.stage);
  } else {
    console.log('❌ store.stage NO existe');
  }
  
  // Buscar el canvas de Konva en el DOM
  const konvaContainer = document.querySelector('.konvajs-content');
  if (konvaContainer) {
    console.log('✅ Contenedor Konva encontrado:', konvaContainer);
    
    // Intentar obtener el stage desde el contenedor
    const canvas = konvaContainer.querySelector('canvas');
    if (canvas) {
      console.log('✅ Canvas encontrado:', canvas);
      
      // Konva guarda una referencia al stage en el canvas
      if (canvas._konva) {
        console.log('✅ Stage de Konva encontrado en canvas._konva:', canvas._konva);
      }
    }
  }
  
  // Verificar si hay elementos en la página activa
  if (window.polotnoStore.activePage) {
    console.log('✅ Página activa:', window.polotnoStore.activePage);
    console.log('📝 Elementos en la página:', window.polotnoStore.activePage.children.length);
    
    // Mostrar el primer elemento
    if (window.polotnoStore.activePage.children.length > 0) {
      const firstElement = window.polotnoStore.activePage.children[0];
      console.log('🎯 Primer elemento:', {
        id: firstElement.id,
        type: firstElement.type,
        custom: firstElement.custom
      });
    }
  }
}

// Función helper para aplicar animación de prueba
window.testAnimation = function() {
  if (!window.polotnoStore) {
    console.error('Store no disponible');
    return;
  }
  
  const selectedElements = window.polotnoStore.selectedElements;
  if (selectedElements.length === 0) {
    console.warn('No hay elementos seleccionados');
    return;
  }
  
  const element = selectedElements[0];
  console.log('🎬 Intentando animar elemento:', element.id);
  
  // Buscar el canvas
  const canvas = document.querySelector('.konvajs-content canvas');
  if (!canvas || !canvas._konva) {
    console.error('No se pudo acceder al stage de Konva');
    return;
  }
  
  const stage = canvas._konva;
  console.log('✅ Stage obtenido:', stage);
  
  // Buscar el nodo
  const allNodes = stage.find('*');
  console.log('📊 Total de nodos en el stage:', allNodes.length);
  
  // Intentar encontrar el nodo del elemento
  const node = allNodes.find(n => {
    return n.id() === element.id || n.getAttr('id') === element.id;
  });
  
  if (node) {
    console.log('✅ Nodo encontrado:', node);
    console.log('📍 Posición:', { x: node.x(), y: node.y() });
    
    // Aplicar animación de prueba
    const Konva = window.Konva;
    if (Konva) {
      const anim = new Konva.Tween({
        node: node,
        duration: 1,
        scaleX: node.scaleX() * 1.2,
        scaleY: node.scaleY() * 1.2,
        easing: Konva.Easings.EaseInOut,
        onFinish: function() {
          new Konva.Tween({
            node: node,
            duration: 1,
            scaleX: node.scaleX() / 1.2,
            scaleY: node.scaleY() / 1.2,
            easing: Konva.Easings.EaseInOut
          }).play();
        }
      });
      anim.play();
      console.log('✅ Animación de prueba aplicada');
    }
  } else {
    console.error('❌ No se pudo encontrar el nodo del elemento');
    console.log('IDs de nodos disponibles:', allNodes.map(n => n.id() || n.getAttr('id') || 'sin-id'));
  }
};

console.log('💡 Ejecuta testAnimation() para probar una animación en el elemento seleccionado');
