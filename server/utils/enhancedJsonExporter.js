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
          }
        }
      }
    };

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
      visible: element.visible !== false
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
        fontStyle: element.fontStyle || 'normal'
      };
      break;

    case 'image':
      enhanced.computed.image = {
        src: element.src || '',
        cropX: element.cropX || 0,
        cropY: element.cropY || 0,
        cropWidth: element.cropWidth || 1,
        cropHeight: element.cropHeight || 1
      };
      break;

    case 'rect':
    case 'rectangle':
      enhanced.computed.shape = {
        fill: element.fill || '#cccccc',
        stroke: element.stroke || null,
        strokeWidth: element.strokeWidth || 0,
        cornerRadius: element.cornerRadius || 0
      };
      break;

    case 'circle':
    case 'ellipse':
      enhanced.computed.shape = {
        fill: element.fill || '#cccccc',
        stroke: element.stroke || null,
        strokeWidth: element.strokeWidth || 0
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