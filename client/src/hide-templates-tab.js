// Script para ocultar la pestaña de Templates del panel lateral de Polotno

function hideTemplatesTab() {
  // Buscar todos los elementos que contengan "Templates"
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    // Verificar si el elemento contiene el texto "Templates"
    if (element.textContent && element.textContent.trim() === 'Templates') {
      // Buscar el contenedor padre que sea la pestaña
      let tabContainer = element.closest('.polotno-side-panel-tab');
      if (!tabContainer) {
        // Buscar por clase que contenga "polotno-side-panel-tab"
        tabContainer = element.closest('[class*="polotno-side-panel-tab"]');
      }
      if (!tabContainer) {
        // Buscar el div padre más cercano que tenga clases go*
        tabContainer = element.closest('[class*="go"]');
      }
      
      if (tabContainer) {
        console.log('Ocultando pestaña de Templates:', tabContainer);
        tabContainer.style.display = 'none';
        tabContainer.style.visibility = 'hidden';
        tabContainer.style.opacity = '0';
        tabContainer.style.pointerEvents = 'none';
        tabContainer.style.position = 'absolute';
        tabContainer.style.left = '-9999px';
      }
    }
  });
}

// Ejecutar inmediatamente
hideTemplatesTab();

// Ejecutar cada vez que el DOM cambie
const observer = new MutationObserver(() => {
  hideTemplatesTab();
});

// Observar cambios en todo el documento
observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['class']
});

// Ejecutar también después de un pequeño delay para asegurar que Polotno haya cargado
setTimeout(hideTemplatesTab, 1000);
setTimeout(hideTemplatesTab, 3000);
setTimeout(hideTemplatesTab, 5000);

console.log('Script para ocultar Templates cargado');