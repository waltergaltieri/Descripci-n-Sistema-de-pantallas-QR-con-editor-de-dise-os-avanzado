/**
 * Genera el JavaScript para animaciones Konva
 * Este código se inyecta en el HTML generado
 */

/**
 * Genera el código JavaScript para aplicar animaciones a nodos Konva
 * @param {Array} animations - Array de animaciones extraídas
 * @returns {string} - JavaScript para las animaciones
 */
function generateKonvaAnimationsJS(animations) {
  if (animations.length === 0) {
    return '';
  }
  
  const animationsJSON = JSON.stringify(animations, null, 2);
  
  // Retornar el código JavaScript como string
  // Usamos comillas simples y escapamos correctamente
  return `
    // Sistema de animaciones Konva
    console.log('🎬 Inicializando animaciones con Konva...');
    
    const animationsData = ${animationsJSON};
    
    // Función para aplicar animaciones a nodos de Konva
    function applyKonvaAnimation(node, animation) {
      const type = animation.type;
      const duration = animation.duration;
      const delay = animation.delay;
      const durationSec = duration / 1000;
      const delaySec = delay / 1000;
      
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
        let anim;
        
        switch(type) {
          case 'fadeIn':
            node.opacity(0);
            anim = new Konva.Tween({
              node: node,
              duration: durationSec,
              opacity: originalProps.opacity,
              easing: Konva.Easings.EaseInOut
            });
            break;
  `;
}

module.exports = {
  generateKonvaAnimationsJS
};
