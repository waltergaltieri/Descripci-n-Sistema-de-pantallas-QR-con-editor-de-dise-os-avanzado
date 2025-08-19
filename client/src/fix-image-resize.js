// Script para solucionar el problema de redimensionamiento de imágenes en Polotno
// Este script intercepta la creación de elementos de imagen y asegura que sean redimensionables

(function() {
  'use strict';
  
  console.log('🔧 Iniciando corrección de redimensionamiento de imágenes...');
  
  // Función para hacer redimensionable un elemento de imagen
  function makeImageResizable(element) {
    if (element && element.type === 'image') {
      try {
        // Establecer todas las propiedades necesarias para el redimensionamiento
        element.set({
          draggable: true,
          resizable: true,
          removable: true,
          selectable: true,
          contentEditable: false, // Las imágenes no necesitan ser editables de contenido
          styleEditable: true,
          locked: false,
          // Propiedades específicas de imagen para redimensionamiento
          keepRatio: false, // Permitir cambio de proporción
          stretchEnabled: true // Habilitar estiramiento
        });
        
        console.log('✅ Elemento de imagen configurado como redimensionable:', element.id);
        return true;
      } catch (error) {
        console.error('❌ Error configurando elemento de imagen:', error);
        return false;
      }
    }
    return false;
  }
  
  // Función para interceptar la adición de elementos
  function interceptElementAddition() {
    if (!window.polotnoStore) {
      console.log('⏳ Esperando a que polotnoStore esté disponible...');
      setTimeout(interceptElementAddition, 100);
      return;
    }
    
    const store = window.polotnoStore;
    
    // Interceptar el método addElement de las páginas
    const originalAddElement = store.activePage?.addElement;
    
    if (originalAddElement) {
      // Sobrescribir el método addElement para todas las páginas
      store.pages.forEach(page => {
        if (page.addElement && !page.addElement._intercepted) {
          const originalMethod = page.addElement.bind(page);
          
          page.addElement = function(elementData) {
            console.log('🎯 Interceptando adición de elemento:', elementData.type);
            
            // Llamar al método original
            const result = originalMethod(elementData);
            
            // Si es una imagen, configurarla como redimensionable
            if (elementData.type === 'image') {
              setTimeout(() => {
                const addedElement = page.children.find(child => 
                  child.type === 'image' && 
                  (!child._resizeFixed || child.id === result?.id)
                );
                
                if (addedElement) {
                  makeImageResizable(addedElement);
                  addedElement._resizeFixed = true;
                }
              }, 50);
            }
            
            return result;
          };
          
          page.addElement._intercepted = true;
          console.log('✅ Método addElement interceptado para página:', page.id);
        }
      });
    }
    
    // También interceptar cuando se agregan nuevas páginas
    const originalAddPage = store.addPage;
    if (originalAddPage && !originalAddPage._intercepted) {
      store.addPage = function(...args) {
        const result = originalAddPage.apply(this, args);
        
        // Interceptar el addElement de la nueva página
        setTimeout(() => {
          if (result && result.addElement && !result.addElement._intercepted) {
            const originalMethod = result.addElement.bind(result);
            
            result.addElement = function(elementData) {
              const addResult = originalMethod(elementData);
              
              if (elementData.type === 'image') {
                setTimeout(() => {
                  const addedElement = result.children.find(child => 
                    child.type === 'image' && 
                    (!child._resizeFixed || child.id === addResult?.id)
                  );
                  
                  if (addedElement) {
                    makeImageResizable(addedElement);
                    addedElement._resizeFixed = true;
                  }
                }, 50);
              }
              
              return addResult;
            };
            
            result.addElement._intercepted = true;
          }
        }, 100);
        
        return result;
      };
      
      store.addPage._intercepted = true;
      console.log('✅ Método addPage interceptado');
    }
  }
  
  // Función para corregir imágenes existentes
  function fixExistingImages() {
    if (!window.polotnoStore) {
      return;
    }
    
    const store = window.polotnoStore;
    let fixedCount = 0;
    
    store.pages.forEach(page => {
      const imageElements = page.children.filter(child => child.type === 'image');
      
      imageElements.forEach(element => {
        if (makeImageResizable(element)) {
          element._resizeFixed = true;
          fixedCount++;
        }
      });
    });
    
    if (fixedCount > 0) {
      console.log(`🎉 Se corrigieron ${fixedCount} imágenes existentes`);
      
      // Forzar actualización del canvas
      try {
        store.selectElements([]);
      } catch (error) {
        console.warn('⚠️ Error actualizando canvas:', error);
      }
    }
  }
  
  // Función para monitorear cambios en el store
  function setupStoreMonitoring() {
    if (!window.polotnoStore) {
      setTimeout(setupStoreMonitoring, 100);
      return;
    }
    
    const store = window.polotnoStore;
    
    // Monitorear cambios en los elementos
    if (store.on) {
      store.on('element:add', (element) => {
        if (element.type === 'image') {
          console.log('📸 Nueva imagen detectada via evento:', element.id);
          setTimeout(() => {
            makeImageResizable(element);
            element._resizeFixed = true;
          }, 10);
        }
      });
      
      console.log('✅ Monitoreo de eventos configurado');
    }
  }
  
  // Función principal de inicialización
  function initialize() {
    console.log('🚀 Inicializando corrección de redimensionamiento de imágenes...');
    
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initialize);
      return;
    }
    
    // Configurar interceptores
    interceptElementAddition();
    
    // Configurar monitoreo
    setupStoreMonitoring();
    
    // Corregir imágenes existentes
    setTimeout(fixExistingImages, 500);
    
    // Verificación periódica para imágenes que puedan haberse agregado sin interceptar
    setInterval(() => {
      if (window.polotnoStore) {
        const store = window.polotnoStore;
        let needsUpdate = false;
        
        store.pages.forEach(page => {
          const imageElements = page.children.filter(child => 
            child.type === 'image' && !child._resizeFixed
          );
          
          imageElements.forEach(element => {
            if (makeImageResizable(element)) {
              element._resizeFixed = true;
              needsUpdate = true;
            }
          });
        });
        
        if (needsUpdate) {
          console.log('🔄 Imágenes corregidas en verificación periódica');
        }
      }
    }, 2000);
    
    console.log('✅ Corrección de redimensionamiento de imágenes inicializada');
  }
  
  // Hacer funciones disponibles globalmente para depuración
  window.fixImageResize = {
    makeImageResizable,
    fixExistingImages,
    initialize
  };
  
  // Inicializar automáticamente
  initialize();
  
})();

console.log('📦 Script de corrección de redimensionamiento de imágenes cargado');