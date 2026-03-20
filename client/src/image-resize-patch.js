// Parche específico para asegurar que las imágenes sean redimensionables
// Se enfoca en interceptar las funciones de creación de imágenes

(function() {
  'use strict';
  
  console.log('🔧 Aplicando parche de redimensionamiento de imágenes...');
  
  // Configuración de propiedades para elementos de imagen
  const IMAGE_RESIZE_CONFIG = {
    draggable: true,
    resizable: true,
    removable: true,
    selectable: true,
    contentEditable: false,
    styleEditable: true,
    locked: false,
    keepRatio: false,
    stretchEnabled: true
  };
  
  // Función para aplicar configuración de redimensionamiento
  function applyResizeConfig(element) {
    if (!element || element.type !== 'image') {
      return false;
    }
    
    try {
      element.set(IMAGE_RESIZE_CONFIG);
      console.log('✅ Configuración de redimensionamiento aplicada a imagen:', element.id);
      return true;
    } catch (error) {
      console.error('❌ Error aplicando configuración:', error);
      return false;
    }
  }
  
  // Interceptar la función de creación de elementos por defecto
  function patchDefaultElementCreation() {
    // Buscar y patchear la función createDefaultElement si está disponible
    if (window.createDefaultElement) {
      const originalCreateDefaultElement = window.createDefaultElement;
      
      window.createDefaultElement = function(type, overrides = {}) {
        const element = originalCreateDefaultElement(type, overrides);
        
        if (type === 'image') {
          // Asegurar que las propiedades de redimensionamiento estén configuradas
          Object.assign(element, IMAGE_RESIZE_CONFIG);
          console.log('🎯 Elemento de imagen patcheado en createDefaultElement');
        }
        
        return element;
      };
      
      console.log('✅ createDefaultElement patcheado');
    }
  }
  
  // Interceptar eventos de drag and drop
  function patchDragAndDrop() {
    // Interceptar eventos de drop en el canvas
    document.addEventListener('drop', function(event) {
      // Verificar si se está arrastrando una imagen
      const files = event.dataTransfer?.files;
      if (files && files.length > 0) {
        const imageFiles = Array.from(files).filter(file => 
          file.type.startsWith('image/')
        );
        
        if (imageFiles.length > 0) {
          console.log('🖼️ Imagen(es) detectada(s) en drop, aplicando parche...');
          
          // Esperar a que se cree el elemento y luego aplicar configuración
          setTimeout(() => {
            if (window.polotnoStore) {
              const store = window.polotnoStore;
              const imageElements = store.activePage?.children.filter(child => 
                child.type === 'image' && !child._resizePatchApplied
              ) || [];
              
              imageElements.forEach(element => {
                if (applyResizeConfig(element)) {
                  element._resizePatchApplied = true;
                }
              });
            }
          }, 100);
        }
      }
    }, true);
    
    console.log('✅ Event listener de drag and drop configurado');
  }
  
  // Interceptar la función de upload de imágenes
  function patchImageUpload() {
    // Buscar elementos de input file para imágenes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Buscar inputs de tipo file
            const fileInputs = node.querySelectorAll ? 
              node.querySelectorAll('input[type="file"]') : [];
            
            fileInputs.forEach((input) => {
              if (input.accept && input.accept.includes('image')) {
                input.addEventListener('change', function(event) {
                  console.log('📁 Upload de imagen detectado');
                  
                  setTimeout(() => {
                    if (window.polotnoStore) {
                      const store = window.polotnoStore;
                      const imageElements = store.activePage?.children.filter(child => 
                        child.type === 'image' && !child._resizePatchApplied
                      ) || [];
                      
                      imageElements.forEach(element => {
                        if (applyResizeConfig(element)) {
                          element._resizePatchApplied = true;
                        }
                      });
                    }
                  }, 200);
                });
              }
            });
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('✅ Observer de upload de imágenes configurado');
  }
  
  // Función para aplicar parche a imágenes existentes
  function patchExistingImages() {
    if (!window.polotnoStore) {
      setTimeout(patchExistingImages, 100);
      return;
    }
    
    const store = window.polotnoStore;
    let patchedCount = 0;
    
    store.pages.forEach(page => {
      const imageElements = page.children.filter(child => 
        child.type === 'image' && !child._resizePatchApplied
      );
      
      imageElements.forEach(element => {
        if (applyResizeConfig(element)) {
          element._resizePatchApplied = true;
          patchedCount++;
        }
      });
    });
    
    if (patchedCount > 0) {
      console.log(`🎉 Se aplicó el parche a ${patchedCount} imágenes existentes`);
    }
  }
  
  // Función de inicialización
  function initializePatch() {
    console.log('🚀 Inicializando parche de redimensionamiento de imágenes...');
    
    // Aplicar todos los parches
    patchDefaultElementCreation();
    patchDragAndDrop();
    patchImageUpload();
    
    // Aplicar parche a imágenes existentes
    setTimeout(patchExistingImages, 500);
    
    // Verificación periódica
    setInterval(() => {
      if (window.polotnoStore) {
        const store = window.polotnoStore;
        let needsUpdate = false;
        
        store.pages.forEach(page => {
          const imageElements = page.children.filter(child => 
            child.type === 'image' && !child._resizePatchApplied
          );
          
          imageElements.forEach(element => {
            if (applyResizeConfig(element)) {
              element._resizePatchApplied = true;
              needsUpdate = true;
            }
          });
        });
        
        if (needsUpdate) {
          console.log('🔄 Parche aplicado en verificación periódica');
        }
      }
    }, 3000);
    
    console.log('✅ Parche de redimensionamiento inicializado');
  }
  
  // Hacer funciones disponibles globalmente
  window.imageResizePatch = {
    applyResizeConfig,
    patchExistingImages,
    IMAGE_RESIZE_CONFIG
  };
  
  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePatch);
  } else {
    initializePatch();
  }
  
})();

console.log('📦 Parche de redimensionamiento de imágenes cargado');