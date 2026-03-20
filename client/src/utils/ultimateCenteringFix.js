// SOLUCIÓN DEFINITIVA JAVASCRIPT PARA EL CENTRADO DEL CANVAS
// Esta función complementa el CSS y fuerza el centrado cuando sea necesario

export function setupUltimateCenteringFix() {
  console.log('🎯 Iniciando solución definitiva de centrado...');
  
  let observer = null;
  let resizeObserver = null;
  let intervalId = null;
  
  // Función para aplicar el centrado más agresivo posible
  function forceUltimateCentering() {
    const container = document.querySelector('.polotno-editor-isolation');
    const workspace = document.querySelector('.polotno-workspace');
    const workspaceContainer = document.querySelector('.kaze-workspace-container');
    
    if (!container || !workspace || !workspaceContainer) {
      console.log('⚠️ Elementos no encontrados para centrado');
      return false;
    }
    
    const sidePanelState = container.getAttribute('data-side-panel');
    
    if (sidePanelState === 'hidden') {
      console.log('🎯 Aplicando centrado definitivo...');
      
      // 1. MÉTODO PRINCIPAL: CSS con máxima especificidad
      workspace.classList.add('debug-center');
      
      // 2. VERIFICAR SI EL CSS ESTÁ FUNCIONANDO
      setTimeout(() => {
        const rect = workspace.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const workspaceCenter = rect.left + (rect.width / 2);
        const viewportCenter = viewportWidth / 2;
        const offset = Math.abs(workspaceCenter - viewportCenter);
        
        console.log('📊 Verificación de centrado:');
        console.log('   - Centro del workspace:', workspaceCenter);
        console.log('   - Centro del viewport:', viewportCenter);
        console.log('   - Desplazamiento:', offset);
        
        // Si el CSS no está funcionando (desplazamiento > 50px), usar JavaScript
        if (offset > 50) {
          console.log('🚨 CSS no suficiente, aplicando JavaScript de emergencia...');
          applyEmergencyJavaScriptCentering(workspace, workspaceContainer);
        } else {
          console.log('✅ CSS funcionando correctamente');
        }
      }, 100);
      
    } else {
      // Limpiar clases de debugging cuando el panel está visible
      workspace.classList.remove('debug-center', 'emergency-center');
    }
    
    return true;
  }
  
  // Función de centrado JavaScript de emergencia
  function applyEmergencyJavaScriptCentering(workspace, workspaceContainer) {
    console.log('🆘 Aplicando centrado JavaScript de emergencia...');
    
    // Agregar clase de emergencia
    workspace.classList.add('emergency-center');
    
    // Método 1: Position fixed con cálculos exactos
    const rect = workspace.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calcular posición exacta
    const leftPosition = (viewportWidth - rect.width) / 2;
    const topPosition = (viewportHeight - rect.height) / 2;
    
    // Aplicar estilos con máxima prioridad
    workspace.style.setProperty('position', 'fixed', 'important');
    workspace.style.setProperty('left', `${leftPosition}px`, 'important');
    workspace.style.setProperty('top', `${topPosition}px`, 'important');
    workspace.style.setProperty('transform', 'none', 'important');
    workspace.style.setProperty('z-index', '9999', 'important');
    workspace.style.setProperty('margin', '0', 'important');
    
    console.log('🎯 Centrado JavaScript aplicado:', {
      left: leftPosition,
      top: topPosition,
      width: rect.width,
      height: rect.height
    });
  }
  
  // Función para limpiar estilos de emergencia
  function cleanupEmergencyStyles() {
    const workspace = document.querySelector('.polotno-workspace');
    if (workspace) {
      workspace.classList.remove('debug-center', 'emergency-center');
      
      // Solo limpiar estilos si están aplicados por JavaScript de emergencia
      if (workspace.style.position === 'fixed' && workspace.style.zIndex === '9999') {
        workspace.style.removeProperty('position');
        workspace.style.removeProperty('left');
        workspace.style.removeProperty('top');
        workspace.style.removeProperty('transform');
        workspace.style.removeProperty('z-index');
        workspace.style.removeProperty('margin');
        console.log('🧹 Estilos de emergencia limpiados');
      }
    }
  }
  
  // Observer para cambios en el atributo data-side-panel
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-side-panel') {
        const newValue = mutation.target.getAttribute('data-side-panel');
        console.log('🔄 Cambio de panel lateral detectado:', newValue);
        
        if (newValue === 'visible') {
          cleanupEmergencyStyles();
        }
        
        setTimeout(() => {
          forceUltimateCentering();
        }, 50);
      }
    });
  });
  
  // Observar el contenedor principal
  const container = document.querySelector('.polotno-editor-isolation');
  if (container) {
    observer.observe(container, {
      attributes: true,
      attributeFilter: ['data-side-panel']
    });
    console.log('✅ Observer de panel lateral configurado');
  }
  
  // ResizeObserver para recentrar cuando cambie el tamaño
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      const container = document.querySelector('.polotno-editor-isolation');
      if (container && container.getAttribute('data-side-panel') === 'hidden') {
        console.log('📏 Redimensionamiento detectado, recentrando...');
        setTimeout(() => {
          forceUltimateCentering();
        }, 100);
      }
    });
    
    resizeObserver.observe(document.body);
    console.log('✅ ResizeObserver configurado');
  }
  
  // Verificación periódica cada 2 segundos
  intervalId = setInterval(() => {
    const container = document.querySelector('.polotno-editor-isolation');
    if (container && container.getAttribute('data-side-panel') === 'hidden') {
      const workspace = document.querySelector('.polotno-workspace');
      if (workspace) {
        const rect = workspace.getBoundingClientRect();
        const viewportCenter = window.innerWidth / 2;
        const workspaceCenter = rect.left + (rect.width / 2);
        const offset = Math.abs(workspaceCenter - viewportCenter);
        
        // Si está descentrado más de 50px, recentrar
        if (offset > 50) {
          console.log('🔄 Verificación periódica: recentrando...', offset);
          forceUltimateCentering();
        }
      }
    }
  }, 2000);
  
  // Aplicar centrado inicial
  setTimeout(() => {
    forceUltimateCentering();
  }, 100);
  
  console.log('✅ Solución definitiva de centrado configurada');
  
  // Función de limpieza
  return function cleanup() {
    console.log('🧹 Limpiando solución definitiva de centrado...');
    
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    
    cleanupEmergencyStyles();
  };
}

