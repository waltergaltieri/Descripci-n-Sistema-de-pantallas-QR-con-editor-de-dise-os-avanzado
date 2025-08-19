// SOLUCIÓN RADICAL DE CENTRADO ABSOLUTO
// Esta es la solución más agresiva posible para forzar el centrado

let absoluteInterval = null;
let absoluteObserver = null;
let isAbsoluteCenteringActive = false;

function forceAbsoluteCentering() {
  const workspace = document.querySelector('.polotno-workspace');
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  
  if (!workspace || !editorContainer) {
    console.warn('❌ Elementos no encontrados para centrado absoluto');
    return false;
  }
  
  const sidePanelState = editorContainer.getAttribute('data-side-panel');
  
  if (sidePanelState === 'hidden') {
    console.log('🔥 APLICANDO CENTRADO ABSOLUTO RADICAL');
    
    // Desactivar TODOS los estilos existentes
    workspace.style.cssText = '';
    workspace.removeAttribute('style');
    
    // Remover todas las clases que puedan interferir
    const classesToRemove = ['polotno-workspace', 'workspace-centered', 'emergency-center'];
    classesToRemove.forEach(cls => workspace.classList.remove(cls));
    
    // Aplicar clase temporal para identificación
    workspace.classList.add('absolute-centered');
    
    // Calcular dimensiones exactas
    const rect = workspace.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const centerX = Math.round((viewportWidth - rect.width) / 2);
    const centerY = Math.round((viewportHeight - rect.height) / 2);
    
    console.log('📐 Cálculos de centrado absoluto:');
    console.log('  Viewport:', viewportWidth, 'x', viewportHeight);
    console.log('  Workspace:', rect.width, 'x', rect.height);
    console.log('  Centro calculado:', centerX, ',', centerY);
    
    // MÉTODO 1: Position fixed con coordenadas exactas
    const style1 = `
      position: fixed !important;
      top: ${centerY}px !important;
      left: ${centerX}px !important;
      transform: none !important;
      margin: 0 !important;
      padding: 0 !important;
      z-index: 999999 !important;
      width: auto !important;
      height: auto !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    `;
    
    workspace.style.cssText = style1;
    
    // MÉTODO 2: Verificación y corrección después de 50ms
    setTimeout(() => {
      const newRect = workspace.getBoundingClientRect();
      const diffX = Math.abs(newRect.left - centerX);
      const diffY = Math.abs(newRect.top - centerY);
      
      if (diffX > 5 || diffY > 5) {
        console.log('🔧 Aplicando corrección de centrado absoluto');
        
        const style2 = `
          position: absolute !important;
          top: ${centerY}px !important;
          left: ${centerX}px !important;
          transform: none !important;
          margin: 0 !important;
          z-index: 999999 !important;
        `;
        
        workspace.style.cssText = style2;
        
        // Forzar el contenedor padre a no interferir
        const parent = workspace.parentElement;
        if (parent) {
          parent.style.cssText += `
            position: relative !important;
            overflow: visible !important;
            transform: none !important;
          `;
        }
      }
    }, 50);
    
    // MÉTODO 3: Verificación final después de 100ms
    setTimeout(() => {
      const finalRect = workspace.getBoundingClientRect();
      const finalDiffX = Math.abs(finalRect.left - centerX);
      const finalDiffY = Math.abs(finalRect.top - centerY);
      
      if (finalDiffX > 5 || finalDiffY > 5) {
        console.log('🚨 Aplicando método de último recurso');
        
        // Crear un contenedor wrapper completamente nuevo
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          z-index: 999999 !important;
          pointer-events: none !important;
        `;
        
        workspace.style.cssText = `
          position: relative !important;
          transform: none !important;
          margin: 0 !important;
          pointer-events: auto !important;
        `;
        
        // Solo crear wrapper si no existe
        if (!document.querySelector('.absolute-centering-wrapper')) {
          wrapper.classList.add('absolute-centering-wrapper');
          const parent = workspace.parentElement;
          parent.insertBefore(wrapper, workspace);
          wrapper.appendChild(workspace);
        }
      }
      
      console.log('✅ Centrado absoluto completado');
    }, 100);
    
    isAbsoluteCenteringActive = true;
    return true;
  } else {
    // Restaurar estado normal cuando el panel está visible
    if (isAbsoluteCenteringActive) {
      console.log('🔄 Restaurando estado normal');
      
      const wrapper = document.querySelector('.absolute-centering-wrapper');
      if (wrapper && wrapper.parentElement) {
        const parent = wrapper.parentElement;
        parent.insertBefore(workspace, wrapper);
        wrapper.remove();
      }
      
      workspace.classList.remove('absolute-centered');
      workspace.style.cssText = '';
      
      isAbsoluteCenteringActive = false;
    }
    return false;
  }
}

function setupAbsoluteCentering() {
  console.log('🔥 Inicializando sistema de centrado ABSOLUTO');
  
  // Observer para cambios en data-side-panel
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  
  if (editorContainer && !absoluteObserver) {
    absoluteObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-side-panel') {
          console.log('🔥 Cambio detectado - aplicando centrado absoluto');
          setTimeout(forceAbsoluteCentering, 10);
        }
      });
    });
    
    absoluteObserver.observe(editorContainer, { attributes: true });
  }
  
  // Intervalo de verificación cada segundo
  if (!absoluteInterval) {
    absoluteInterval = setInterval(() => {
      const editorContainer = document.querySelector('.polotno-editor-isolation');
      if (editorContainer && editorContainer.getAttribute('data-side-panel') === 'hidden') {
        forceAbsoluteCentering();
      }
    }, 1000);
  }
  
  // Handler para redimensionamiento
  const resizeHandler = () => {
    if (isAbsoluteCenteringActive) {
      setTimeout(forceAbsoluteCentering, 50);
    }
  };
  
  window.addEventListener('resize', resizeHandler);
  
  // Aplicar centrado inicial
  setTimeout(forceAbsoluteCentering, 200);
  
  // Función de limpieza
  return function cleanup() {
    if (absoluteObserver) {
      absoluteObserver.disconnect();
      absoluteObserver = null;
    }
    if (absoluteInterval) {
      clearInterval(absoluteInterval);
      absoluteInterval = null;
    }
    window.removeEventListener('resize', resizeHandler);
    
    // Limpiar wrapper si existe
    const wrapper = document.querySelector('.absolute-centering-wrapper');
    if (wrapper) {
      const workspace = wrapper.querySelector('.polotno-workspace');
      if (workspace && wrapper.parentElement) {
        wrapper.parentElement.insertBefore(workspace, wrapper);
        wrapper.remove();
      }
    }
  };
}

// Funciones globales para debugging
window.forceAbsoluteCentering = forceAbsoluteCentering;
window.setupAbsoluteCentering = setupAbsoluteCentering;

// CSS de apoyo
const absoluteCSS = `
  .absolute-centered {
    box-shadow: 0 0 20px rgba(255, 0, 0, 0.5) !important;
  }
  
  .absolute-centering-wrapper {
    background: rgba(0, 0, 0, 0.01) !important;
  }
`;

// Inyectar CSS
const styleElement = document.createElement('style');
styleElement.textContent = absoluteCSS;
document.head.appendChild(styleElement);

export { forceAbsoluteCentering, setupAbsoluteCentering };

// Auto-inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAbsoluteCentering);
} else {
  setupAbsoluteCentering();
}