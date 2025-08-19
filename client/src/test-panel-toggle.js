// Script para probar el toggle del panel lateral y depurar el centrado

// Función para obtener el store de polotno
function getPolotnoStore() {
  // Intentar obtener el store desde diferentes ubicaciones
  if (window.polotnoStore) {
    return window.polotnoStore;
  }
  
  // Buscar en el DOM
  const editorElement = document.querySelector('.polotno-editor-isolation');
  if (editorElement && editorElement._reactInternalFiber) {
    // Intentar obtener desde React fiber (método más complejo)
    console.log('Intentando obtener store desde React fiber...');
  }
  
  return null;
}

// Función para simular el toggle del panel lateral
function testPanelToggle() {
  console.log('🧪 INICIANDO PRUEBA DE TOGGLE DEL PANEL LATERAL');
  
  const store = getPolotnoStore();
  if (!store) {
    console.error('❌ No se pudo obtener el store de Polotno');
    return;
  }
  
  console.log('📊 Estado actual del panel:', store.openedSidePanel);
  
  // Toggle del panel
  if (store.openedSidePanel) {
    console.log('🔄 Cerrando panel lateral...');
    store.openSidePanel('');
  } else {
    console.log('🔄 Abriendo panel lateral...');
    store.openSidePanel('photos');
  }
  
  // Verificar el cambio después de un breve delay
  setTimeout(() => {
    console.log('📊 Nuevo estado del panel:', store.openedSidePanel);
    
    // Ejecutar depuración
    if (window.debugWorkspaceCentering) {
      window.debugWorkspaceCentering();
    }
    
    // Aplicar corrección manual
    if (window.applyManualWorkspaceCentering) {
      window.applyManualWorkspaceCentering();
    }
  }, 200);
}

// Función para inspeccionar el estado actual
function inspectCurrentState() {
  console.log('🔍 INSPECCIONANDO ESTADO ACTUAL');
  
  const container = document.getElementById('polotno-container');
  const sidePanelWrap = document.querySelector('.polotno-side-panel-wrap');
  const workspaceWrap = document.querySelector('.polotno-workspace-wrap');
  
  console.log('📍 Container:', {
    found: !!container,
    className: container?.className,
    dataSidePanel: container?.getAttribute('data-side-panel')
  });
  
  console.log('📍 SidePanelWrap:', {
    found: !!sidePanelWrap,
    width: sidePanelWrap ? window.getComputedStyle(sidePanelWrap).width : 'N/A',
    display: sidePanelWrap ? window.getComputedStyle(sidePanelWrap).display : 'N/A'
  });
  
  console.log('📍 WorkspaceWrap:', {
    found: !!workspaceWrap,
    margin: workspaceWrap ? window.getComputedStyle(workspaceWrap).margin : 'N/A',
    justifyContent: workspaceWrap ? window.getComputedStyle(workspaceWrap).justifyContent : 'N/A',
    transform: workspaceWrap ? window.getComputedStyle(workspaceWrap).transform : 'N/A'
  });
  
  const store = getPolotnoStore();
  if (store) {
    console.log('📊 Store state:', {
      openedSidePanel: store.openedSidePanel,
      selectedElements: store.selectedElements?.length || 0
    });
  }
}

// Función para aplicar corrección forzada
function forceWorkspaceCentering() {
  console.log('🔧 APLICANDO CORRECCIÓN FORZADA DEL CENTRADO');
  
  const container = document.getElementById('polotno-container');
  const workspaceWrap = document.querySelector('.polotno-workspace-wrap');
  
  if (!container || !workspaceWrap) {
    console.error('❌ No se encontraron los elementos necesarios');
    return;
  }
  
  const sidePanelState = container.getAttribute('data-side-panel');
  console.log('📊 Estado del panel lateral:', sidePanelState);
  
  if (sidePanelState === 'hidden') {
    // Aplicar centrado forzado
    workspaceWrap.style.cssText = `
      margin: 0 auto !important;
      justify-content: center !important;
      align-items: center !important;
      position: relative !important;
      left: 0 !important;
      transform: none !important;
      transition: all 0.3s ease !important;
      background: rgba(255, 0, 0, 0.1) !important;
    `;
    console.log('✅ Centrado forzado aplicado (con fondo rojo temporal)');
    
    // Quitar el fondo rojo después de 2 segundos
    setTimeout(() => {
      workspaceWrap.style.background = '';
    }, 2000);
  } else {
    console.log('ℹ️ Panel lateral visible, no se aplica centrado');
  }
}

// Exportar funciones al objeto window para uso en consola
if (typeof window !== 'undefined') {
  window.testPanelToggle = testPanelToggle;
  window.inspectCurrentState = inspectCurrentState;
  window.forceWorkspaceCentering = forceWorkspaceCentering;
  window.getPolotnoStore = getPolotnoStore;
  
  console.log('🚀 Funciones de prueba disponibles:');
  console.log('   - testPanelToggle(): Alternar panel lateral');
  console.log('   - inspectCurrentState(): Inspeccionar estado actual');
  console.log('   - forceWorkspaceCentering(): Aplicar centrado forzado');
  console.log('   - getPolotnoStore(): Obtener store de Polotno');
}

// Ejecutar inspección inicial
if (typeof window !== 'undefined') {
  setTimeout(() => {
    inspectCurrentState();
  }, 1000);
}