// Script de diagnóstico para verificar el estado de arrastre de elementos del canvas
// Este script se ejecuta en la consola del navegador para diagnosticar problemas de drag

// Declaraciones de tipo para window
declare global {
  interface Window {
    polotnoStore: any;
    debugCanvasDrag: () => void;
    enableDragForAllElements: () => void;
  }
}

function debugCanvasDrag() {
  console.log('🔍 Iniciando diagnóstico de funcionalidad de arrastre del canvas...');
  
  // Verificar si el store de Polotno está disponible
  if (typeof window.polotnoStore === 'undefined') {
    console.log('❌ Store de Polotno no encontrado en window.polotnoStore');
    
    // Buscar el store en otros lugares posibles
    const polotnoElements = document.querySelectorAll('[data-polotno]');
    console.log('🔍 Elementos con data-polotno encontrados:', polotnoElements.length);
    
    return;
  }
  
  const store = window.polotnoStore;
  console.log('✅ Store de Polotno encontrado:', store);
  
  // Verificar elementos en la página actual
  const currentPage = store.activePage;
  if (!currentPage) {
    console.log('❌ No hay página activa');
    return;
  }
  
  console.log('📄 Página activa:', currentPage);
  console.log('📊 Número de elementos en la página:', currentPage.children.length);
  
  // Verificar cada elemento
  currentPage.children.forEach((element: any, index: number) => {
    console.log(`\n🔸 Elemento ${index + 1}:`);
    console.log('  - ID:', element.id);
    console.log('  - Tipo:', element.type);
    console.log('  - Seleccionable:', element.selectable);
    console.log('  - Arrastrable:', element.draggable);
    console.log('  - Bloqueado:', element.locked);
    console.log('  - Visible:', element.visible);
    console.log('  - Posición:', { x: element.x, y: element.y });
    
    // Verificar si el elemento está seleccionado
    const isSelected = store.selectedElements.includes(element);
    console.log('  - Seleccionado:', isSelected);
  });
  
  // Verificar elementos seleccionados
  console.log('\n🎯 Elementos seleccionados:', store.selectedElements.length);
  store.selectedElements.forEach((element: any, index: number) => {
    console.log(`  - Elemento seleccionado ${index + 1}: ${element.type} (draggable: ${element.draggable})`);
  });
  
  // Verificar configuración del workspace
  console.log('\n🖥️ Configuración del workspace:');
  console.log('  - Modo de edición:', !store.previewMode);
  console.log('  - Modo preview:', store.previewMode);
  
  // Verificar eventos del canvas
  const canvasElements = document.querySelectorAll('canvas');
  console.log('\n🎨 Canvas encontrados:', canvasElements.length);
  
  canvasElements.forEach((canvas, index) => {
    console.log(`  - Canvas ${index + 1}:`);
    console.log('    - Pointer events:', getComputedStyle(canvas).pointerEvents);
    console.log('    - Z-index:', getComputedStyle(canvas).zIndex);
    console.log('    - Position:', getComputedStyle(canvas).position);
    console.log('    - Display:', getComputedStyle(canvas).display);
  });
  
  // Verificar overlays que puedan estar bloqueando
  const overlays = document.querySelectorAll('[class*="overlay"], [style*="z-index"]');
  console.log('\n🔒 Posibles overlays bloqueantes:', overlays.length);
  
  overlays.forEach((overlay, index) => {
    const style = getComputedStyle(overlay);
    if (parseInt(style.zIndex) > 1000 || style.position === 'fixed' || style.position === 'absolute') {
      console.log(`  - Overlay ${index + 1}:`, (overlay as HTMLElement).className);
      console.log('    - Z-index:', style.zIndex);
      console.log('    - Position:', style.position);
      console.log('    - Pointer events:', style.pointerEvents);
      console.log('    - Display:', style.display);
      console.log('    - Visibility:', style.visibility);
    }
  });
  
  console.log('\n✅ Diagnóstico completado. Revisa los resultados arriba.');
}

// Función para habilitar arrastre en todos los elementos
function enableDragForAllElements() {
  console.log('🔧 Habilitando arrastre para todos los elementos...');
  
  if (typeof window.polotnoStore === 'undefined') {
    console.log('❌ Store de Polotno no encontrado');
    return;
  }
  
  const store = window.polotnoStore;
  const currentPage = store.activePage;
  
  if (!currentPage) {
    console.log('❌ No hay página activa');
    return;
  }
  
  let fixed = 0;
  currentPage.children.forEach((element: any) => {
    if (!element.draggable || !element.selectable) {
      element.set({ 
        draggable: true, 
        selectable: true,
        locked: false
      });
      fixed++;
      console.log(`✅ Habilitado arrastre para elemento ${element.type} (${element.id})`);
    }
  });
  
  console.log(`🎉 Arrastre habilitado para ${fixed} elementos`);
}

// Exportar funciones para uso en consola
window.debugCanvasDrag = debugCanvasDrag;
window.enableDragForAllElements = enableDragForAllElements;

console.log('🚀 Script de diagnóstico de canvas cargado.');
console.log('📋 Funciones disponibles:');
console.log('  - debugCanvasDrag() - Diagnosticar estado del canvas');
console.log('  - enableDragForAllElements() - Habilitar arrastre para todos los elementos');

// Exportar para uso como módulo ES6
export { debugCanvasDrag, enableDragForAllElements };