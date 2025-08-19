// Utilidad para diagnosticar y corregir problemas de arrastre en el canvas
// Esta función se ejecuta automáticamente para asegurar que los elementos sean arrastrables

export interface CanvasElement {
  id: string;
  type: string;
  draggable?: boolean;
  selectable?: boolean;
  locked?: boolean;
  visible?: boolean;
  set?: (props: any) => void;
}

export interface PolotnoStore {
  activePage?: {
    children: CanvasElement[];
  };
  selectedElements: CanvasElement[];
  previewMode?: boolean;
  history?: {
    transaction: (fn: () => void) => void;
  };
}

// Función para diagnosticar problemas de arrastre
export function diagnoseCanvasDragIssues(store: PolotnoStore): {
  totalElements: number;
  draggableElements: number;
  lockedElements: number;
  invisibleElements: number;
  problematicElements: CanvasElement[];
} {
  if (!store.activePage) {
    return {
      totalElements: 0,
      draggableElements: 0,
      lockedElements: 0,
      invisibleElements: 0,
      problematicElements: []
    };
  }

  const elements = store.activePage.children;
  const problematicElements: CanvasElement[] = [];
  let draggableCount = 0;
  let lockedCount = 0;
  let invisibleCount = 0;

  elements.forEach(element => {
    // Contar elementos con problemas
    if (element.locked) {
      lockedCount++;
      problematicElements.push(element);
    }
    if (!element.visible) {
      invisibleCount++;
      problematicElements.push(element);
    }
    if (element.draggable === false) {
      problematicElements.push(element);
    }
    if (element.draggable !== false && !element.locked && element.visible) {
      draggableCount++;
    }
  });

  return {
    totalElements: elements.length,
    draggableElements: draggableCount,
    lockedElements: lockedCount,
    invisibleElements: invisibleCount,
    problematicElements
  };
}

// Función para corregir automáticamente problemas de arrastre
export function fixCanvasDragIssues(store: PolotnoStore): {
  fixed: number;
  errors: string[];
} {
  if (!store.activePage) {
    return { fixed: 0, errors: ['No hay página activa'] };
  }

  const elements = store.activePage.children;
  let fixedCount = 0;
  const errors: string[] = [];

  elements.forEach(element => {
    try {
      let needsUpdate = false;
      const updates: any = {};

      // Asegurar que el elemento sea arrastrable
      if (element.draggable === false) {
        updates.draggable = true;
        needsUpdate = true;
      }

      // Asegurar que el elemento sea seleccionable
      if (element.selectable === false) {
        updates.selectable = true;
        needsUpdate = true;
      }

      // Desbloquear elementos bloqueados
      if (element.locked === true) {
        updates.locked = false;
        needsUpdate = true;
      }

      // Hacer visible elementos invisibles
      if (element.visible === false) {
        updates.visible = true;
        needsUpdate = true;
      }

      // Aplicar actualizaciones si es necesario
      if (needsUpdate && element.set) {
        if (store.history?.transaction) {
          store.history.transaction(() => {
            element.set!(updates);
          });
        } else {
          element.set(updates);
        }
        fixedCount++;
      }
    } catch (error) {
      errors.push(`Error corrigiendo elemento ${element.id}: ${error}`);
    }
  });

  return { fixed: fixedCount, errors };
}

// Función para verificar si el modo preview está activo
export function isPreviewModeActive(store: PolotnoStore): boolean {
  return store.previewMode === true;
}

// Función para verificar elementos del DOM que puedan estar bloqueando
export function checkDOMBlockingElements(): {
  blockingOverlays: Element[];
  canvasElements: Element[];
  pointerEventsIssues: Element[];
} {
  const blockingOverlays: Element[] = [];
  const canvasElements = Array.from(document.querySelectorAll('canvas'));
  const pointerEventsIssues: Element[] = [];

  // Buscar overlays que puedan estar bloqueando
  const overlays = document.querySelectorAll('[style*="z-index"], [class*="overlay"], [class*="modal"]');
  overlays.forEach(overlay => {
    const style = getComputedStyle(overlay);
    const zIndex = parseInt(style.zIndex) || 0;
    
    if (zIndex > 1000 && 
        (style.position === 'fixed' || style.position === 'absolute') &&
        style.pointerEvents !== 'none' &&
        style.display !== 'none' &&
        style.visibility !== 'hidden') {
      blockingOverlays.push(overlay);
    }
  });

  // Verificar canvas elements
  canvasElements.forEach(canvas => {
    const style = getComputedStyle(canvas);
    if (style.pointerEvents === 'none') {
      pointerEventsIssues.push(canvas);
    }
  });

  return {
    blockingOverlays,
    canvasElements,
    pointerEventsIssues
  };
}

// Función principal para diagnosticar y corregir todos los problemas
export function fixAllCanvasDragIssues(store: PolotnoStore): {
  diagnosis: ReturnType<typeof diagnoseCanvasDragIssues>;
  fixes: ReturnType<typeof fixCanvasDragIssues>;
  domIssues: ReturnType<typeof checkDOMBlockingElements>;
  previewMode: boolean;
} {
  const diagnosis = diagnoseCanvasDragIssues(store);
  const fixes = fixCanvasDragIssues(store);
  const domIssues = checkDOMBlockingElements();
  const previewMode = isPreviewModeActive(store);

  // Log de resultados
  console.log('🔍 Diagnóstico de arrastre del canvas:');
  console.log(`📊 Total de elementos: ${diagnosis.totalElements}`);
  console.log(`✅ Elementos arrastrables: ${diagnosis.draggableElements}`);
  console.log(`🔒 Elementos bloqueados: ${diagnosis.lockedElements}`);
  console.log(`👻 Elementos invisibles: ${diagnosis.invisibleElements}`);
  console.log(`🔧 Elementos corregidos: ${fixes.fixed}`);
  console.log(`🎭 Modo preview activo: ${previewMode}`);
  
  if (fixes.errors.length > 0) {
    console.log('❌ Errores durante la corrección:', fixes.errors);
  }
  
  if (domIssues.blockingOverlays.length > 0) {
    console.log('🚫 Overlays bloqueantes encontrados:', domIssues.blockingOverlays);
  }
  
  if (domIssues.pointerEventsIssues.length > 0) {
    console.log('👆 Problemas de pointer-events:', domIssues.pointerEventsIssues);
  }

  return {
    diagnosis,
    fixes,
    domIssues,
    previewMode
  };
}