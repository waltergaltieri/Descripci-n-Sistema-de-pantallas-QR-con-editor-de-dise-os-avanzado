// SCRIPT DE TESTING DEFINITIVO PARA EL CENTRADO DEL CANVAS
// Este script verifica si la solución definitiva está funcionando correctamente

// Función principal de diagnóstico
function ultimateCenteringDiagnostic() {
  console.log('🎯 === DIAGNÓSTICO DEFINITIVO DE CENTRADO ===');
  
  // 1. Verificar elementos principales
  const container = document.querySelector('.polotno-editor-isolation');
  const workspace = document.querySelector('.polotno-workspace');
  const workspaceContainer = document.querySelector('.kaze-workspace-container');
  
  if (!container || !workspace || !workspaceContainer) {
    console.error('❌ ELEMENTOS FALTANTES:');
    console.error('   - Container:', !!container);
    console.error('   - Workspace:', !!workspace);
    console.error('   - WorkspaceContainer:', !!workspaceContainer);
    return false;
  }
  
  console.log('✅ Todos los elementos encontrados');
  
  // 2. Verificar estado del panel lateral
  const sidePanelState = container.getAttribute('data-side-panel');
  console.log('📊 Estado del panel lateral:', sidePanelState);
  
  if (sidePanelState !== 'hidden') {
    console.log('ℹ️ Panel lateral visible. Oculta el panel para probar el centrado.');
    console.log('💡 Usa: togglePolotnoSidePanel() para ocultarlo');
    return false;
  }
  
  // 3. Verificar CSS aplicado
  console.log('\n🎨 VERIFICANDO CSS APLICADO:');
  
  const workspaceStyles = window.getComputedStyle(workspace);
  console.log('   Workspace:');
  console.log('     - position:', workspaceStyles.position);
  console.log('     - left:', workspaceStyles.left);
  console.log('     - transform:', workspaceStyles.transform);
  console.log('     - margin:', workspaceStyles.margin);
  console.log('     - z-index:', workspaceStyles.zIndex);
  
  const containerStyles = window.getComputedStyle(workspaceContainer);
  console.log('   Container:');
  console.log('     - display:', containerStyles.display);
  console.log('     - justify-content:', containerStyles.justifyContent);
  console.log('     - align-items:', containerStyles.alignItems);
  console.log('     - text-align:', containerStyles.textAlign);
  
  // 4. Verificar clases aplicadas
  console.log('\n🏷️ CLASES APLICADAS:');
  console.log('   Workspace classes:', workspace.className);
  console.log('   - ¿Tiene debug-center?', workspace.classList.contains('debug-center'));
  console.log('   - ¿Tiene emergency-center?', workspace.classList.contains('emergency-center'));
  
  // 5. Calcular centrado actual
  console.log('\n📐 CÁLCULO DE CENTRADO:');
  
  const rect = workspace.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  const workspaceCenterX = rect.left + (rect.width / 2);
  const workspaceCenterY = rect.top + (rect.height / 2);
  const viewportCenterX = viewportWidth / 2;
  const viewportCenterY = viewportHeight / 2;
  
  const offsetX = Math.abs(workspaceCenterX - viewportCenterX);
  const offsetY = Math.abs(workspaceCenterY - viewportCenterY);
  
  console.log('   Dimensiones del workspace:', rect.width + 'x' + rect.height);
  console.log('   Posición del workspace:', rect.left + ',' + rect.top);
  console.log('   Centro del workspace:', workspaceCenterX + ',' + workspaceCenterY);
  console.log('   Centro del viewport:', viewportCenterX + ',' + viewportCenterY);
  console.log('   Desplazamiento X:', offsetX + 'px');
  console.log('   Desplazamiento Y:', offsetY + 'px');
  
  // 6. Determinar si está centrado
  const isCenteredX = offsetX < 50;
  const isCenteredY = offsetY < 100; // Más tolerancia vertical
  const isCentered = isCenteredX && isCenteredY;
  
  console.log('\n🎯 RESULTADO DEL CENTRADO:');
  console.log('   - Centrado horizontalmente:', isCenteredX ? '✅ SÍ' : '❌ NO (' + offsetX + 'px)');
  console.log('   - Centrado verticalmente:', isCenteredY ? '✅ SÍ' : '❌ NO (' + offsetY + 'px)');
  console.log('   - CENTRADO GENERAL:', isCentered ? '✅ PERFECTO' : '❌ NECESITA CORRECCIÓN');
  
  // 7. Verificar estilos inline problemáticos
  console.log('\n🔍 ESTILOS INLINE:');
  const inlineStyle = workspace.getAttribute('style');
  if (inlineStyle) {
    console.log('   - Workspace tiene estilos inline:', inlineStyle);
    
    // Buscar estilos problemáticos
    const problematicStyles = ['left: 0', 'transform: none', 'position: static'];
    const hasProblematicStyles = problematicStyles.some(style => inlineStyle.includes(style));
    
    if (hasProblematicStyles) {
      console.warn('   ⚠️ ESTILOS PROBLEMÁTICOS DETECTADOS');
      problematicStyles.forEach(style => {
        if (inlineStyle.includes(style)) {
          console.warn('     - Encontrado:', style);
        }
      });
    }
  } else {
    console.log('   - No hay estilos inline en workspace');
  }
  
  // 8. Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  
  if (!isCentered) {
    console.log('   🔧 ACCIONES SUGERIDAS:');
    console.log('   1. Ejecutar: testUltimateCentering()');
    console.log('   2. Si no funciona: forceEmergencyCentering()');
    console.log('   3. Verificar consola por errores JavaScript');
    console.log('   4. Recargar la página si es necesario');
  } else {
    console.log('   🎉 ¡El centrado está funcionando perfectamente!');
    console.log('   ✨ La solución definitiva ha sido exitosa');
  }
  
  return {
    isCentered,
    offsetX,
    offsetY,
    sidePanelState,
    hasProblematicInlineStyles: inlineStyle && ['left: 0', 'transform: none'].some(s => inlineStyle.includes(s))
  };
}

