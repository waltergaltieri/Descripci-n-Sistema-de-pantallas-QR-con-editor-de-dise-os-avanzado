// Sistema de centrado de emergencia
// Se ejecuta automáticamente para asegurar el centrado del canvas

let emergencyInterval = null;
let emergencyObserver = null;

function applyEmergencyCentering() {
  const workspace = document.querySelector('.polotno-workspace');
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  
  if (!workspace || !editorContainer) {
    return false;
  }
  
  const sidePanelState = editorContainer.getAttribute('data-side-panel');
  
  if (sidePanelState === 'hidden') {
    console.log('🚨 Aplicando centrado de emergencia');
    
    // Aplicar clase de emergencia
    workspace.classList.add('emergency-center');
    
    // Aplicar estilos directamente como respaldo
    const rect = workspace.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const centerX = (viewportWidth - rect.width) / 2;
    const centerY = (viewportHeight - rect.height) / 2;
    
    // Múltiples métodos de centrado para asegurar que funcione
    workspace.style.cssText += `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      margin: 0 !important;
      z-index: 1000 !important;
    `;
    
    // Método alternativo con coordenadas calculadas
    setTimeout(() => {
      workspace.style.cssText += `
        position: fixed !important;
        top: ${centerY}px !important;
        left: ${centerX}px !important;
        transform: none !important;
        margin: 0 !important;
        z-index: 1000 !important;
      `;
    }, 50);
    
    // Verificar y corregir si es necesario
    setTimeout(() => {
      const newRect = workspace.getBoundingClientRect();
      const actualCenterX = (viewportWidth - newRect.width) / 2;
      const actualCenterY = (viewportHeight - newRect.height) / 2;
      
      const diffX = Math.abs(newRect.left - actualCenterX);
      const diffY = Math.abs(newRect.top - actualCenterY);
      
      if (diffX > 10 || diffY > 10) {
        console.log('🔧 Corrigiendo centrado con método absoluto');
        workspace.style.cssText += `
          position: absolute !important;
          top: ${actualCenterY}px !important;
          left: ${actualCenterX}px !important;
          transform: none !important;
          margin: 0 !important;
          z-index: 9999 !important;
        `;
      }
    }, 100);
    
    return true;
  } else {
    // Remover clase de emergencia cuando el panel está visible
    workspace.classList.remove('emergency-center');
    return false;
  }
}

function setupEmergencyCentering() {
  // Observer para cambios en el atributo data-side-panel
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  
  if (editorContainer && !emergencyObserver) {
    emergencyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-side-panel') {
          console.log('🔄 Cambio detectado - aplicando centrado de emergencia');
          setTimeout(applyEmergencyCentering, 50);
        }
      });
    });
    
    emergencyObserver.observe(editorContainer, { attributes: true });
    console.log('👁️ Observer de emergencia activado');
  }
  
  // Intervalo de verificación cada 2 segundos
  if (!emergencyInterval) {
    emergencyInterval = setInterval(() => {
      const editorContainer = document.querySelector('.polotno-editor-isolation');
      if (editorContainer && editorContainer.getAttribute('data-side-panel') === 'hidden') {
        applyEmergencyCentering();
      }
    }, 2000);
    console.log('⏰ Intervalo de emergencia activado');
  }
  
  // Handler para redimensionamiento
  window.addEventListener('resize', () => {
    setTimeout(applyEmergencyCentering, 100);
  });
  
  // Aplicar centrado inicial
  setTimeout(applyEmergencyCentering, 500);
  
  // Función de limpieza
  return function cleanup() {
    if (emergencyObserver) {
      emergencyObserver.disconnect();
      emergencyObserver = null;
    }
    if (emergencyInterval) {
      clearInterval(emergencyInterval);
      emergencyInterval = null;
    }
  };
}

// Hacer funciones disponibles globalmente para debugging
window.applyEmergencyCentering = applyEmergencyCentering;
window.setupEmergencyCentering = setupEmergencyCentering;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupEmergencyCentering);
} else {
  setupEmergencyCentering();
}

export { applyEmergencyCentering, setupEmergencyCentering };