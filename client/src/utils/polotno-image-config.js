// Configuracion segura de propiedades de imagen para Polotno.
// Mantiene compatibilidad sin inyectar logs de depuracion en el editor.

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

export function getImageConfig(customConfig = {}) {
  return { ...DEFAULT_IMAGE_CONFIG, ...customConfig };
}

export function useImageConfig(imageProps = {}, customConfig = {}) {
  const config = { ...DEFAULT_IMAGE_CONFIG, ...customConfig };

  return {
    ...imageProps,
    draggable: config.draggable,
    onTransformEnd: (event) => {
      if (config.keepRatio) {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        const scale = Math.min(scaleX, scaleY);

        node.scaleX(scale);
        node.scaleY(scale);
      }

      if (imageProps.onTransformEnd) {
        imageProps.onTransformEnd(event);
      }
    }
  };
}

export function configurePolotnoImageDefaults(store, config = {}) {
  if (!store) {
    return;
  }

  void config;
}

export function restorePolotnoDefaults(store) {
  void store;
}
