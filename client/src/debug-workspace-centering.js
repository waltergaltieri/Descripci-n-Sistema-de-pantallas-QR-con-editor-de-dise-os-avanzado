// Script para depurar el problema de centrado del workspace

export function debugWorkspaceCentering() {
  console.log('🔍 DEPURANDO PROBLEMA DE CENTRADO DEL WORKSPACE - VERSIÓN ESPECÍFICA');
  
  // 1. Verificar el estado del panel lateral
  const container = document.getElementById('polotno-container');
  if (container) {
    console.log('📍 Container encontrado:');
    console.log('   - Clase:', container.className);
    console.log('   - data-side-panel:', container.getAttribute('data-side-panel'));
  }
  
  // 2. Verificar el SidePanelWrap con clase específica
  const sidePanelWrap = document.querySelector('.kaze-side-panel-fixed');
  if (sidePanelWrap) {
    const computedStyle = window.getComputedStyle(sidePanelWrap);
    console.log('📍 SidePanelWrap (kaze-side-panel-fixed) encontrado:');
    console.log('   - Width:', computedStyle.width);
    console.log('   - Display:', computedStyle.display);
    console.log('   - Visibility:', computedStyle.visibility);
    console.log('   - Flex-shrink:', computedStyle.flexShrink);
    console.log('   - Style attribute:', sidePanelWrap.getAttribute('style'));
  }
  
  // 3. Verificar el WorkspaceWrap con clase específica
  const workspaceWrap = document.querySelector('.kaze-workspace-container');
  if (workspaceWrap) {
    const computedStyle = window.getComputedStyle(workspaceWrap);
    console.log('📍 WorkspaceWrap (kaze-workspace-container) encontrado:');
    console.log('   - Width:', computedStyle.width);
    console.log('   - Margin:', computedStyle.margin);
    console.log('   - Position:', computedStyle.position);
    console.log('   - Left:', computedStyle.left);
    console.log('   - Transform:', computedStyle.transform);
    console.log('   - Justify-content:', computedStyle.justifyContent);
    console.log('   - Align-items:', computedStyle.alignItems);
    console.log('   - Flex:', computedStyle.flex);
  }
  
  // 4. Verificar el workspace inner con clase específica
  const workspaceInner = document.querySelector('.kaze-workspace-inner');
  if (workspaceInner) {
    const computedStyle = window.getComputedStyle(workspaceInner);
    console.log('📍 WorkspaceInner (kaze-workspace-inner) encontrado:');
    console.log('   - Width:', computedStyle.width);
    console.log('   - Height:', computedStyle.height);
    console.log('   - Margin:', computedStyle.margin);
    console.log('   - Text-align:', computedStyle.textAlign);
    console.log('   - Justify-content:', computedStyle.justifyContent);
    console.log('   - Align-items:', computedStyle.alignItems);
  }
  
  // 4. Verificar el Workspace (canvas)
  const workspace = document.querySelector('.polotno-workspace');
  if (workspace) {
    const computedStyle = window.getComputedStyle(workspace);
    console.log('📍 Workspace (canvas) encontrado:');
    console.log('   - Width:', computedStyle.width);
    console.log('   - Position:', computedStyle.position);
    console.log('   - Left:', computedStyle.left);
    console.log('   - Transform:', computedStyle.transform);
    console.log('   - Margin:', computedStyle.margin);
  }
  
  // 5. Verificar reglas CSS aplicadas
  console.log('\n🎯 VERIFICANDO REGLAS CSS APLICADAS:');
  
  if (container && workspaceWrap) {
    const sidePanelState = container.getAttribute('data-side-panel');
    console.log(`   - Estado del panel lateral: ${sidePanelState}`);
    
    // Verificar si las reglas CSS específicas se están aplicando
    const expectedSelector = `.polotno-editor-isolation .polotno-container[data-side-panel="${sidePanelState}"] .polotno-workspace-wrap`;
    console.log(`   - Selector esperado: ${expectedSelector}`);
    
    // CORREGIDO: No aplicar estilos que impidan el centrado CSS
    if (sidePanelState === 'hidden') {
      console.log('   - Panel lateral oculto, permitiendo centrado CSS...');
      workspaceWrap.style.marginLeft = 'auto';
      workspaceWrap.style.marginRight = 'auto';
      workspaceWrap.style.justifyContent = 'center';
      workspaceWrap.style.alignItems = 'center';
      workspaceWrap.style.position = 'relative';
      // NO aplicar left: '0' y transform: 'none' que impiden el centrado
      console.log('   - ✅ Estilos de container aplicados (sin interferir con centrado del workspace)');
    }
  }
  
  // 6. Verificar si hay estilos inline que interfieren
  console.log('\n🔧 VERIFICANDO ESTILOS INLINE:');
  
  [sidePanelWrap, workspaceWrap, workspace].forEach((element, index) => {
    if (element) {
      const elementNames = ['SidePanelWrap', 'WorkspaceWrap', 'Workspace'];
      const inlineStyle = element.getAttribute('style');
      if (inlineStyle) {
        console.log(`   - ${elementNames[index]} tiene estilos inline:`, inlineStyle);
      } else {
        console.log(`   - ${elementNames[index]} no tiene estilos inline`);
      }
    }
  });
  
  // 7. Verificar el estado de polotnoStore
  if (window.polotnoStore) {
    console.log('\n📊 ESTADO DE POLOTNO STORE:');
    console.log('   - openedSidePanel:', window.polotnoStore.openedSidePanel);
    console.log('   - selectedElements:', window.polotnoStore.selectedElements?.length || 0);
  }
}

