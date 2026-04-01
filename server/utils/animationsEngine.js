/**
 * Motor de animaciones CSS para elementos del canvas
 * Genera CSS y JavaScript para animaciones en bucle infinito
 */

/**
 * Genera las definiciones CSS de keyframes para todas las animaciones
 * @returns {string} - CSS con todos los @keyframes
 */
function generateAnimationKeyframes() {
  return `
    /* Animaciones de entrada */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideInUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideInDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { transform: scale(0); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes bounceIn {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes rotateIn {
      from { transform: rotate(-180deg); opacity: 0; }
      to { transform: rotate(0); opacity: 1; }
    }
  `;
}


/**
 * Genera las animaciones continuas (bucle)
 * @returns {string} - CSS con animaciones continuas
 */
function generateContinuousAnimations() {
  return `
    /* Animaciones continuas (bucle) */
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes swing {
      0%, 100% { transform: rotate(0deg); }
      25% { transform: rotate(15deg); }
      75% { transform: rotate(-15deg); }
    }
    
    @keyframes wobble {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      25% { transform: translateX(-10px) rotate(-5deg); }
      50% { transform: translateX(10px) rotate(5deg); }
      75% { transform: translateX(-10px) rotate(-5deg); }
    }
    
    @keyframes flash {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }
  `;
}

/**
 * Extrae las animaciones de los elementos del diseño
 * @param {Object} designData - Datos del diseño
 * @returns {Array} - Array de objetos con información de animaciones
 */
function extractAnimations(designData) {
  const animations = [];
  
  if (!designData.pages || !designData.pages[0]) {
    return animations;
  }
  
  const firstPage = designData.pages[0];

  const walkChildren = (children = []) => {
    children.forEach((child) => {
      if (child?.custom?.animation) {
        animations.push({
          elementIndex: animations.length,
          elementId: child.id,
          elementType: child.type,
          animation: child.custom.animation
        });
      }

      if (Array.isArray(child?.children) && child.children.length > 0) {
        walkChildren(child.children);
      }
    });
  };

  walkChildren(firstPage.children || []);
  
  return animations;
}

/**
 * Genera el CSS para aplicar animaciones a elementos específicos
 * @param {Array} animations - Array de animaciones extraídas
 * @returns {string} - CSS para las animaciones
 */
function generateAnimationCSS(animations) {
  if (animations.length === 0) {
    return '';
  }
  
  let css = '\n    /* Animaciones de elementos */\n';
  
  animations.forEach(({ elementId, animation }) => {
    const { type, duration, delay, loop } = animation;
    const iterationCount = loop ? 'infinite' : '1';
    
    css += `    [data-element-id="${elementId}"] {\n`;
    css += `      animation: ${type} ${duration}ms ease-in-out ${delay}ms ${iterationCount};\n`;
    css += `    }\n`;
  });
  
  return css;
}

module.exports = {
  generateAnimationKeyframes,
  generateContinuousAnimations,
  extractAnimations,
  generateAnimationCSS
};
