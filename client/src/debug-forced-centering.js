// Script de diagnóstico para el sistema de centrado forzado
// Ejecutar en la consola del navegador después de reproducir el problema

console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE CENTRADO FORZADO');
console.log('================================================');

// 1. Verificar elementos DOM
const workspace = document.querySelector('.polotno-workspace');
const workspaceContainer = document.querySelector('.kaze-workspace-container');
const editorContainer = document.querySelector('.polotno-editor-isolation');

console.log('📋 ELEMENTOS DOM:');
console.log('workspace:', workspace ? '✅ Encontrado' : '❌ No encontrado');
console.log('workspaceContainer:', workspaceContainer ? '✅ Encontrado' : '❌ No encontrado');
console.log('editorContainer:', editorContainer ? '✅ Encontrado' : '❌ No encontrado');

if (editorContainer) {
  const sidePanelState = editorContainer.getAttribute('data-side-panel');
  console.log('Estado del panel lateral:', sidePanelState);
}

// 2. Verificar funciones globales
console.log('\n🔧 FUNCIONES DISPONIBLES:');
console.log('window.forceCenterCanvas:', typeof window.forceCenterCanvas);
console.log('window.centeringObserver:', typeof window.centeringObserver);
console.log('window.centeringInterval:', typeof window.centeringInterval);

// 3. Verificar estilos aplicados
if (workspace) {
  console.log('\n🎨 ESTILOS APLICADOS AL WORKSPACE:');
  const computedStyle = window.getComputedStyle(workspace);
  console.log('position:', computedStyle.position);
  console.log('top:', computedStyle.top);
  console.log('left:', computedStyle.left);
  console.log('transform:', computedStyle.transform);
  console.log('z-index:', computedStyle.zIndex);
  
  const rect = workspace.getBoundingClientRect();
  console.log('\n📐 POSICIÓN Y DIMENSIONES:');
  console.log('Posición actual:', { x: rect.left, y: rect.top });
  console.log('Dimensiones:', { width: rect.width, height: rect.height });
  
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const expectedCenterX = (viewportWidth - rect.width) / 2;
  const expectedCenterY = (viewportHeight - rect.height) / 2;
  
  console.log('\n🎯 ANÁLISIS DE CENTRADO:');
  console.log('Viewport:', { width: viewportWidth, height: viewportHeight });
  console.log('Centro esperado:', { x: expectedCenterX, y: expectedCenterY });
  console.log('Centro actual:', { x: rect.left, y: rect.top });
  console.log('Diferencia X:', Math.abs(rect.left - expectedCenterX));
  console.log('Diferencia Y:', Math.abs(rect.top - expectedCenterY));
  
  const isCenteredX = Math.abs(rect.left - expectedCenterX) < 5;
  const isCenteredY = Math.abs(rect.top - expectedCenterY) < 5;
  
  console.log('¿Está centrado horizontalmente?', isCenteredX ? '✅ SÍ' : '❌ NO');
  console.log('¿Está centrado verticalmente?', isCenteredY ? '✅ SÍ' : '❌ NO');
}

// 4. Verificar observers activos
console.log('\n👁️ OBSERVERS ACTIVOS:');
if (window.centeringObserver) {
  console.log('MutationObserver:', window.centeringObserver);
}
if (window.centeringInterval) {
  console.log('Interval ID:', window.centeringInterval);
}

// 5. Probar centrado manual
console.log('\n🧪 PRUEBA MANUAL:');
if (typeof window.forceCenterCanvas === 'function') {
  console.log('Ejecutando centrado manual...');
  const result = window.forceCenterCanvas();
  console.log('Resultado:', result ? '✅ Éxito' : '❌ Falló');
} else {
  console.log('❌ Función forceCenterCanvas no disponible');
}

// 6. Verificar errores en consola
console.log('\n⚠️ VERIFICAR ERRORES:');
console.log('Revisa si hay errores en rojo en la consola que puedan estar interfiriendo.');

console.log('\n📝 INSTRUCCIONES:');
console.log('1. Copia y pega todo este output');
console.log('2. Indica si el canvas está centrado visualmente');
console.log('3. Prueba ocultar/mostrar el panel lateral y ejecuta este script nuevamente');

// Función para ejecutar diagnóstico continuo
window.debugCentering = function() {
  console.clear();
  // Re-ejecutar este script
  eval(document.querySelector('script[src*="debug-forced-centering"]')?.textContent || 'console.log("Script no encontrado")');
};

console.log('\n🔄 Para diagnóstico continuo, ejecuta: debugCentering()');