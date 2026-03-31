// Fix para el error de MobX "Figure.locked" computed value.
// Este script intercepta y redefine la propiedad "locked" sin ensuciar la consola.

(function () {
  'use strict';

  function redefineLockedProperty(targetPrototype) {
    if (!targetPrototype) {
      return;
    }

    Object.defineProperty(targetPrototype, 'locked', {
      get: function () {
        return !this.selectable || !this.draggable;
      },
      set: function (value) {
        this.selectable = !value;
        this.draggable = !value;
      },
      configurable: true,
      enumerable: true
    });
  }

  function interceptLockedProperty() {
    if (window.polotno?.model?.Element?.prototype) {
      redefineLockedProperty(window.polotno.model.Element.prototype);
    }

    if (window.polotno?.model?.Figure?.prototype) {
      redefineLockedProperty(window.polotno.model.Figure.prototype);
    }
  }

  function interceptElementCreation() {
    const originalDefineProperty = Object.defineProperty;

    Object.defineProperty = function (obj, prop, descriptor) {
      if (prop === 'locked' && descriptor && descriptor.get && !descriptor.set) {
        descriptor = {
          get: function () {
            return !this.selectable || !this.draggable;
          },
          set: function (value) {
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

  function interceptMobXComputed() {
    const mobx =
      window.mobx ||
      window.__mobxGlobal ||
      (window.require && typeof window.require === 'function' ? window.require('mobx') : null);

    if (!mobx || !mobx.computed) {
      return;
    }

    const originalComputed = mobx.computed;

    mobx.computed = function (target, propertyKey, descriptor) {
      if (
        propertyKey === 'locked' ||
        (descriptor && descriptor.get && descriptor.get.toString().includes('locked'))
      ) {
        return {
          get: function () {
            return !this.selectable || !this.draggable;
          },
          set: function (value) {
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

  function initialize() {
    interceptElementCreation();
    interceptMobXComputed();
    interceptLockedProperty();

    let attempts = 0;
    const maxAttempts = 100;

    const checkPolotno = setInterval(() => {
      attempts += 1;

      if (window.polotno) {
        interceptLockedProperty();

        if (window.polotno.model) {
          clearInterval(checkPolotno);
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkPolotno);
      }
    }, 100);
  }

  window.polotnoLockedFix = {
    interceptLockedProperty,
    interceptElementCreation,
    interceptMobXComputed,
    initialize
  };

  initialize();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  }
})();
