// Solución agresiva para forzar el centrado perfecto del canvas

// Función para calcular y aplicar centrado perfecto
function forceCanvasCentering() {
  const workspace = document.querySelector('.polotno-workspace');
  const workspaceContainer = document.querySelector('.kaze-workspace-container');
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  
  if (!workspace || !workspaceContainer || !editorContainer) {
    console.warn('❌ No se encontraron elementos necesarios para centrado');
    return false;
  }

  const sidePanelState = editorContainer.getAttribute('data-side-panel');
  
  if (sidePanelState === 'hidden') {
    console.log('🎯 Aplicando centrado forzado - panel lateral oculto');
    
    // Obtener dimensiones del viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Obtener dimensiones del workspace
    const workspaceRect = workspace.getBoundingClientRect();
    
    // Calcular posición centrada perfecta
    const centerX = (viewportWidth - workspaceRect.width) / 2;
    const centerY = (viewportHeight - workspaceRect.height) / 2;
    
    // Aplicar estilos de centrado agresivo
    workspace.style.cssText = `
      position: fixed !important;
      top: ${centerY}px !important;
      left: ${centerX}px !important;
      transform: none !important;
      margin: 0 !important;
      z-index: 1000 !important;
      width: auto !important;
      height: auto !important;
    `;
    
    // También centrar el contenedor padre
    workspaceContainer.style.cssText = `
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      width: 100% !important;
      height: 100% !important;
      position: relative !important;
      left: auto !important;
      right: auto !important;
      top: auto !important;
      bottom: auto !important;
      transform: none !important;
      margin: 0 !important;
      padding: 0 !important;
    `;
    
    console.log(`✅ Centrado aplicado: X=${centerX}px, Y=${centerY}px`);
    return true;
  } else {
    // Restaurar estilos normales cuando el panel está visible
    workspace.style.cssText = '';
    workspaceContainer.style.cssText = '';
    console.log('🔄 Estilos restaurados - panel lateral visible');
    return true;
  }
}

// Función para observar cambios en el atributo data-side-panel
function setupCenteringObserver() {
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  
  if (!editorContainer) {
    console.warn('❌ No se encontró el contenedor del editor');
    return null;
  }

  // Crear observer para cambios en atributos
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-side-panel') {
        console.log('🔍 Cambio detectado en data-side-panel:', editorContainer.getAttribute('data-side-panel'));
        // Aplicar centrado después de un pequeño delay para asegurar que el DOM se actualice
        setTimeout(() => {
          forceCanvasCentering();
        }, 100);
      }
    });
  });

  // Configurar el observer
  observer.observe(editorContainer, {
    attributes: true,
    attributeFilter: ['data-side-panel']
  });

  console.log('👁️ Observer de centrado configurado');
  return observer;
}

// Función para observar cambios de tamaño de ventana
function setupResizeHandler() {
  const handleResize = () => {
    const editorContainer = document.querySelector('.polotno-editor-isolation');
    if (editorContainer && editorContainer.getAttribute('data-side-panel') === 'hidden') {
      console.log('📐 Reajustando centrado por cambio de tamaño');
      setTimeout(() => {
        forceCanvasCentering();
      }, 100);
    }
  };

  window.addEventListener('resize', handleResize);
  console.log('📐 Handler de resize configurado');
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}

// Función principal para inicializar el sistema de centrado forzado
function initializeForcedCentering() {
  console.log('🚀 Inicializando sistema de centrado forzado');
  
  // Aplicar centrado inicial
  setTimeout(() => {
    forceCanvasCentering();
  }, 500);
  
  // Configurar observers
  const mutationObserver = setupCenteringObserver();
  const resizeCleanup = setupResizeHandler();
  
  // Configurar verificación periódica como respaldo
  const intervalId = setInterval(() => {
    const editorContainer = document.querySelector('.polotno-editor-isolation');
    if (editorContainer && editorContainer.getAttribute('data-side-panel') === 'hidden') {
      forceCanvasCentering();
    }
  }, 2000);
  
  // Función de limpieza
  const cleanup = () => {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }
    if (resizeCleanup) {
      resizeCleanup();
    }
    if (intervalId) {
      clearInterval(intervalId);
    }
    console.log('🧹 Sistema de centrado forzado limpiado');
  };
  
  // Hacer disponible globalmente para debugging
  window.forceCenterCanvas = forceCanvasCentering;
  window.cleanupForcedCentering = cleanup;
  
  console.log('✅ Sistema de centrado forzado inicializado');
  console.log('💡 Usa window.forceCenterCanvas() para centrar manualmente');
  console.log('💡 Usa window.cleanupForcedCentering() para limpiar');
  
  return cleanup;
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForcedCentering);
} else {
  initializeForcedCentering();
}

export { forceCanvasCentering, setupCenteringObserver, initializeForcedCentering };