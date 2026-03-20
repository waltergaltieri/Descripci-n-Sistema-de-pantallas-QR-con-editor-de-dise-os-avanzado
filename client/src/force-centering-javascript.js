// FORZAR CENTRADO MEDIANTE JAVASCRIPT - SOLUCIÓN DEFINITIVA
// Este script elimina cualquier estilo inline problemático y fuerza el centrado

let centeringInterval = null;
let isForcing = false;

function forceWorkspaceCentering() {
  if (isForcing) return;
  isForcing = true;
  
  try {
    const polotnoEditor = document.querySelector('.polotno-editor-isolation');
    if (!polotnoEditor) {
      isForcing = false;
      return;
    }
    
    const sidePanelHidden = polotnoEditor.getAttribute('data-side-panel') === 'hidden';
    
    if (sidePanelHidden) {
      // Encontrar el workspace
      const workspace = polotnoEditor.querySelector('.polotno-workspace');
      const workspaceContainer = polotnoEditor.querySelector('.kaze-workspace-container');
      
      if (workspace) {
        // ELIMINAR TODOS LOS ESTILOS INLINE PROBLEMÁTICOS
        workspace.style.removeProperty('position');
        workspace.style.removeProperty('left');
        workspace.style.removeProperty('right');
        workspace.style.removeProperty('top');
        workspace.style.removeProperty('bottom');
        workspace.style.removeProperty('transform');
        workspace.style.removeProperty('translate');
        workspace.style.removeProperty('translateX');
        workspace.style.removeProperty('translateY');
        
        // FORZAR CENTRADO SIMPLE
        workspace.style.setProperty('position', 'static', 'important');
        workspace.style.setProperty('margin', '0 auto', 'important');
        workspace.style.setProperty('display', 'block', 'important');
        workspace.style.setProperty('float', 'none', 'important');
        workspace.style.setProperty('clear', 'both', 'important');
        
        console.log('✅ Workspace centrado forzadamente');
      }
      
      if (workspaceContainer) {
        // FORZAR CONTENEDOR CENTRADO
        workspaceContainer.style.removeProperty('left');
        workspaceContainer.style.removeProperty('right');
        workspaceContainer.style.removeProperty('transform');
        
        workspaceContainer.style.setProperty('display', 'flex', 'important');
        workspaceContainer.style.setProperty('justify-content', 'center', 'important');
        workspaceContainer.style.setProperty('align-items', 'flex-start', 'important');
        workspaceContainer.style.setProperty('width', '100%', 'important');
        workspaceContainer.style.setProperty('position', 'relative', 'important');
        workspaceContainer.style.setProperty('margin', '0', 'important');
        workspaceContainer.style.setProperty('padding', '20px', 'important');
        
        console.log('✅ Contenedor del workspace centrado forzadamente');
      }
      
      // ELIMINAR CUALQUIER TRANSFORM EN ELEMENTOS HIJOS
      const allElements = polotnoEditor.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.style.transform && (el.style.transform.includes('translate') || el.style.transform.includes('matrix'))) {
          const computedStyle = window.getComputedStyle(el);
          if (computedStyle.position === 'absolute' && el.closest('.polotno-workspace')) {
            console.log('🔧 Eliminando transform problemático de:', el.className);
            el.style.removeProperty('transform');
            el.style.setProperty('position', 'static', 'important');
            el.style.setProperty('margin', '0 auto', 'important');
          }
        }
      });
    }
  } catch (error) {
    console.error('❌ Error en forzado de centrado:', error);
  } finally {
    isForcing = false;
  }
}

// OBSERVAR CAMBIOS EN EL DOM
function setupCenteringObserver() {
  const observer = new MutationObserver((mutations) => {
    let shouldForce = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        if (mutation.attributeName === 'data-side-panel' || 
            mutation.attributeName === 'style') {
          shouldForce = true;
        }
      } else if (mutation.type === 'childList') {
        shouldForce = true;
      }
    });
    
    if (shouldForce) {
      setTimeout(forceWorkspaceCentering, 10);
    }
  });
  
  // Observar todo el documento
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-side-panel', 'style', 'class']
  });
  
  console.log('🔍 Observer de centrado configurado');
}

// INICIALIZAR CUANDO EL DOM ESTÉ LISTO
function initializeForceCentering() {
  console.log('🚀 Inicializando forzado de centrado JavaScript');
  
  // Forzar centrado inicial
  setTimeout(forceWorkspaceCentering, 100);
  
  // Configurar observer
  setupCenteringObserver();
  
  // Forzar centrado cada 500ms como respaldo
  if (centeringInterval) {
    clearInterval(centeringInterval);
  }
  
  centeringInterval = setInterval(() => {
    const polotnoEditor = document.querySelector('.polotno-editor-isolation');
    if (polotnoEditor && polotnoEditor.getAttribute('data-side-panel') === 'hidden') {
      forceWorkspaceCentering();
    }
  }, 500);
  
  console.log('✅ Forzado de centrado JavaScript activado');
}

// EJECUTAR CUANDO EL DOM ESTÉ LISTO
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForceCentering);
} else {
  initializeForceCentering();
}

// EXPORTAR FUNCIONES PARA USO MANUAL
window.forceWorkspaceCentering = forceWorkspaceCentering;
window.initializeForceCentering = initializeForceCentering;

console.log('📦 Script de forzado de centrado JavaScript cargado');