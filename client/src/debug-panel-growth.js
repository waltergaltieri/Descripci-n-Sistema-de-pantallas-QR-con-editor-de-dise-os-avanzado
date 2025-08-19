// Script para debuggear el crecimiento del panel lateral
// Ejecutar en la consola del navegador para monitorear cambios dinámicos

console.log('🔍 Iniciando monitoreo del panel lateral...');

// Función para observar cambios en los elementos problemáticos
function monitorPanelElements() {
  const targetClasses = ['go806284747', 'go1222219977', 'go3977838046'];
  
  targetClasses.forEach(className => {
    const element = document.querySelector(`.${className}`);
    if (element) {
      console.log(`📍 Encontrado elemento: .${className}`);
      console.log(`   Estilos actuales:`, element.getAttribute('style'));
      console.log(`   Ancho computado:`, window.getComputedStyle(element).width);
      console.log(`   Min-width computado:`, window.getComputedStyle(element).minWidth);
      console.log(`   Max-width computado:`, window.getComputedStyle(element).maxWidth);
      
      // Crear un MutationObserver para monitorear cambios
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            console.log(`🚨 CAMBIO DETECTADO en .${className}:`);
            console.log(`   Estilo anterior:`, mutation.oldValue);
            console.log(`   Estilo nuevo:`, element.getAttribute('style'));
            console.log(`   Ancho computado:`, window.getComputedStyle(element).width);
            console.log(`   Stack trace:`, new Error().stack);
          }
        });
      });
      
      observer.observe(element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['style']
      });
      
      console.log(`✅ Observer configurado para .${className}`);
    } else {
      console.log(`❌ No se encontró elemento: .${className}`);
    }
  });
}

// Función para verificar el estado de selección
function checkSelectionState() {
  const hasSelection = document.querySelector('.polotno-editor-has-selection');
  console.log(`🎯 Estado de selección: ${hasSelection ? 'CON SELECCIÓN' : 'SIN SELECCIÓN'}`);
  
  if (hasSelection) {
    console.log('📊 Elementos del panel lateral con selección:');
    const go806284747 = document.querySelector('.go806284747');
    const go1222219977 = document.querySelector('.go1222219977');
    const go3977838046 = document.querySelector('.go3977838046');
    
    if (go806284747) {
      console.log('   .go806284747:', {
        style: go806284747.getAttribute('style'),
        computedWidth: window.getComputedStyle(go806284747).width,
        offsetWidth: go806284747.offsetWidth
      });
    }
    
    if (go1222219977) {
      console.log('   .go1222219977:', {
        style: go1222219977.getAttribute('style'),
        computedWidth: window.getComputedStyle(go1222219977).width,
        offsetWidth: go1222219977.offsetWidth
      });
    }
    
    if (go3977838046) {
      console.log('   .go3977838046:', {
        style: go3977838046.getAttribute('style'),
        computedWidth: window.getComputedStyle(go3977838046).width,
        offsetWidth: go3977838046.offsetWidth
      });
    }
  }
}

// Ejecutar monitoreo inicial
setTimeout(() => {
  monitorPanelElements();
  checkSelectionState();
  
  // Verificar estado cada 2 segundos
  setInterval(checkSelectionState, 2000);
}, 1000);

console.log('🎯 Script de monitoreo cargado. Selecciona un elemento en el canvas para ver los cambios.');
console.log('💡 Tip: Abre las herramientas de desarrollador y observa los logs cuando selecciones elementos.');