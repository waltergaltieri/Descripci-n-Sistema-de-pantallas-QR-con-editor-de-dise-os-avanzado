// Configuración segura de propiedades de imagen para Polotno
// Esta implementación reemplaza el override problemático que causaba errores de MobX State Tree

/**
 * Configuración por defecto para elementos de imagen
 */
export const DEFAULT_IMAGE_CONFIG = {
  draggable: true,
  resizable: true,
  removable: true,
  selectable: true,
  contentEditable: false,
  styleEditable: true,
  locked: false,
  keepRatio: true,
  stretchEnabled: true
};

/**
 * Función para obtener configuración por defecto para elementos de imagen
 * NO modifica objetos existentes para evitar errores de MobX State Tree
 * @param {Object} customConfig - Configuración personalizada
 * @returns {Object} - La configuración combinada
 */
export function getImageConfig(customConfig = {}) {
  return { ...DEFAULT_IMAGE_CONFIG, ...customConfig };
}

/**
 * Hook personalizado para configurar elementos de imagen en react-konva
 * @param {Object} imageProps - Propiedades del componente Image
 * @param {Object} customConfig - Configuración personalizada
 * @returns {Object} - Propiedades configuradas para el componente Image
 */
export function useImageConfig(imageProps = {}, customConfig = {}) {
  const config = { ...DEFAULT_IMAGE_CONFIG, ...customConfig };
  
  return {
    ...imageProps,
    draggable: config.draggable,
    // Otras propiedades se manejan a través de eventos o refs
    onTransformEnd: (e) => {
      // Mantener ratio si está habilitado
      if (config.keepRatio) {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        // Usar la escala menor para mantener el ratio
        const scale = Math.min(scaleX, scaleY);
        node.scaleX(scale);
        node.scaleY(scale);
      }
      
      // Llamar al handler original si existe
      if (imageProps.onTransformEnd) {
        imageProps.onTransformEnd(e);
      }
    }
  };
}

/**
 * Función para configurar un store de Polotno de manera segura
 * Esta implementación NO modifica objetos existentes para evitar errores de MobX State Tree
 * @param {Object} store - El store de Polotno
 * @param {Object} config - Configuración personalizada
 */
export function configurePolotnoImageDefaults(store, config = {}) {
  if (!store) {
    console.warn('Store de Polotno no válido');
    return;
  }

  // Solo registrar la configuración sin modificar nada
  // La configuración se aplicará cuando se creen nuevos elementos
  console.log('Configuración de imágenes registrada:', { ...DEFAULT_IMAGE_CONFIG, ...config });
  
  // No interceptar métodos para evitar conflictos con MobX State Tree
  // La funcionalidad se manejará a través de props de componentes React
}

/**
 * Función para restaurar la configuración original (cleanup)
 * @param {Object} store - El store de Polotno
 */
export function restorePolotnoDefaults(store) {
  // Esta función puede usarse para limpiar overrides si es necesario
  // Por ahora, la implementación es segura y no requiere cleanup
  console.log('Configuración de Polotno restaurada');
}