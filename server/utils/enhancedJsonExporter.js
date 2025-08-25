/**
 * Exporta un JSON mejorado a partir del contenido original del diseño
 * @param {Object} originalContent - Contenido original del diseño
 * @returns {Object} - JSON mejorado con información adicional
 */
function exportEnhancedJson(originalContent) {
  if (!originalContent) {
    return null;
  }

  try {
    // Si es un string, parsearlo
    let content = originalContent;
    if (typeof originalContent === 'string') {
      content = JSON.parse(originalContent);
    }

    // Crear estructura mejorada
    const enhancedJson = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      original: content,
      enhanced: {
        elements: [],
        metadata: {
          totalElements: 0,
          elementTypes: {},
          dimensions: {
            width: 0,
            height: 0
          },
          // Fondo del lienzo
          canvasBackground: {
            color: null,
            image: null,
            type: 'color' // 'color' | 'image' | 'gradient'
          },
          // Configuración global
          globalSettings: {
            fonts: [],
            customFonts: []
          }
        }
      }
    };

    // Capturar fuentes globales si existen
    if (content.fonts && Array.isArray(content.fonts)) {
      enhancedJson.enhanced.metadata.globalSettings.fonts = content.fonts;
    }
    if (content.customFonts && Array.isArray(content.customFonts)) {
      enhancedJson.enhanced.metadata.globalSettings.customFonts = content.customFonts;
    }
    
    // Procesar páginas si existen (formato Polotno)
    if (content.pages && Array.isArray(content.pages)) {
      content.pages.forEach(page => {
        if (page.children && Array.isArray(page.children)) {
          page.children.forEach(element => {
            const enhancedElement = enhanceElement(element);
            if (enhancedElement) {
              enhancedJson.enhanced.elements.push(enhancedElement);
              enhancedJson.enhanced.metadata.totalElements++;
              
              // Contar tipos de elementos
              const type = element.type || 'unknown';
              enhancedJson.enhanced.metadata.elementTypes[type] = 
                (enhancedJson.enhanced.metadata.elementTypes[type] || 0) + 1;
            }
          });
        }
        
        // Obtener dimensiones de la página
        if (page.width && page.height) {
          enhancedJson.enhanced.metadata.dimensions.width = Math.max(
            enhancedJson.enhanced.metadata.dimensions.width, 
            page.width
          );
          enhancedJson.enhanced.metadata.dimensions.height = Math.max(
            enhancedJson.enhanced.metadata.dimensions.height, 
            page.height
          );
        }
        
        // Capturar fondo del lienzo
        if (page.background) {
          if (typeof page.background === 'string') {
            // Es un color o URL
            if (page.background.startsWith('http') || page.background.startsWith('data:')) {
              enhancedJson.enhanced.metadata.canvasBackground.type = 'image';
              enhancedJson.enhanced.metadata.canvasBackground.image = page.background;
            } else {
              enhancedJson.enhanced.metadata.canvasBackground.type = 'color';
              enhancedJson.enhanced.metadata.canvasBackground.color = page.background;
            }
          } else if (typeof page.background === 'object') {
            // Es un gradiente u objeto complejo
            enhancedJson.enhanced.metadata.canvasBackground.type = 'gradient';
            enhancedJson.enhanced.metadata.canvasBackground.gradient = page.background;
          }
        }
      });
    }
    // Procesar elementos directamente si no hay páginas
    else if (content.children && Array.isArray(content.children)) {
      content.children.forEach(element => {
        const enhancedElement = enhanceElement(element);
        if (enhancedElement) {
          enhancedJson.enhanced.elements.push(enhancedElement);
          enhancedJson.enhanced.metadata.totalElements++;
          
          const type = element.type || 'unknown';
          enhancedJson.enhanced.metadata.elementTypes[type] = 
            (enhancedJson.enhanced.metadata.elementTypes[type] || 0) + 1;
        }
      });
    }
    // Procesar formato legacy
    else if (content.sections && Array.isArray(content.sections)) {
      content.sections.forEach(section => {
        if (section.elements && Array.isArray(section.elements)) {
          section.elements.forEach(element => {
            const enhancedElement = enhanceLegacyElement(element);
            if (enhancedElement) {
              enhancedJson.enhanced.elements.push(enhancedElement);
              enhancedJson.enhanced.metadata.totalElements++;
              
              const type = element.type || 'unknown';
              enhancedJson.enhanced.metadata.elementTypes[type] = 
                (enhancedJson.enhanced.metadata.elementTypes[type] || 0) + 1;
            }
          });
        }
      });
    }

    return enhancedJson;
  } catch (error) {
    console.error('Error exportando JSON mejorado:', error);
    return null;
  }
}

/**
 * Mejora un elemento individual de Polotno
 */