// Función para monitorear cambios en tiempo real
export function monitorWorkspaceChanges() {
  console.log('👀 INICIANDO MONITOREO DE CAMBIOS EN WORKSPACE...');
  
  const container = document.getElementById('polotno-container');
  if (!container) {
    console.error('❌ No se encontró el container');
    return;
  }
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-side-panel') {
        console.log('🔄 CAMBIO EN data-side-panel:', container.getAttribute('data-side-panel'));
        setTimeout(() => debugWorkspaceCentering(), 100);
      }
    });
  });
  
  observer.observe(container, {
    attributes: true,
    attributeFilter: ['data-side-panel']
  });
  
  console.log('✅ Monitoreo iniciado');
  return observer;
}

// Función para aplicar corrección manual con clases específicas
export function applyManualWorkspaceCentering() {
  console.log('🔧 APLICANDO CORRECCIÓN MANUAL DEL CENTRADO - VERSIÓN ESPECÍFICA...');
  
  const container = document.getElementById('polotno-container');
  const workspaceWrap = document.querySelector('.kaze-workspace-container');
  const workspaceInner = document.querySelector('.kaze-workspace-inner');
  
  if (!container || !workspaceWrap || !workspaceInner) {
    console.error('❌ No se encontraron los elementos necesarios');
    console.log('   - Container:', !!container);
    console.log('   - WorkspaceWrap (.kaze-workspace-container):', !!workspaceWrap);
    console.log('   - WorkspaceInner (.kaze-workspace-inner):', !!workspaceInner);
    return;
  }
  
  const sidePanelState = container.getAttribute('data-side-panel');
  console.log('📍 Estado del panel lateral:', sidePanelState);
  
  if (sidePanelState === 'hidden') {
    // CORREGIDO: Permitir que las reglas CSS de centrado funcionen
    // No forzar left: 0 y transform: none que impiden el centrado
    workspaceWrap.style.cssText = `
      justify-content: center !important;
      align-items: center !important;
      margin: 0 auto !important;
      width: 100% !important;
      position: relative !important;
      transition: all 0.3s ease !important;
    `;
    
    // Permitir que el workspace (.polotno-workspace) use sus reglas CSS de centrado
    const polotnoWorkspace = document.querySelector('.polotno-workspace');
    if (polotnoWorkspace) {
      // Remover cualquier estilo inline que impida el centrado
      polotnoWorkspace.style.left = '';
      polotnoWorkspace.style.transform = '';
      polotnoWorkspace.style.margin = '';
      console.log('🎯 Estilos inline removidos del workspace para permitir centrado CSS');
    }
    
    workspaceInner.style.cssText = `
      margin: 0 auto !important;
      text-align: center !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
      height: 100% !important;
    `;
    
    console.log('✅ Centrado corregido para panel oculto - permitiendo reglas CSS');
  } else {
    // Restaurar estado normal cuando el panel está visible
    workspaceWrap.style.cssText = `
      justify-content: flex-start !important;
      align-items: stretch !important;
      margin: 0 !important;
      position: relative !important;
      left: 0 !important;
      transform: none !important;
      transition: all 0.3s ease !important;
    `;
    
    // Limpiar estilos del workspace para estado visible
    const polotnoWorkspace = document.querySelector('.polotno-workspace');
    if (polotnoWorkspace) {
      polotnoWorkspace.style.left = '';
      polotnoWorkspace.style.transform = '';
      polotnoWorkspace.style.margin = '';
    }
    
    workspaceInner.style.cssText = `
      margin: 0 !important;
      text-align: left !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      width: 100% !important;
      height: 100% !important;
    `;
    
    console.log('✅ Estado normal restaurado para panel visible');
  }
}

// Inicializar depuración automática
if (typeof window !== 'undefined') {
  window.debugWorkspaceCentering = debugWorkspaceCentering;
  window.monitorWorkspaceChanges = monitorWorkspaceChanges;
  window.applyManualWorkspaceCentering = applyManualWorkspaceCentering;
  
  // DESHABILITADO: No ejecutar automáticamente para permitir que CSS funcione
  // setTimeout(() => {
  //   debugWorkspaceCentering();
  //   monitorWorkspaceChanges();
  // }, 1000);
}