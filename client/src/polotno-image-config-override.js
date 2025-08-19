// Override de configuración de Polotno SDK para elementos de imagen
// Este script modifica la configuración por defecto a nivel del SDK

(function() {
  'use strict';
  
  console.log('🔧 Aplicando override de configuración de Polotno para imágenes...');
  
  // Función para aplicar override cuando Polotno esté disponible
  function applyPolotnoOverride() {
    // Verificar si Polotno está disponible
    if (typeof window !== 'undefined' && window.polotno) {
      console.log('📦 Polotno SDK detectado, aplicando override...');
      
      try {
        // Override de la configuración por defecto de elementos de imagen
        const originalImageDefaults = window.polotno.config?.elementDefaults?.image;
        
        if (window.polotno.config) {
          if (!window.polotno.config.elementDefaults) {
            window.polotno.config.elementDefaults = {};
          }
          
          window.polotno.config.elementDefaults.image = {
            ...originalImageDefaults,
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
          
          console.log('✅ Override de configuración de imagen aplicado');
        }
        
        // También intentar modificar prototipos si están disponibles
        if (window.polotno.Element && window.polotno.Element.Image) {
          const ImagePrototype = window.polotno.Element.Image.prototype;
          
          // Override del constructor o método de inicialización
          if (ImagePrototype.initialize) {
            const originalInitialize = ImagePrototype.initialize;
            
            ImagePrototype.initialize = function(...args) {
              const result = originalInitialize.apply(this, args);
              
              // Aplicar configuración de redimensionamiento
              this.set({
                draggable: true,
                resizable: true,
                removable: true,
                selectable: true,
                contentEditable: false,
                styleEditable: true,
                locked: false,
                keepRatio: false,
                stretchEnabled: true
              });
              
              console.log('🎯 Configuración aplicada en initialize de Image');
              return result;
            };
          }
        }
        
      } catch (error) {
        console.error('❌ Error aplicando override de Polotno:', error);
      }
      
      return true;
    }
    
    return false;
  }
  
  // Función para interceptar la creación del store
  function interceptStoreCreation() {
    // Buscar la función createStore de Polotno
    const originalCreateStore = window.createStore || window.polotnoCreateStore;
    
    if (originalCreateStore) {
      const wrappedCreateStore = function(...args) {
        console.log('🏪 Interceptando creación de store...');
        
        const store = originalCreateStore.apply(this, args);
        
        // Interceptar la adición de elementos al store
        if (store && store.addElement) {
          const originalAddElement = store.addElement;
          
          store.addElement = function(elementData, ...otherArgs) {
            if (elementData && elementData.type === 'image') {
              console.log('🖼️ Interceptando adición de imagen al store');
              
              // Asegurar propiedades de redimensionamiento
              elementData = {
                ...elementData,
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
            }
            
            return originalAddElement.call(this, elementData, ...otherArgs);
          };
        }
        
        return store;
      };
      
      // Reemplazar la función original
      if (window.createStore) {
        window.createStore = wrappedCreateStore;
      }
      if (window.polotnoCreateStore) {
        window.polotnoCreateStore = wrappedCreateStore;
      }
      
      console.log('✅ Creación de store interceptada');
    }
  }
  
  // Función para interceptar la inicialización de páginas
  function interceptPageInitialization() {
    // Buscar y interceptar métodos de página
    if (window.polotno && window.polotno.Page) {
      const PagePrototype = window.polotno.Page.prototype;
      
      if (PagePrototype.addElement) {
        const originalAddElement = PagePrototype.addElement;
        
        PagePrototype.addElement = function(elementData, ...args) {
          if (elementData && elementData.type === 'image') {
            console.log('📄 Interceptando adición de imagen a página');
            
            elementData = {
              ...elementData,
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
          }
          
          return originalAddElement.call(this, elementData, ...args);
        };
        
        console.log('✅ Método addElement de Page interceptado');
      }
    }
  }
  
  // Función principal de inicialización
  function initialize() {
    console.log('🚀 Inicializando override de configuración de Polotno...');
    
    // Intentar aplicar override inmediatamente
    if (!applyPolotnoOverride()) {
      // Si Polotno no está disponible, esperar
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkPolotno = setInterval(() => {
        attempts++;
        
        if (applyPolotnoOverride() || attempts >= maxAttempts) {
          clearInterval(checkPolotno);
          
          if (attempts >= maxAttempts) {
            console.warn('⚠️ No se pudo detectar Polotno SDK después de múltiples intentos');
          }
        }
      }, 100);
    }
    
    // Aplicar interceptores
    interceptStoreCreation();
    interceptPageInitialization();
    
    console.log('✅ Override de configuración inicializado');
  }
  
  // Hacer funciones disponibles globalmente
  window.polotnoImageOverride = {
    applyPolotnoOverride,
    interceptStoreCreation,
    interceptPageInitialization
  };
  
  // Inicializar inmediatamente
  initialize();
  
  // También inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  }
  
})();

console.log('📦 Override de configuración de Polotno para imágenes cargado');