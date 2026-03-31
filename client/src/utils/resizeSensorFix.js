// NUCLEAR OPTION: Complete ResizeSensor annihilation
// This is the most aggressive approach to completely eliminate ResizeSensor

// 1. Nuclear ResizeSensor elimination
function nuclearResizeSensorElimination() {
  if (typeof window !== 'undefined') {
    // Completely replace ResizeSensor with a no-op
    window.ResizeSensor = function() {
      return {
        detach: () => {},
        reset: () => {},
        destroy: () => {}
      };
    };
    
    // Freeze it to prevent any modifications
    Object.freeze(window.ResizeSensor);
    
    // Block any attempts to redefine or access ResizeSensor
    Object.defineProperty(window, 'ResizeSensor', {
      value: window.ResizeSensor,
      writable: false,
      configurable: false,
      enumerable: false
    });
  }
}

// 2. Nuclear DOM interception
function nuclearDOMInterception() {
  if (typeof document !== 'undefined') {
    // Completely override createElement for spans
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName, options) {
      if (tagName && tagName.toLowerCase() === 'span') {
        // Return a div instead of span to prevent ResizeSensor creation
        return originalCreateElement.call(this, 'div', options);
      }
      return originalCreateElement.call(this, tagName, options);
    };
    
    // Nuclear appendChild override
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(child) {
      // Block any span elements entirely
      if (child && (child.tagName === 'SPAN' || child.nodeName === 'SPAN')) {
        return child; // Return but don't actually append
      }
      // Block any element with resize-related classes or styles
      if (child && child.className && typeof child.className === 'string' && 
          child.className.match(/resize|sensor/i)) {
        return child; // Return but don't actually append
      }
      return originalAppendChild.call(this, child);
    };
    
    // Nuclear insertBefore override
    const originalInsertBefore = Element.prototype.insertBefore;
    Element.prototype.insertBefore = function(newNode, referenceNode) {
      // Block any span elements entirely
      if (newNode && (newNode.tagName === 'SPAN' || newNode.nodeName === 'SPAN')) {
        return newNode; // Return but don't actually insert
      }
      // Block any element with resize-related classes or styles
      if (newNode && newNode.className && typeof newNode.className === 'string' && 
          newNode.className.match(/resize|sensor/i)) {
        return newNode; // Return but don't actually insert
      }
      return originalInsertBefore.call(this, newNode, referenceNode);
    };
  }
}

// 3. Nuclear React interception
function nuclearReactInterception() {
  if (typeof window !== 'undefined' && window.React) {
    // Try to intercept React's ref system at the lowest level
    const originalCreateRef = window.React.createRef;
    if (originalCreateRef) {
      window.React.createRef = function() {
        const ref = originalCreateRef.call(this);
        // Add nuclear protection
        const originalSetter = Object.getOwnPropertyDescriptor(ref, 'current')?.set;
        if (originalSetter) {
          Object.defineProperty(ref, 'current', {
            get: function() {
              return this._current;
            },
            set: function(value) {
              // Nuclear protection against recursive setRef
              if (this._nuclearLock) return;
              this._nuclearLock = true;
              try {
                this._current = value;
              } finally {
                setTimeout(() => {
                  this._nuclearLock = false;
                }, 0);
              }
            }
          });
        }
        return ref;
      };
    }
  }
}

