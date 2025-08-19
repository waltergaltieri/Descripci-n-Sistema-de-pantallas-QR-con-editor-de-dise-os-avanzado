import { createStore } from 'polotno/model/store';
import { unstable_registerNextDomDrop } from 'polotno/config';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { subscribeWithSelector } from 'zustand/middleware';

// Configurar Polotno para Next.js
// unstable_registerNextDomDrop();

// Crear el store principal de Polotno
export const polotnoStore = createStore({
  key: process.env.REACT_APP_POLOTNO_KEY || 'nFA5H9elEytDyPyvDF7T',
  showCredit: false,
});

// NO crear página inicial automáticamente
// Las páginas se crearán cuando sea necesario con las dimensiones correctas

// Tipos para el estado adicional
interface EditorUIState {
  // Paneles
  showLeftPanel: boolean;
  showRightPanel: boolean;
  leftPanelTab: 'palette' | 'layers';
  rightPanelTab: 'general' | 'background' | 'animations';
  
  // Viewport
  showGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;
  snapToGrid: boolean;
  gridSize: number;
  
  // Modo preview
  previewMode: boolean;
  
  // Multi-pantalla
  screens: Array<{
    id: string;
    name: string;
    width: number;
    height: number;
    orientation: 'landscape' | 'portrait';
    offsetX: number;
    offsetY: number;
  }>;
  activeScreenId: string;
  
  // Composición extendida
  isExtendedComposition: boolean;
  totalWidth: number;
  totalHeight: number;
}

interface EditorUIActions {
  // Panel controls
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelTab: (tab: 'palette' | 'layers') => void;
  setRightPanelTab: (tab: 'general' | 'background' | 'animations') => void;
  
  // Grid and guides
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleGuides: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  
  // Preview mode
  setPreviewMode: (enabled: boolean) => void;
  
  // Multi-screen support
  addScreen: (screen: Omit<EditorUIState['screens'][0], 'id'>) => void;
  updateScreen: (id: string, updates: Partial<EditorUIState['screens'][0]>) => void;
  removeScreen: (id: string) => void;
  setActiveScreen: (id: string) => void;
  
  // Extended composition
  setExtendedComposition: (enabled: boolean, totalWidth?: number, totalHeight?: number) => void;
  
  // Element operations
  addElement: (element: any) => void;
  duplicateElement: (id: string) => void;
  deleteElement: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  groupElements: () => void;
  ungroupElements: () => void;
  undo: () => void;
  redo: () => void;
  setZoom: (zoom: number) => void;
}

type EditorUIStore = EditorUIState & EditorUIActions;

