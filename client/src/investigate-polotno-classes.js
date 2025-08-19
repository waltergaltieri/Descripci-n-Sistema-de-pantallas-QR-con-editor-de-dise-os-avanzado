// Script avanzado para investigar la relación entre elementos del canvas y clases CSS dinámicas

// Función principal exportada
export function initializePolotnoInvestigation() {
  console.log('🔍 Iniciando investigación avanzada de clases Polotno...');

// Función para monitorear cambios en el DOM
function setupAdvancedMonitoring() {
  const targetClasses = ['go806284747', 'go1222219977', 'go3977838046'];
  
  // 1. Monitorear cambios en la clase polotno-editor-has-selection
  const editorContainer = document.querySelector('.polotno-editor-isolation');
  if (editorContainer) {
    console.log('📍 Editor container encontrado:', editorContainer.className);
    
    const selectionObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const hasSelection = editorContainer.classList.contains('polotno-editor-has-selection');
          console.log('🎯 CAMBIO DE SELECCIÓN:', hasSelection ? 'SELECCIONADO' : 'DESELECCIONADO');
          
          // Inmediatamente después del cambio, revisar las clases go*
          setTimeout(() => {
            targetClasses.forEach(className => {
              const elements = document.querySelectorAll('.' + className);
              elements.forEach((el, i) => {
                console.log(`   ${className}[${i}]:`, {
                  width: window.getComputedStyle(el).width,
                  style: el.getAttribute('style'),
                  parent: el.parentElement?.className
                });
              });
            });
          }, 10);
        }
      });
    });
    
    selectionObserver.observe(editorContainer, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    console.log('✅ Observer de selección configurado');
  }
  
  // 2. Monitorear cambios en elementos del canvas
  const canvasContainer = document.querySelector('.polotno-workspace');
  if (canvasContainer) {
    console.log('📍 Canvas container encontrado');
    
    const canvasObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          console.log('🎨 CAMBIO EN CANVAS:', mutation.type);
          
          // Buscar elementos seleccionados en el canvas
          const selectedElements = canvasContainer.querySelectorAll('[data-selected="true"], .selected, .konva-selected');
          console.log('   Elementos seleccionados en canvas:', selectedElements.length);
          
          selectedElements.forEach((el, i) => {
            console.log(`   Canvas elemento[${i}]:`, {
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              dataAttributes: Array.from(el.attributes).filter(attr => attr.name.startsWith('data-'))
            });
          });
        }
      });
    });
    
    canvasObserver.observe(canvasContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-selected', 'style']
    });
    
    console.log('✅ Observer de canvas configurado');
  }
  
  // 3. Monitorear cambios específicos en las clases go*
  targetClasses.forEach(className => {
    const elements = document.querySelectorAll('.' + className);
    console.log(`📍 Encontrados ${elements.length} elementos con clase ${className}`);
    
    elements.forEach((element, index) => {
      console.log(`   ${className}[${index}] inicial:`, {
        tagName: element.tagName,
        width: window.getComputedStyle(element).width,
        style: element.getAttribute('style'),
        parent: element.parentElement?.className,
        siblings: element.parentElement?.children.length
      });
      
      const elementObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            console.log(`🚨 CAMBIO EN ${className}[${index}]:`);
            console.log('   Estilo anterior:', mutation.oldValue);
            console.log('   Estilo nuevo:', element.getAttribute('style'));
            console.log('   Width computado:', window.getComputedStyle(element).width);
            console.log('   Stack trace:', new Error().stack.split('\n').slice(1, 4));
          }
        });
      });
      
      elementObserver.observe(element, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['style', 'class']
      });
    });
  });
  
  console.log('✅ Todos los observers configurados');
}

// 4. Función para analizar la estructura del DOM
function analyzePolotnoStructure() {
  console.log('\n🏗️ ANÁLISIS DE ESTRUCTURA POLOTNO:');
  
  const sidePanel = document.querySelector('.polotno-side-panel');
  if (sidePanel) {
    console.log('📍 Side panel encontrado');
    
    // Buscar todos los elementos con clases que empiecen por 'go'
    const goElements = sidePanel.querySelectorAll('[class*="go"]');
    console.log(`   Elementos con clases 'go*': ${goElements.length}`);
    
    goElements.forEach((el, i) => {
      const goClasses = Array.from(el.classList).filter(cls => cls.startsWith('go'));
      if (goClasses.length > 0) {
        console.log(`   go-element[${i}]:`, {
          classes: goClasses,
          tagName: el.tagName,
          width: window.getComputedStyle(el).width,
          role: el.getAttribute('role'),
          'data-id': el.getAttribute('data-id')
        });
      }
    });
  }
  
  // Buscar patrones en las clases CSS
  const allElements = document.querySelectorAll('*');
  const goClassPattern = /go\d+/;
  const uniqueGoClasses = new Set();
  
  allElements.forEach(el => {
    Array.from(el.classList).forEach(cls => {
      if (goClassPattern.test(cls)) {
        uniqueGoClasses.add(cls);
      }
    });
  });
  
  console.log('🎯 Clases go* únicas encontradas:', Array.from(uniqueGoClasses));
}

  // Ejecutar análisis
  analyzePolotnoStructure();
  setupAdvancedMonitoring();
  
  console.log('\n🎯 Investigación iniciada. Ahora selecciona/deselecciona elementos en el canvas para ver los cambios...');
  console.log('💡 Tip: Abre las DevTools y observa los logs mientras interactúas con el editor.');
}

// Auto-ejecutar cuando se importa el módulo
initializePolotnoInvestigation();