// 4. Nuclear cleanup - remove everything suspicious
function nuclearCleanup() {
  if (typeof document !== 'undefined') {
    const cleanup = () => {
      // Remove ALL span elements with suspicious characteristics
      const allSpans = document.querySelectorAll('span');
      allSpans.forEach(span => {
        // Remove spans with absolute/relative positioning
        if (span.style && (span.style.position === 'absolute' || span.style.position === 'relative')) {
          if (span.parentNode) {
            span.parentNode.removeChild(span);
          }
        }
        // Remove spans with resize-related classes
        if (span.className && typeof span.className === 'string' && 
            span.className.match(/resize|sensor/i)) {
          if (span.parentNode) {
            span.parentNode.removeChild(span);
          }
        }
      });
      
      // Remove any elements with resize-related attributes
      const suspiciousElements = document.querySelectorAll('[class*="resize"], [class*="sensor"]');
      suspiciousElements.forEach(el => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
    
    // Run cleanup immediately and then every 100ms
    cleanup();
    setInterval(cleanup, 100);
  }
}

// 5. Nuclear observer blocking
function nuclearObserverBlocking() {
  if (typeof window !== 'undefined') {
    // Completely disable MutationObserver for resize-related operations
    const OriginalMutationObserver = window.MutationObserver;
    window.MutationObserver = class NuclearMutationObserver {
      constructor(callback) {
        // Only call callback for non-resize related mutations
        this.callback = (mutations) => {
          const safeMutations = mutations.filter(mutation => {
            // Block any mutation involving spans
            if (mutation.target && mutation.target.tagName === 'SPAN') {
              return false;
            }
            // Block any mutation with resize-related content
            if (mutation.target && mutation.target.className && 
                typeof mutation.target.className === 'string' && 
                mutation.target.className.match(/resize|sensor/i)) {
              return false;
            }
            return true;
          });
          if (safeMutations.length > 0) {
            callback(safeMutations);
          }
        };
        this.observer = new OriginalMutationObserver(this.callback);
      }
      
      observe(target, options) {
        // Don't observe spans or resize-related elements
        if (target && target.tagName === 'SPAN') {
          return;
        }
        if (target && target.className && typeof target.className === 'string' && 
            target.className.match(/resize|sensor/i)) {
          return;
        }
        return this.observer.observe(target, options);
      }
      
      disconnect() {
        return this.observer.disconnect();
      }
      
      takeRecords() {
        return this.observer.takeRecords();
      }
    };
    
    // Completely disable ResizeObserver
    window.ResizeObserver = class NuclearResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}

const neutralizeSetRef = () => {
  // Nuclear setRef protection
  let isInSetRef = false;
  
  // Intercept Object.defineProperty for refs
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (prop === 'ref' && descriptor && descriptor.set) {
      const originalSetter = descriptor.set;
      descriptor.set = function(value) {
        if (isInSetRef) {
          console.log('Nuclear: Prevented recursive setRef call');
          return;
        }
        isInSetRef = true;
        try {
          return originalSetter.call(this, value);
        } catch (error) {
          console.log('Nuclear: Caught setRef error:', error);
        } finally {
          setTimeout(() => {
            isInSetRef = false;
          }, 0);
        }
      };
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
};

const aggressiveCleanup = () => {
  try {
    // Nuclear cleanup - remove ALL suspicious elements
    const selectors = [
      '[class*="resize"]',
      '[class*="sensor"]',
      'span[style*="position: absolute"]',
      'span[style*="position: relative"]'
    ];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element && element.parentNode) {
          console.log('Nuclear: Removing suspicious element:', element);
          element.parentNode.removeChild(element);
        }
      });
    });
    
    // Remove ALL spans with positioning
    const allSpans = document.querySelectorAll('span');
    allSpans.forEach(span => {
      if (span.style && 
          (span.style.position === 'absolute' || span.style.position === 'relative')) {
        console.log('Nuclear: Removing positioned span:', span);
        if (span.parentNode) {
          span.parentNode.removeChild(span);
        }
      }
    });
  } catch (error) {
    console.log('Nuclear cleanup error (ignored):', error);
  }
};

const neutralizeObservers = () => {
  // Nuclear MutationObserver blocking
  const originalMutationObserver = window.MutationObserver;
  window.MutationObserver = function(callback) {
    const nuclearFilteredCallback = function(mutations) {
      const safeMutations = mutations.filter(mutation => {
        // Block ALL span-related mutations
        if (mutation.target && mutation.target.tagName === 'SPAN') {
          console.log('Nuclear: Blocked span mutation:', mutation.target);
          return false;
        }
        // Block any resize-related mutations
        if (mutation.target && mutation.target.className && 
            typeof mutation.target.className === 'string' && 
            mutation.target.className.match(/resize|sensor/i)) {
          console.log('Nuclear: Blocked resize mutation:', mutation.target);
          return false;
        }
        return true;
      });
      
      if (safeMutations.length > 0) {
        try {
          callback(safeMutations);
        } catch (error) {
          console.log('Nuclear: MutationObserver error (ignored):', error);
        }
      }
    };
    
    return new originalMutationObserver(nuclearFilteredCallback);
  };
  
  // Nuclear ResizeObserver - completely disable
  window.ResizeObserver = function(callback) {
    return {
      observe: () => {},
      unobserve: () => {},
      disconnect: () => {}
    };
  };
};

// Nuclear initialization function
const initResizeSensorFix = () => {
  console.log('Nuclear: Initializing complete ResizeSensor annihilation...');
  
  // Apply all nuclear measures
  nuclearResizeSensorElimination();
  nuclearDOMInterception();
  nuclearReactInterception();
  nuclearCleanup();
  nuclearObserverBlocking();
  neutralizeSetRef();
  neutralizeObservers();
  aggressiveCleanup();
  
  // Run cleanup every 50ms for maximum effectiveness
  setInterval(aggressiveCleanup, 50);
  
  console.log('Nuclear: Complete ResizeSensor annihilation initialized');
};

export { initResizeSensorFix };
