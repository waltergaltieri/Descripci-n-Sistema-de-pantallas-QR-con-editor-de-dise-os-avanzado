// SCRIPT DE PRUEBA FINAL PARA CENTRADO RADICAL
// Ejecutar en la consola del navegador

console.log('🔥 PRUEBA FINAL DE CENTRADO RADICAL');
console.log('===================================');

function finalCenteringTest() {
  console.log('\n🔍 VERIFICANDO ESTADO ACTUAL:');
  
  // 1. Verificar elementos
  const workspace = document.querySelector('.polotno-workspace');
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  const wrapper = document.querySelector('.absolute-centering-wrapper');
  
  console.log('📋 Elementos encontrados:');
  console.log('  workspace:', workspace ? '✅' : '❌');
  console.log('  editorContainer:', editorContainer ? '✅' : '❌');
  console.log('  wrapper absoluto:', wrapper ? '✅' : '❌');
  
  if (!workspace || !editorContainer) {
    console.error('❌ Elementos críticos no encontrados');
    return false;
  }
  
  // 2. Verificar estado del panel
  const sidePanelState = editorContainer.getAttribute('data-side-panel');
  console.log('\n📋 Estado del panel lateral:', sidePanelState);
  
  // 3. Verificar funciones disponibles
  console.log('\n🔧 Funciones disponibles:');
  console.log('  window.forceAbsoluteCentering:', typeof window.forceAbsoluteCentering);
  console.log('  window.setupAbsoluteCentering:', typeof window.setupAbsoluteCentering);
  
  // 4. Verificar posición actual
  const rect = workspace.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const expectedCenterX = (viewportWidth - rect.width) / 2;
  const expectedCenterY = (viewportHeight - rect.height) / 2;
  
  console.log('\n📐 ANÁLISIS DE POSICIÓN:');
  console.log('  Viewport:', viewportWidth, 'x', viewportHeight);
  console.log('  Workspace:', rect.width, 'x', rect.height);
  console.log('  Posición actual:', Math.round(rect.left), ',', Math.round(rect.top));
  console.log('  Centro esperado:', Math.round(expectedCenterX), ',', Math.round(expectedCenterY));
  
  const diffX = Math.abs(rect.left - expectedCenterX);
  const diffY = Math.abs(rect.top - expectedCenterY);
  console.log('  Diferencia X:', Math.round(diffX), 'px');
  console.log('  Diferencia Y:', Math.round(diffY), 'px');
  
  const isCentered = diffX < 10 && diffY < 10;
  console.log('  ¿Está centrado?', isCentered ? '✅ SÍ' : '❌ NO');
  
  // 5. Verificar estilos aplicados
  console.log('\n🎨 ESTILOS APLICADOS:');
  const computedStyle = window.getComputedStyle(workspace);
  console.log('  position:', computedStyle.position);
  console.log('  top:', computedStyle.top);
  console.log('  left:', computedStyle.left);
  console.log('  transform:', computedStyle.transform);
  console.log('  z-index:', computedStyle.zIndex);
  
  // 6. Verificar clases
  console.log('\n🏷️ CLASES APLICADAS:');
  console.log('  Clases del workspace:', Array.from(workspace.classList).join(', '));
  console.log('  Tiene clase absolute-centered:', workspace.classList.contains('absolute-centered'));
  
  // 7. Prueba manual si no está centrado
  if (!isCentered && sidePanelState === 'hidden') {
    console.log('\n🔧 APLICANDO CENTRADO MANUAL...');
    if (typeof window.forceAbsoluteCentering === 'function') {
      const result = window.forceAbsoluteCentering();
      console.log('  Resultado:', result ? '✅ Aplicado' : '❌ Falló');
      
      // Verificar después de aplicar
      setTimeout(() => {
        const newRect = workspace.getBoundingClientRect();
        const newDiffX = Math.abs(newRect.left - expectedCenterX);
        const newDiffY = Math.abs(newRect.top - expectedCenterY);
        const nowCentered = newDiffX < 10 && newDiffY < 10;
        
        console.log('\n🔍 VERIFICACIÓN POST-APLICACIÓN:');
        console.log('  Nueva posición:', Math.round(newRect.left), ',', Math.round(newRect.top));
        console.log('  Nueva diferencia X:', Math.round(newDiffX), 'px');
        console.log('  Nueva diferencia Y:', Math.round(newDiffY), 'px');
        console.log('  ¿Ahora está centrado?', nowCentered ? '✅ SÍ' : '❌ NO');
        
        if (!nowCentered) {
          console.log('\n🚨 DIAGNÓSTICO DE FALLO:');
          console.log('  El centrado radical falló. Posibles causas:');
          console.log('  1. Otro CSS está sobrescribiendo los estilos');
          console.log('  2. JavaScript externo está modificando la posición');
          console.log('  3. El elemento está siendo reposicionado por Polotno');
          console.log('  4. Hay un contenedor padre que está limitando el posicionamiento');
          
          // Información adicional para debugging
          console.log('\n🔬 INFORMACIÓN ADICIONAL:');
          const parent = workspace.parentElement;
          if (parent) {
            const parentStyle = window.getComputedStyle(parent);
            console.log('  Contenedor padre:', parent.className);
            console.log('  Estilo del padre - position:', parentStyle.position);
            console.log('  Estilo del padre - overflow:', parentStyle.overflow);
            console.log('  Estilo del padre - transform:', parentStyle.transform);
          }
        }
      }, 200);
    } else {
      console.error('❌ Función forceAbsoluteCentering no disponible');
    }
  }
  
  return isCentered;
}

