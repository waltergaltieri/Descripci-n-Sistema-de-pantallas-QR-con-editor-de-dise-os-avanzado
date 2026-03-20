// Fix para el error de MobX 'Figure.locked' computed value
// Este script intercepta y redefine la propiedad 'locked' para evitar errores de asignación

(function() {
  'use strict';
  
  console.log('🔒 Aplicando fix para propiedad locked de Polotno...');
  
  // Función para interceptar y redefinir la propiedad locked
  function interceptLockedProperty() {
    // Interceptar a nivel de prototipo si está disponible
    if (window.polotno && window.polotno.model && window.polotno.model.Element) {
      const ElementPrototype = window.polotno.model.Element.prototype;
      
      // Redefinir la propiedad locked para que no sea computed
      if (ElementPrototype) {
        Object.defineProperty(ElementPrototype, 'locked', {
          get: function() {
            // Calcular locked basado en selectable y draggable
            return !this.selectable || !this.draggable;
          },
          set: function(value) {
            // En lugar de asignar locked, modificar selectable y draggable
            this.selectable = !value;
            this.draggable = !value;
          },
          configurable: true,
          enumerable: true
        });
        
        console.log('✅ Propiedad locked redefinida en Element prototype');
      }
    }
    
    // También interceptar en Figure si está disponible
    if (window.polotno && window.polotno.model && window.polotno.model.Figure) {
      const FigurePrototype = window.polotno.model.Figure.prototype;
      
      if (FigurePrototype) {
        Object.defineProperty(FigurePrototype, 'locked', {
          get: function() {
            return !this.selectable || !this.draggable;
          },
          set: function(value) {
            this.selectable = !value;
            this.draggable = !value;
          },
          configurable: true,
          enumerable: true
        });
        
        console.log('✅ Propiedad locked redefinida en Figure prototype');
      }
    }
  }
  
  // Función para interceptar la creación de elementos
  function interceptElementCreation() {
    // Interceptar cuando se crean nuevos elementos
    const originalDefineProperty = Object.defineProperty;
    
    Object.defineProperty = function(obj, prop, descriptor) {
      // Si se está definiendo la propiedad 'locked' como computed
      if (prop === 'locked' && descriptor && descriptor.get && !descriptor.set) {
        console.log('🚫 Interceptando definición de locked computed, reemplazando...');
        
        // Reemplazar con nuestra implementación
        descriptor = {
          get: function() {
            return !this.selectable || !this.draggable;
          },
          set: function(value) {
            this.selectable = !value;
            this.draggable = !value;
          },
          configurable: true,
          enumerable: true
        };
      }
      
      return originalDefineProperty.call(this, obj, prop, descriptor);
    };
  }
  
  // Función para interceptar MobX computed
  function interceptMobXComputed() {
    // Buscar MobX en el contexto global
    const mobx = window.mobx || window.__mobxGlobal || (window.require && window.require('mobx'));
    
    if (mobx && mobx.computed) {
      const originalComputed = mobx.computed;
      
      mobx.computed = function(target, propertyKey, descriptor) {
        // Si se está creando un computed para 'locked', interceptar
        if (propertyKey === 'locked' || (descriptor && descriptor.get && descriptor.get.toString().includes('locked'))) {
          console.log('🚫 Interceptando MobX computed para locked');
          
          // Retornar un descriptor modificado
          return {
            get: function() {
              return !this.selectable || !this.draggable;
            },
            set: function(value) {
              this.selectable = !value;
              this.draggable = !value;
            },
            configurable: true,
            enumerable: true
          };
        }
        
        return originalComputed.apply(this, arguments);
      };
    }
  }
  
  // Función principal de inicialización
  function initialize() {
    console.log('🚀 Inicializando fix para locked property...');
    
    // Aplicar interceptores
    interceptElementCreation();
    interceptMobXComputed();
    
    // Intentar interceptar inmediatamente
    interceptLockedProperty();
    
    // Reintentar cada 100ms hasta que Polotno esté disponible
    let attempts = 0;
    const maxAttempts = 100;
    
    const checkPolotno = setInterval(() => {
      attempts++;
      
      if (window.polotno) {
        interceptLockedProperty();
        
        if (window.polotno.model) {
          clearInterval(checkPolotno);
          console.log('✅ Fix para locked property aplicado exitosamente');
        }
      }
      
      if (attempts >= maxAttempts) {
        clearInterval(checkPolotno);
        console.warn('⚠️ No se pudo aplicar el fix después de múltiples intentos');
      }
    }, 100);
  }
  
  // Hacer funciones disponibles globalmente
  window.polotnoLockedFix = {
    interceptLockedProperty,
    interceptElementCreation,
    interceptMobXComputed,
    initialize
  };
  
  // Inicializar inmediatamente
  initialize();
  
  // También inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  }
  
})();

console.log('🔒 Fix para propiedad locked de Polotno cargado');