// Función para forzar centrado de emergencia manual
function forceEmergencyCentering() {
  console.log('🆘 Aplicando centrado de emergencia manual...');
  
  const workspace = document.querySelector('.polotno-workspace');
  if (!workspace) {
    console.error('❌ Workspace no encontrado');
    return false;
  }
  
  // Limpiar estilos problemáticos
  workspace.style.removeProperty('left');
  workspace.style.removeProperty('transform');
  workspace.style.removeProperty('position');
  workspace.style.removeProperty('margin');
  
  // Aplicar centrado fijo
  const rect = workspace.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  const leftPos = (viewportWidth - rect.width) / 2;
  const topPos = (viewportHeight - rect.height) / 2;
  
  workspace.style.setProperty('position', 'fixed', 'important');
  workspace.style.setProperty('left', leftPos + 'px', 'important');
  workspace.style.setProperty('top', topPos + 'px', 'important');
  workspace.style.setProperty('z-index', '9999', 'important');
  workspace.style.setProperty('transform', 'none', 'important');
  workspace.style.setProperty('margin', '0', 'important');
  
  console.log('✅ Centrado de emergencia aplicado:', {
    left: leftPos,
    top: topPos,
    width: rect.width,
    height: rect.height
  });
  
  // Verificar después de 500ms
  setTimeout(() => {
    const result = ultimateCenteringDiagnostic();
    if (result.isCentered) {
      console.log('🎉 ¡Centrado de emergencia exitoso!');
    } else {
      console.error('❌ El centrado de emergencia no funcionó');
    }
  }, 500);
  
  return true;
}

// Función para limpiar todos los estilos de centrado
function cleanAllCenteringStyles() {
  console.log('🧹 Limpiando todos los estilos de centrado...');
  
  const workspace = document.querySelector('.polotno-workspace');
  if (workspace) {
    // Remover clases
    workspace.classList.remove('debug-center', 'emergency-center');
    
    // Remover estilos inline de centrado
    const stylesToRemove = ['position', 'left', 'top', 'transform', 'z-index', 'margin'];
    stylesToRemove.forEach(prop => {
      workspace.style.removeProperty(prop);
    });
    
    console.log('✅ Estilos limpiados');
  }
}

// Función de monitoreo continuo
function startCenteringMonitor(duration = 30000) {
  console.log('👁️ Iniciando monitoreo de centrado por', duration/1000, 'segundos...');
  
  let checks = 0;
  const maxChecks = duration / 2000; // Cada 2 segundos
  
  const monitorInterval = setInterval(() => {
    checks++;
    console.log(`\n📊 VERIFICACIÓN ${checks}/${maxChecks}:`);
    
    const result = ultimateCenteringDiagnostic();
    
    if (!result.isCentered && result.sidePanelState === 'hidden') {
      console.warn('⚠️ Descentrado detectado, aplicando corrección...');
      forceEmergencyCentering();
    }
    
    if (checks >= maxChecks) {
      clearInterval(monitorInterval);
      console.log('🏁 Monitoreo completado');
    }
  }, 2000);
  
  return monitorInterval;
}

// Exportar funciones al objeto global
window.ultimateCenteringDiagnostic = ultimateCenteringDiagnostic;
window.forceEmergencyCentering = forceEmergencyCentering;
window.cleanAllCenteringStyles = cleanAllCenteringStyles;
window.startCenteringMonitor = startCenteringMonitor;

console.log('🎯 === ULTIMATE CENTERING TEST CARGADO ===');
console.log('📋 Funciones disponibles:');
console.log('   - ultimateCenteringDiagnostic() - Diagnóstico completo');
console.log('   - forceEmergencyCentering() - Centrado de emergencia');
console.log('   - cleanAllCenteringStyles() - Limpiar estilos');
console.log('   - startCenteringMonitor(30000) - Monitoreo continuo');
console.log('\n💡 Para empezar: ultimateCenteringDiagnostic()');

// Auto-ejecutar diagnóstico inicial después de 2 segundos
setTimeout(() => {
  console.log('\n🚀 DIAGNÓSTICO AUTOMÁTICO INICIAL:');
  ultimateCenteringDiagnostic();
}, 2000);