// Función para monitoreo continuo
function startCenteringMonitor() {
  console.log('\n👁️ Iniciando monitoreo continuo...');
  
  const monitor = setInterval(() => {
    const workspace = document.querySelector('.polotno-workspace');
    const editorContainer = document.querySelector('.polotno-editor-isolation');
    
    if (workspace && editorContainer) {
      const sidePanelState = editorContainer.getAttribute('data-side-panel');
      
      if (sidePanelState === 'hidden') {
        const rect = workspace.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const expectedCenterX = (viewportWidth - rect.width) / 2;
        const expectedCenterY = (viewportHeight - rect.height) / 2;
        
        const diffX = Math.abs(rect.left - expectedCenterX);
        const diffY = Math.abs(rect.top - expectedCenterY);
        
        if (diffX > 10 || diffY > 10) {
          console.log('⚠️ Descentrado detectado:', Math.round(diffX), 'x', Math.round(diffY));
          if (typeof window.forceAbsoluteCentering === 'function') {
            window.forceAbsoluteCentering();
          }
        }
      }
    }
  }, 2000);
  
  // Detener después de 30 segundos
  setTimeout(() => {
    clearInterval(monitor);
    console.log('🛑 Monitoreo detenido');
  }, 30000);
  
  return monitor;
}

// Hacer funciones disponibles globalmente
window.finalCenteringTest = finalCenteringTest;
window.startCenteringMonitor = startCenteringMonitor;

// Ejecutar test inicial
finalCenteringTest();

console.log('\n📝 COMANDOS DISPONIBLES:');
console.log('  finalCenteringTest() - Ejecutar diagnóstico completo');
console.log('  startCenteringMonitor() - Iniciar monitoreo continuo');
console.log('  forceAbsoluteCentering() - Forzar centrado manual');

console.log('\n🎯 INSTRUCCIONES:');
console.log('1. Oculta el panel lateral si no está oculto');
console.log('2. Ejecuta: finalCenteringTest()');
console.log('3. Si no está centrado, ejecuta: forceAbsoluteCentering()');
console.log('4. Para monitoreo continuo: startCenteringMonitor()');
console.log('5. Reporta todos los resultados');