// Función para testing manual
window.testUltimateCentering = function() {
  console.log('🧪 Iniciando test de centrado definitivo...');
  
  const container = document.querySelector('.polotno-editor-isolation');
  const workspace = document.querySelector('.polotno-workspace');
  
  if (!container || !workspace) {
    console.error('❌ Elementos no encontrados');
    return;
  }
  
  console.log('📊 Estado actual:');
  console.log('   - Panel lateral:', container.getAttribute('data-side-panel'));
  
  const rect = workspace.getBoundingClientRect();
  const viewportCenter = window.innerWidth / 2;
  const workspaceCenter = rect.left + (rect.width / 2);
  const offset = Math.abs(workspaceCenter - viewportCenter);
  
  console.log('   - Centro del workspace:', workspaceCenter);
  console.log('   - Centro del viewport:', viewportCenter);
  console.log('   - Desplazamiento:', offset);
  console.log('   - ¿Centrado?', offset < 50 ? '✅ SÍ' : '❌ NO');
  
  if (offset >= 50) {
    console.log('🔧 Aplicando corrección manual...');
    const setup = setupUltimateCenteringFix();
    
    // Limpiar después de 30 segundos
    setTimeout(() => {
      setup();
      console.log('🧹 Test completado y limpiado');
    }, 30000);
  }
};

console.log('🎯 Ultimate Centering Fix cargado. Usa testUltimateCentering() para probar.');