// Store para el estado de la UI del editor
export const useEditorUIStore = create<EditorUIStore>()(subscribeWithSelector(immer((set, get) => ({
  // Estado inicial
  showLeftPanel: true,
  showRightPanel: true,
  leftPanelTab: 'palette',
  rightPanelTab: 'general',
  
  showGrid: false,
  showRulers: true,
  showGuides: true,
  snapToGrid: true,
  gridSize: 20,
  
  previewMode: false,
  
  screens: [
    {
      id: 'screen-1',
      name: 'Pantalla Principal',
      width: 1920,
      height: 1080,
      orientation: 'landscape',
      offsetX: 0,
      offsetY: 0,
    }
  ],
  activeScreenId: 'screen-1',
  
  isExtendedComposition: false,
  totalWidth: 1920,
  totalHeight: 1080,
  
  // Acciones
  toggleLeftPanel: () => set((state) => {
    state.showLeftPanel = !state.showLeftPanel;
  }),
  
  toggleRightPanel: () => set((state) => {
    state.showRightPanel = !state.showRightPanel;
  }),
  
  setLeftPanelTab: (tab) => set((state) => {
    state.leftPanelTab = tab;
  }),
  
  setRightPanelTab: (tab) => set((state) => {
    state.rightPanelTab = tab;
  }),
  
  toggleGrid: () => set((state) => {
    state.showGrid = !state.showGrid;
  }),
  
  toggleRulers: () => set((state) => {
    state.showRulers = !state.showRulers;
  }),
  
  toggleGuides: () => set((state) => {
    state.showGuides = !state.showGuides;
  }),
  
  toggleSnapToGrid: () => set((state) => {
    state.snapToGrid = !state.snapToGrid;
  }),
  
  setGridSize: (size) => set((state) => {
    state.gridSize = size;
  }),
  
  setPreviewMode: (enabled) => set((state) => {
    state.previewMode = enabled;
  }),
  
  addScreen: (screen) => set((state) => {
    const newScreen = {
      ...screen,
      id: `screen-${Date.now()}`,
    };
    state.screens.push(newScreen);
  }),
  
  updateScreen: (id, updates) => set((state) => {
    const screenIndex = state.screens.findIndex(s => s.id === id);
    if (screenIndex !== -1) {
      Object.assign(state.screens[screenIndex], updates);
    }
  }),
  
  removeScreen: (id) => set((state) => {
    state.screens = state.screens.filter(s => s.id !== id);
    if (state.activeScreenId === id && state.screens.length > 0) {
      state.activeScreenId = state.screens[0].id;
    }
  }),
  
  setActiveScreen: (id) => set((state) => {
    state.activeScreenId = id;
  }),
  
  setExtendedComposition: (enabled, totalWidth = 1920, totalHeight = 1080) => set((state) => {
    state.isExtendedComposition = enabled;
    state.totalWidth = totalWidth;
    state.totalHeight = totalHeight;
  }),
  
  // Element operations
  addElement: (element: any) => {
    polotnoStore.activePage?.addElement(element);
  },
  
  duplicateElement: (id: string) => {
    const element = polotnoStore.getElementById(id);
    if (element) {
      const elementData = element.toJSON();
      polotnoStore.activePage?.addElement({
        ...elementData,
        id: undefined, // Let Polotno generate new ID
        x: elementData.x + 20,
        y: elementData.y + 20
      });
    }
  },
  
  deleteElement: (id: string) => {
    const element = polotnoStore.getElementById(id);
    if (element && polotnoStore.activePage) {
      polotnoStore.activePage.children.remove(element);
    }
  },
  
  selectMultiple: (ids: string[]) => {
    polotnoStore.selectElements(ids);
  },
  
  clearSelection: () => {
    polotnoStore.selectElements([]);
  },
  
  groupElements: () => {
    // Polotno handles grouping internally
    console.log('Grouping elements');
  },
  
  ungroupElements: () => {
    // Polotno handles ungrouping internally
    console.log('Ungrouping elements');
  },
  
  undo: () => {
    polotnoStore.history.undo();
  },
  
  redo: () => {
    polotnoStore.history.redo();
  },
  
  setZoom: (zoom: number) => {
    // Polotno zoom is handled by the workspace component
    console.log('Setting zoom to:', zoom);
  },
}))));