function enhanceElement(element) {
  if (!element) {
    return null;
  }

  const enhanced = {
    id: element.id,
    type: element.type,
    original: element,
    computed: {
      position: {
        x: element.x || 0,
        y: element.y || 0
      },
      dimensions: {
        width: element.width || 0,
        height: element.height || 0
      },
      rotation: element.rotation || 0,
      visible: element.visible !== false,
      zIndex: element.zIndex || 0,
      // Propiedades visuales
      opacity: element.opacity || 1,
      blendMode: element.blendMode || 'normal',
      // Filtros y efectos
      filters: {
        blur: element.blurEnabled ? { enabled: true, radius: element.blurRadius || 0 } : { enabled: false },
        brightness: element.brightnessEnabled ? { enabled: true, value: element.brightness || 0 } : { enabled: false },
        sepia: element.sepiaEnabled ? { enabled: true, value: element.sepia || 0 } : { enabled: false }
      },
      // Sombras
      shadow: element.shadowEnabled ? {
        enabled: true,
        offsetX: element.shadowOffsetX || 0,
        offsetY: element.shadowOffsetY || 0,
        blur: element.shadowBlur || 0,
        color: element.shadowColor || '#000000'
      } : { enabled: false }
    }
  };

  // Información específica por tipo
  switch (element.type) {
    case 'text':
      enhanced.computed.text = {
        content: element.text || '',
        fontSize: element.fontSize || 16,
        fontFamily: element.fontFamily || 'Arial',
        color: element.fill || '#000000',
        align: element.align || 'left',
        fontWeight: element.fontWeight || 'normal',
        fontStyle: element.fontStyle || 'normal',
        // Fuente exacta y métricas
        fontUrl: element.fontUrl || null,
        lineHeight: element.lineHeight || 1.2,
        letterSpacing: element.letterSpacing || 0,
        // Métricas precalculadas
        lineHeightPx: element.lineHeightPx || (element.fontSize || 16) * (element.lineHeight || 1.2),
        baselineOffsetPx: element.baselineOffsetPx || 0,
        letterSpacingPx: element.letterSpacingPx || 0,
        // Decoraciones
        textDecoration: element.textDecoration || 'none',
        textTransform: element.textTransform || 'none'
      };
      break;

    case 'image':
      // Calcular cropping en píxeles si tenemos dimensiones naturales
      const naturalWidth = element.naturalWidth || element.width || 0;
      const naturalHeight = element.naturalHeight || element.height || 0;
      
      enhanced.computed.image = {
        src: element.src || '',
        // Cropping fraccionario original
        cropX: element.cropX || 0,
        cropY: element.cropY || 0,
        cropWidth: element.cropWidth || 1,
        cropHeight: element.cropHeight || 1,
        // Cropping en píxeles
        cropPx: {
          x: (element.cropX || 0) * naturalWidth,
          y: (element.cropY || 0) * naturalHeight,
          width: (element.cropWidth || 1) * naturalWidth,
          height: (element.cropHeight || 1) * naturalHeight
        },
        // Dimensiones naturales
        naturalWidth: naturalWidth,
        naturalHeight: naturalHeight,
        // Máscaras/clip completos
        clip: element.clipSrc ? {
          type: element.clipType || 'path',
          path: element.clipPath || element.clipSrc,
          viewBox: element.clipViewBox || '0 0 100 100',
          matrix: element.clipMatrix || 'matrix(1,0,0,1,0,0)',
          base64: element.clipSrc
        } : null
      };
      break;

    case 'rect':
    case 'rectangle':
      enhanced.computed.shape = {
        fill: element.fill || '#cccccc',
        stroke: element.stroke || null,
        strokeWidth: element.strokeWidth || 0,
        cornerRadius: element.cornerRadius || 0,
        // Gradientes
        gradient: element.gradient || null
      };
      break;

    case 'circle':
    case 'ellipse':
      enhanced.computed.shape = {
        fill: element.fill || '#cccccc',
        stroke: element.stroke || null,
        strokeWidth: element.strokeWidth || 0,
        // Gradientes
        gradient: element.gradient || null
      };
      break;
  }

  return enhanced;
}

/**
 * Mejora un elemento del formato legacy
 */
function enhanceLegacyElement(element) {
  if (!element) {
    return null;
  }

  const enhanced = {
    id: element.id || `legacy-${Date.now()}-${Math.random()}`,
    type: element.type,
    original: element,
    computed: {
      legacy: true
    }
  };

  switch (element.type) {
    case 'text':
      enhanced.computed.text = {
        content: element.content || '',
        fontSize: element.fontSize || '16px',
        color: element.color || '#000000',
        fontWeight: element.fontWeight || 'normal',
        textAlign: element.textAlign || 'left'
      };
      break;
  }

  return enhanced;
}

module.exports = { exportEnhancedJson };