// Test simple y directo del sistema de centrado
// Ejecutar en la consola del navegador

console.log('🔧 TEST SIMPLE DE CENTRADO');
console.log('==========================');

// Función de centrado manual y agresiva
function testCentering() {
  const workspace = document.querySelector('.polotno-workspace');
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  
  if (!workspace) {
    console.error('❌ No se encontró .polotno-workspace');
    return false;
  }
  
  if (!editorContainer) {
    console.error('❌ No se encontró .polotno-editor-isolation');
    return false;
  }
  
  const sidePanelState = editorContainer.getAttribute('data-side-panel');
  console.log('📋 Estado del panel:', sidePanelState);
  
  if (sidePanelState === 'hidden') {
    console.log('🎯 Aplicando centrado de emergencia...');
    
    // Obtener dimensiones
    const rect = workspace.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calcular centro
    const centerX = (viewportWidth - rect.width) / 2;
    const centerY = (viewportHeight - rect.height) / 2;
    
    console.log('📐 Dimensiones:');
    console.log('  Viewport:', viewportWidth, 'x', viewportHeight);
    console.log('  Workspace:', rect.width, 'x', rect.height);
    console.log('  Centro calculado:', centerX, ',', centerY);
    console.log('  Posición actual:', rect.left, ',', rect.top);
    
    // Aplicar estilos de emergencia
    workspace.style.position = 'fixed';
    workspace.style.top = centerY + 'px';
    workspace.style.left = centerX + 'px';
    workspace.style.transform = 'none';
    workspace.style.margin = '0';
    workspace.style.zIndex = '1000';
    
    console.log('✅ Centrado aplicado');
    
    // Verificar resultado
    setTimeout(() => {
      const newRect = workspace.getBoundingClientRect();
      console.log('🔍 Verificación:');
      console.log('  Nueva posición:', newRect.left, ',', newRect.top);
      console.log('  Diferencia X:', Math.abs(newRect.left - centerX));
      console.log('  Diferencia Y:', Math.abs(newRect.top - centerY));
      
      const isCentered = Math.abs(newRect.left - centerX) < 5 && Math.abs(newRect.top - centerY) < 5;
      console.log('  ¿Está centrado?', isCentered ? '✅ SÍ' : '❌ NO');
    }, 100);
    
    return true;
  } else {
    console.log('ℹ️ Panel lateral visible, no se aplica centrado');
    return false;
  }
}

// Hacer la función disponible globalmente
window.testCentering = testCentering;

// Ejecutar test inicial
testCentering();

console.log('\n📝 INSTRUCCIONES:');
console.log('1. Oculta el panel lateral si no está oculto');
console.log('2. Ejecuta: testCentering()');
console.log('3. Observa si el canvas se centra visualmente');
console.log('4. Reporta los resultados');

// Auto-ejecutar cuando cambie el panel
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'data-side-panel') {
      console.log('🔄 Cambio detectado en panel lateral');
      setTimeout(testCentering, 100);
    }
  });
});

const editorContainer = document.querySelector('.polotno-editor-isolation');
if (editorContainer) {
  observer.observe(editorContainer, { attributes: true });
  console.log('👁️ Observer activado para cambios automáticos');
}