// SOLUCIÓN JAVASCRIPT DIRECTA PARA EL PROBLEMA DE CENTRADO
// Basada en la inspección real del elemento en el navegador

console.log('🎯 INICIANDO SOLUCIÓN DIRECTA DE CENTRADO');

// Función para aplicar centrado directo
function applyDirectCentering() {
  // Buscar el elemento problemático específico
  const workspaceInner = document.querySelector('.polotno-workspace-inner');
  
  if (workspaceInner) {
    console.log('📍 Elemento .polotno-workspace-inner encontrado');
    
    // Verificar si el panel lateral está oculto
    const container = document.querySelector('.polotno-container');
    const sidePanelState = container?.getAttribute('data-side-panel');
    
    if (sidePanelState === 'hidden') {
      console.log('🎯 Panel lateral oculto - aplicando centrado directo');
      
      // ELIMINAR LOS ESTILOS PROBLEMÁTICOS DIRECTAMENTE
      workspaceInner.style.position = 'static';
      workspaceInner.style.left = 'auto';
      workspaceInner.style.top = 'auto';
      workspaceInner.style.transform = 'none';
      
      // APLICAR CENTRADO USANDO EL CONTENEDOR PADRE
      const workspace = workspaceInner.parentElement;
      if (workspace && workspace.classList.contains('polotno-workspace')) {
        workspace.style.display = 'flex';
        workspace.style.justifyContent = 'center';
        workspace.style.alignItems = 'flex-start';
        workspace.style.width = '100%';
        workspace.style.height = '100%';
        
        console.log('✅ Estilos de centrado aplicados al workspace padre');
      }
      
      // ASEGURAR QUE EL WORKSPACE-INNER TENGA EL ANCHO CORRECTO
      workspaceInner.style.width = 'fit-content';
      workspaceInner.style.margin = '0 auto';
      workspaceInner.style.display = 'block';
      
      console.log('✅ Centrado directo aplicado exitosamente');
    } else {
      console.log('ℹ️ Panel lateral visible - no se requiere centrado');
    }
  } else {
    console.log('❌ Elemento .polotno-workspace-inner no encontrado');
  }
}

// Función para monitorear cambios en el panel lateral
function monitorPanelChanges() {
  const container = document.querySelector('.polotno-container');
  
  if (container) {
    // Crear observer para cambios en data-side-panel
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-side-panel') {
          console.log('🔄 Cambio detectado en data-side-panel');
          setTimeout(applyDirectCentering, 100); // Pequeño delay para asegurar que el DOM se actualice
        }
      });
    });
    
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['data-side-panel']
    });
    
    console.log('👁️ Monitor de cambios de panel iniciado');
  }
}

// Función para monitorear cambios en los estilos del workspace-inner
function monitorWorkspaceInnerStyles() {
  const workspaceInner = document.querySelector('.polotno-workspace-inner');
  
  if (workspaceInner) {
    // Observer para cambios en el atributo style
    const styleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const container = document.querySelector('.polotno-container');
          const sidePanelState = container?.getAttribute('data-side-panel');
          
          if (sidePanelState === 'hidden') {
            console.log('🔧 Estilos inline detectados en workspace-inner - corrigiendo...');
            setTimeout(applyDirectCentering, 50);
          }
        }
      });
    });
    
    styleObserver.observe(workspaceInner, {
      attributes: true,
      attributeFilter: ['style']
    });
    
    console.log('👁️ Monitor de estilos del workspace-inner iniciado');
  }
}

// Función de inicialización
function initializeDirectCentering() {
  console.log('🚀 Inicializando solución directa de centrado');
  
  // Aplicar centrado inicial
  applyDirectCentering();
  
  // Configurar monitores
  monitorPanelChanges();
  monitorWorkspaceInnerStyles();
  
  // Aplicar centrado periódicamente como respaldo
  setInterval(() => {
    const container = document.querySelector('.polotno-container');
    const sidePanelState = container?.getAttribute('data-side-panel');
    
    if (sidePanelState === 'hidden') {
      applyDirectCentering();
    }
  }, 1000); // Cada segundo
  
  console.log('✅ Solución directa de centrado inicializada');
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDirectCentering);
} else {
  initializeDirectCentering();
}

// También inicializar después de un pequeño delay para asegurar que Polotno esté cargado
setTimeout(initializeDirectCentering, 2000);

// Exponer funciones globalmente para depuración
window.applyDirectCentering = applyDirectCentering;
window.initializeDirectCentering = initializeDirectCentering;

console.log('📋 Funciones de centrado directo disponibles globalmente:', {
  applyDirectCentering: 'window.applyDirectCentering()',
  initializeDirectCentering: 'window.initializeDirectCentering()'
});