// Funciones de utilidad para trabajar con Polotno
export const editorUtils = {
  // Guardar diseño
  saveDesign: () => {
    try {
      return polotnoStore.toJSON();
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  },
  
  // Cargar diseño
  loadDesign: (json: any) => {
    try {
      polotnoStore.loadJSON(json);
    } catch (error) {
      console.error('Error loading design:', error);
      throw error;
    }
  },
  
  // Generar miniatura
  generateThumbnail: async (pixelRatio = 0.2) => {
    try {
      // Verificar que el store esté listo
      if (!polotnoStore.activePage) {
        throw new Error('No active page available');
      }
      
      // Usar un timeout para evitar bucles infinitos
      return await Promise.race([
        polotnoStore.toDataURL({ pixelRatio }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Thumbnail generation timeout')), 10000)
        )
      ]);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  },
  
  // Exportar PNG a resolución nativa
  exportPNG: async (pixelRatio = 1) => {
    try {
      // Verificar que el store esté listo
      if (!polotnoStore.activePage) {
        throw new Error('No active page available');
      }
      
      // Usar un timeout para evitar bucles infinitos
      return await Promise.race([
        polotnoStore.toDataURL({ pixelRatio }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('PNG export timeout')), 15000)
        )
      ]);
    } catch (error) {
      console.error('Error exporting PNG:', error);
      throw error;
    }
  },
  
  // Limpiar store
  clearStore: () => {
    polotnoStore.clear();
    // Crear página con dimensiones por defecto
    const page = polotnoStore.addPage();
    if (page) {
      page.setSize({
        width: 1920,
        height: 1080,
        useMagic: true
      });
    }
  },
  
  // Obtener elemento seleccionado
  getSelectedElement: () => {
    return polotnoStore.selectedElements[0];
  },
  
  // Obtener todos los elementos seleccionados
  getSelectedElements: () => {
    return polotnoStore.selectedElements;
  },
  
  // Agrupar elementos
  groupElements: () => {
    const selectedElements = polotnoStore.selectedElements;
    if (selectedElements.length > 1) {
      // Polotno maneja el agrupamiento internamente
      // Por ahora, simplemente seleccionamos los elementos
      console.log('Grouping elements:', selectedElements.map(el => el.id));
    }
  },
  
  // Desagrupar elementos
  ungroupElements: () => {
    const selectedElement = polotnoStore.selectedElements[0];
    if (selectedElement) {
      // Polotno maneja el desagrupamiento internamente
      console.log('Ungrouping element:', selectedElement.id);
    }
  },

  // Configurar dimensiones del canvas
  setCanvasDimensions: (width: number, height: number) => {
    try {
      if (polotnoStore.activePage) {
        polotnoStore.activePage.setSize({
          width: width,
          height: height,
          useMagic: true // Usar useMagic: true para que Polotno maneje automáticamente la actualización del viewport
        });
        
        // Forzar actualización del viewport
      setTimeout(() => {
        // Forzar re-render del workspace
        polotnoStore.selectElements([]);
        
        // Disparar evento de resize para forzar actualización del canvas
        if (typeof window !== 'undefined') {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
        
        // Forzar transacción para actualizar el estado
        polotnoStore.history.transaction(() => {
          // Operación vacía para forzar actualización
        });
      }, 100);
        
        console.log(`Canvas dimensions set to: ${width}x${height}`);
      } else {
        console.warn('No active page available to set dimensions');
      }
    } catch (error) {
      console.error('Error setting canvas dimensions:', error);
    }
  },

  // Crear nueva página con dimensiones específicas
  createPageWithDimensions: (width: number, height: number, background = '#ffffff') => {
    console.log('=== INICIO createPageWithDimensions ===');
    console.log(`Dimensiones solicitadas: ${width}x${height}`);
    console.log('Background:', background);
    console.log('Store antes de limpiar - páginas:', polotnoStore.pages.length);
    
    try {
      // Limpiar páginas existentes
      polotnoStore.clear();
      console.log('Store después de limpiar - páginas:', polotnoStore.pages.length);
      
      // Crear nueva página
      const page = polotnoStore.addPage();
      console.log('Página creada:', !!page);
      console.log('Store después de agregar página - páginas:', polotnoStore.pages.length);
      
      if (page) {
        console.log('Dimensiones de página antes de setSize:', page.width, 'x', page.height);
        
        // Configurar dimensiones usando setSize()
        page.setSize({
          width: width,
          height: height,
          useMagic: true // Cambiar a true para mejor actualización
        });
        
        console.log('Dimensiones de página después de setSize:', page.width, 'x', page.height);
        
        // Configurar el fondo de la página
        if (background) {
          page.set({ background: background });
          console.log('Background configurado:', background);
        }
        
        // Verificación inmediata
        console.log('=== VERIFICACIÓN INMEDIATA ===');
        console.log('Página activa:', polotnoStore.activePage?.width, 'x', polotnoStore.activePage?.height);
        console.log('Total de páginas:', polotnoStore.pages.length);
        console.log('Todas las páginas:', polotnoStore.pages.map(p => ({ width: p.width, height: p.height })));
        
        // Múltiples intentos de forzar actualización
        setTimeout(() => {
          console.log('=== FORZANDO ACTUALIZACIÓN (100ms) ===');
          
          // Forzar re-render del workspace
          polotnoStore.selectElements([]);
          
          // Disparar múltiples eventos
          if (typeof window !== 'undefined') {
            const resizeEvent = new Event('resize');
            window.dispatchEvent(resizeEvent);
            
            const customEvent = new CustomEvent('polotno-update');
            window.dispatchEvent(customEvent);
          }
          
          // Forzar transacción
          polotnoStore.history.transaction(() => {
            // Operación vacía para forzar actualización
          });
          
          // Verificar nuevamente
          console.log('Después de forzar actualización:');
          console.log('- Página activa:', polotnoStore.activePage?.width, 'x', polotnoStore.activePage?.height);
          console.log('- Total páginas:', polotnoStore.pages.length);
        }, 100);
        
        // Segundo intento más agresivo
        setTimeout(() => {
          console.log('=== SEGUNDO INTENTO (500ms) ===');
          
          // Intentar setSize nuevamente
          if (polotnoStore.activePage) {
            polotnoStore.activePage.setSize({
              width: width,
              height: height,
              useMagic: true
            });
            console.log('SetSize aplicado nuevamente');
            console.log('Dimensiones finales:', polotnoStore.activePage.width, 'x', polotnoStore.activePage.height);
          }
        }, 500);
      }
      
      return page;
    } catch (error) {
      console.error('=== ERROR en createPageWithDimensions ===', error);
      // Fallback: crear página por defecto
      polotnoStore.clear();
      const fallbackPage = polotnoStore.addPage();
      if (fallbackPage) {
        fallbackPage.setSize({
          width: 1920,
          height: 1080,
          useMagic: true
        });
        console.log('Página fallback creada con 1920x1080');
      }
      return fallbackPage;
    }
  },
};

// Export del store principal para compatibilidad
export const useEditorStore = useEditorUIStore;
export default polotnoStore;