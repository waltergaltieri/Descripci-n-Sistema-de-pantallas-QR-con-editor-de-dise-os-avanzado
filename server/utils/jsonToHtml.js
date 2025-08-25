/**
 * Convierte un objeto JSON de diseño a HTML
 * @param {Object} jsonData - Datos del diseño en formato JSON
 * @returns {string} - HTML generado
 */
function convertJsonToHtml(jsonData) {
  if (!jsonData) {
    return '<div>No hay contenido disponible</div>';
  }

  try {
    // Si es un string, parsearlo
    let data = jsonData;
    if (typeof jsonData === 'string') {
      data = JSON.parse(jsonData);
    }

    // Obtener dimensiones exactas del diseño
    let canvasWidth = 1920; // Default
    let canvasHeight = 1080; // Default
    
    // Si es enhanced_content, usar metadata.dimensions
    if (data.enhanced && data.enhanced.metadata && data.enhanced.metadata.dimensions) {
      canvasWidth = data.enhanced.metadata.dimensions.width || 1920;
      canvasHeight = data.enhanced.metadata.dimensions.height || 1080;
    }
    // Si es formato original, usar pages[0].width/height
    else if (data.pages && data.pages[0]) {
      canvasWidth = data.pages[0].width || 1920;
      canvasHeight = data.pages[0].height || 1080;
    }
    // Si es formato legacy, usar children o sections
    else if (data.children && data.children.length > 0) {
      // Para legacy, usar dimensiones por defecto o calcular desde elementos
      canvasWidth = 1920;
      canvasHeight = 1080;
    }
    
    // Obtener información del fondo del lienzo
    let canvasBackground = 'transparent'; // Cambiar default a transparente
    let canvasBackgroundImage = null;
    
    // Si es enhanced_content, obtener el fondo desde metadata
    if (data.enhanced && data.enhanced.metadata && data.enhanced.metadata.canvasBackground) {
      const bg = data.enhanced.metadata.canvasBackground;
      if (bg.type === 'color' && bg.color) {
        canvasBackground = bg.color;
      } else if (bg.type === 'image' && bg.image) {
        canvasBackgroundImage = bg.image;
      }
    }
    // Si es formato original, buscar en pages
    else if (data.pages && data.pages[0] && data.pages[0].background) {
      const bg = data.pages[0].background;
      if (typeof bg === 'string') {
        if (bg.startsWith('http') || bg.startsWith('data:')) {
          canvasBackgroundImage = bg;
        } else {
          canvasBackground = bg;
        }
      }
    }
    
    // Obtener fuentes personalizadas
    let customFonts = [];
    if (data.enhanced && data.enhanced.metadata && data.enhanced.metadata.globalSettings) {
      customFonts = data.enhanced.metadata.globalSettings.customFonts || [];
    }
    
    // Generar imports de fuentes
    let fontImports = '';
    customFonts.forEach(font => {
      if (font.url) {
        fontImports += `@import url('${font.url}');\n        `;
      }
    });
    
    // Agregar fuentes comunes de Google Fonts
    const commonFonts = ['Norican', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'];
    commonFonts.forEach(fontName => {
      fontImports += `@import url('https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@300;400;500;600;700&display=swap');\n        `;
    });
    
    // Estructura básica HTML
    let html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diseño</title>
    <style>
        ${fontImports}
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .design-container {
            width: ${canvasWidth}px;
            height: ${canvasHeight}px;
            position: relative;
            overflow: hidden;
            background-color: ${canvasBackground};
            ${canvasBackgroundImage ? `background-image: url('${canvasBackgroundImage}'); background-size: cover; background-position: center;` : ''}
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .design-element {
            position: absolute;
        }
        .text-element {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .image-element {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
        }
        .shape-element {
            border-radius: 0;
        }
    </style>
</head>
<body>
    <div class="design-container">`;

    // Si es enhanced_content, usar los elementos mejorados
    if (data.enhanced && data.enhanced.elements && Array.isArray(data.enhanced.elements)) {
      data.enhanced.elements.forEach(element => {
        html += convertElementToHtml(element);
      });
    }
    // Si es enhanced_content pero sin elementos mejorados, usar el original
    else if (data.original) {
      const originalData = data.original;
      if (originalData.pages && Array.isArray(originalData.pages)) {
        originalData.pages.forEach(page => {
          if (page.children && Array.isArray(page.children)) {
            page.children.forEach(element => {
              html += convertElementToHtml(element);
            });
          }
        });
      }
    }
    // Procesar páginas si existen (formato normal)
    else if (data.pages && Array.isArray(data.pages)) {
      data.pages.forEach(page => {
        if (page.children && Array.isArray(page.children)) {
          page.children.forEach(element => {
            html += convertElementToHtml(element);
          });
        }
      });
    }
    // Si no hay páginas, procesar elementos directamente
    else if (data.children && Array.isArray(data.children)) {
      data.children.forEach(element => {
        html += convertElementToHtml(element);
      });
    }
    // Procesar formato legacy si existe
    else if (data.sections && Array.isArray(data.sections)) {
      data.sections.forEach(section => {
        if (section.elements && Array.isArray(section.elements)) {
          section.elements.forEach(element => {
            html += convertLegacyElementToHtml(element);
          });
        }
      });
    }

    html += `
    </div>
</body>
</html>`;

    return html;
  } catch (error) {
    console.error('Error convirtiendo JSON a HTML:', error);
    return '<div>Error al generar HTML</div>';
  }
}

/**
 * Convierte un elemento de Polotno a HTML
 */
function convertElementToHtml(element) {
  if (!element || !element.type) {
    return '';
  }

  // Manejar elementos mejorados (enhanced) vs elementos normales
  let x, y, width, height, rotation, actualElement, zIndex, opacity, filters, shadow;
  let flipX = false, flipY = false, scaleX = 1, scaleY = 1;
  let cropPx = null, naturalWidth = null, naturalHeight = null, clip = null;
  
  if (element.computed && element.original) {
    // Elemento mejorado (enhanced)
    x = element.computed.position.x;
    y = element.computed.position.y;
    width = element.computed.dimensions.width;
    height = element.computed.dimensions.height;
    rotation = element.computed.rotation || 0;
    zIndex = element.computed.zIndex || 0;
    opacity = element.computed.opacity || 1;
    filters = element.computed.filters || {};
    shadow = element.computed.shadow || {};
    
    // Propiedades de transformación
    flipX = element.computed.flipX || false;
    flipY = element.computed.flipY || false;
    scaleX = element.computed.scaleX || 1;
    scaleY = element.computed.scaleY || 1;
    
    // Propiedades de imagen con crop
    if (element.computed.cropPx) {
      cropPx = element.computed.cropPx;
    }
    if (element.computed.naturalWidth) {
      naturalWidth = element.computed.naturalWidth;
    }
    if (element.computed.naturalHeight) {
      naturalHeight = element.computed.naturalHeight;
    }
    if (element.computed.clip) {
      clip = element.computed.clip;
    }
    
    // Propiedades de imagen con crop (enhanced)
    if (element.computed && element.computed.image) {
      const imgC = element.computed.image;
      if (imgC.cropPx) cropPx = imgC.cropPx;
      if (imgC.naturalWidth) naturalWidth = imgC.naturalWidth;
      if (imgC.naturalHeight) naturalHeight = imgC.naturalHeight;
      // si el src real está en computed.image
      if (!actualElement.src && imgC.src) actualElement.src = imgC.src;
      // si el clip viene aquí y no lo detectaste antes
      if (!actualElement.clipSrc && imgC.clip && imgC.clip.base64) actualElement.clipSrc = imgC.clip.base64;
    }
    
    actualElement = element.original; // Usar el elemento original para propiedades específicas
  } else {
    // Elemento normal
    x = element.x || 0;
    y = element.y || 0;
    width = element.width || 100;
    height = element.height || 100;
    rotation = element.rotation || 0;
    zIndex = element.zIndex || 0;
    opacity = element.opacity || 1;
    filters = element.filters || {};
    shadow = element.shadow || {};
    
    // Propiedades de transformación
    flipX = element.flipX || false;
    flipY = element.flipY || false;
    scaleX = element.scaleX || 1;
    scaleY = element.scaleY || 1;
    
    // Propiedades de imagen con crop
    if (element.cropPx) {
      cropPx = element.cropPx;
    }
    if (element.naturalWidth) {
      naturalWidth = element.naturalWidth;
    }
    if (element.naturalHeight) {
      naturalHeight = element.naturalHeight;
    }
    if (element.clip || element.clipSrc) {
      clip = element.clip || element.clipSrc;
    }
    
    actualElement = element;
  }

  // --- Normaliza el clip / mask ---
  let maskDataUrl = null;
  
  // El JSON "original" trae clipSrc como data:image/svg+xml;base64,...
  if (actualElement.clipSrc && typeof actualElement.clipSrc === 'string' && actualElement.clipSrc.startsWith('data:image/svg+xml')) {
    maskDataUrl = actualElement.clipSrc;
  }
  
  // El JSON "enhanced" trae el clip dentro de computed.image.clip
  if (!maskDataUrl && element.computed && element.computed.image && element.computed.image.clip) {
    const c = element.computed.image.clip;
    if (typeof c === 'string' && c.startsWith('data:image/svg+xml')) maskDataUrl = c;
    if (!maskDataUrl && c.base64 && c.base64.startsWith('data:image/svg+xml')) maskDataUrl = c.base64;
    if (!maskDataUrl && c.path && typeof c.path === 'string' && c.path.startsWith('data:image/svg+xml')) maskDataUrl = c.path;
  }
  
  let elementHtml = '';
  let wrapperStyles = `position: absolute; left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; z-index: ${zIndex}; opacity: ${opacity}; transform-origin: 50% 50%;`;
  
  // Aplicar transformaciones al wrapper
  let transforms = [];
  if (rotation !== 0) {
    transforms.push(`rotate(${rotation}deg)`);
  }
  if (flipX) {
    transforms.push(`scaleX(-1)`);
  }
  if (flipY) {
    transforms.push(`scaleY(-1)`);
  }
  if (scaleX !== 1 || scaleY !== 1) {
    transforms.push(`scale(${scaleX}, ${scaleY})`);
  }
  if (transforms.length > 0) {
    wrapperStyles += ` transform: ${transforms.join(' ')};`;
  }
  
  // Aplicar la máscara por CSS (mucho más robusto para HTML)
  if (maskDataUrl) {
    wrapperStyles += ` 
      -webkit-mask-image: url('${maskDataUrl}'); 
      mask-image: url('${maskDataUrl}'); 
      -webkit-mask-size: 100% 100%; 
      mask-size: 100% 100%; 
      -webkit-mask-repeat: no-repeat; 
      mask-repeat: no-repeat; 
      -webkit-mask-position: center; 
      mask-position: center; 
    `;
  } else if (cropPx || (actualElement.type === 'image' && (naturalWidth || naturalHeight))) {
    wrapperStyles += ` overflow: hidden;`;
  }
  
  // Aplicar filtros
  let filterEffects = [];
  if (filters.blur && filters.blur.enabled) {
    filterEffects.push(`blur(${filters.blur.value || 5}px)`);
  }
  if (filters.brightness && filters.brightness.enabled) {
    filterEffects.push(`brightness(${filters.brightness.value || 100}%)`);
  }
  if (filters.sepia && filters.sepia.enabled) {
    filterEffects.push(`sepia(${filters.sepia.value || 100}%)`);
  }
  if (filterEffects.length > 0) {
    wrapperStyles += ` filter: ${filterEffects.join(' ')};`;
  }
  
  // Aplicar sombras
  if (shadow.enabled) {
    const shadowX = shadow.offsetX || 0;
    const shadowY = shadow.offsetY || 0;
    const shadowBlur = shadow.blur || 0;
    const shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
    wrapperStyles += ` box-shadow: ${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor};`;
  }
  
  // Aplicar blend mode
  if (actualElement.blendMode && actualElement.blendMode !== 'normal') {
    wrapperStyles += ` mix-blend-mode: ${actualElement.blendMode};`;
  }

  switch (actualElement.type) {
    case 'text':
      const fontSize = actualElement.fontSize || 16;
      const fontFamily = actualElement.fontFamily || 'Arial';
      const fill = actualElement.fill || '#000000';
      const textAlign = actualElement.align || 'left';
      const fontWeight = actualElement.fontWeight || 'normal';
      const fontStyle = actualElement.fontStyle || 'normal';
      const lineHeight = actualElement.lineHeight || 'normal';
      const textDecoration = actualElement.textDecoration || 'none';
      
      // Manejar letterSpacing numérico
      const ls = (typeof actualElement.letterSpacing === 'number') 
        ? `${actualElement.letterSpacing}px` 
        : (actualElement.letterSpacing || 'normal');
      
      // Mapear verticalAlign a align-items CSS
      let alignItems = 'center'; // default
      if (actualElement.verticalAlign === 'top') alignItems = 'flex-start';
      else if (actualElement.verticalAlign === 'bottom') alignItems = 'flex-end';
      else if (actualElement.verticalAlign === 'middle') alignItems = 'center';
      
      const textStyles = `width: 100%; height: 100%; display: flex; align-items: ${alignItems}; justify-content: ${textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start'}; font-size: ${fontSize}px; font-family: '${fontFamily}', Arial, sans-serif; color: ${fill}; font-weight: ${fontWeight}; font-style: ${fontStyle}; line-height: ${lineHeight}; letter-spacing: ${ls}; text-decoration: ${textDecoration}; word-wrap: break-word;`;
      
      elementHtml = `<div style="${wrapperStyles}"><div style="${textStyles}">${actualElement.text || ''}</div></div>`;
      break;

    case 'image':
      const src = actualElement.src || '';
      if (src) {
        let imgStyles = '';
        let imgElement = '';
        
        if (cropPx && naturalWidth && naturalHeight) {
          // Imagen con crop: usar img tag posicionado
          imgStyles = `position: absolute; left: ${-cropPx.x}px; top: ${-cropPx.y}px; width: ${naturalWidth}px; height: ${naturalHeight}px; object-fit: none;`;
          imgElement = `<img src="${src}" style="${imgStyles}" alt="" />`;
        } else {
          // Imagen sin crop: usar background-image
          const imgBgStyles = `width: 100%; height: 100%; background-image: url('${src}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
          imgElement = `<div style="${imgBgStyles}"></div>`;
        }
        
        elementHtml = `<div style="${wrapperStyles}">${imgElement}</div>`;
      } else {
        elementHtml = `<div style="${wrapperStyles}"><div style="width: 100%; height: 100%; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">Sin imagen</div></div>`;
      }
      break;

    case 'rect':
    case 'rectangle':
      const cornerRadius = actualElement.cornerRadius || 0;
      const backgroundColor = actualElement.fill || actualElement.backgroundColor || '#cccccc';
      const gradient = actualElement.gradient;
      
      let rectBg = '';
      if (gradient && gradient.type) {
        // Aplicar gradiente
        if (gradient.type === 'linear') {
          const angle = gradient.angle || 0;
          const stops = gradient.stops || [{offset: 0, color: '#ffffff'}, {offset: 1, color: '#000000'}];
          const stopsList = stops.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ');
          rectBg = `background: linear-gradient(${angle}deg, ${stopsList});`;
        } else if (gradient.type === 'radial') {
          const stops = gradient.stops || [{offset: 0, color: '#ffffff'}, {offset: 1, color: '#000000'}];
          const stopsList = stops.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ');
          rectBg = `background: radial-gradient(circle, ${stopsList});`;
        }
      } else {
        rectBg = `background-color: ${backgroundColor};`;
      }
      
      const rectStyles = `width: 100%; height: 100%; ${rectBg} border-radius: ${cornerRadius}px;`;
      elementHtml = `<div style="${wrapperStyles}"><div style="${rectStyles}"></div></div>`;
      break;

    case 'circle':
    case 'ellipse':
      const bgColor = actualElement.fill || actualElement.backgroundColor || '#cccccc';
      const circleGradient = actualElement.gradient;
      
      let circleBg = '';
      if (circleGradient && circleGradient.type) {
        if (circleGradient.type === 'linear') {
          const angle = circleGradient.angle || 0;
          const stops = circleGradient.stops || [{offset: 0, color: '#ffffff'}, {offset: 1, color: '#000000'}];
          const stopsList = stops.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ');
          circleBg = `background: linear-gradient(${angle}deg, ${stopsList});`;
        } else if (circleGradient.type === 'radial') {
          const stops = circleGradient.stops || [{offset: 0, color: '#ffffff'}, {offset: 1, color: '#000000'}];
          const stopsList = stops.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ');
          circleBg = `background: radial-gradient(circle, ${stopsList});`;
        }
      } else {
        circleBg = `background-color: ${bgColor};`;
      }
      
      const circleStyles = `width: 100%; height: 100%; ${circleBg} border-radius: 50%;`;
      elementHtml = `<div style="${wrapperStyles}"><div style="${circleStyles}"></div></div>`;
      break;

    default:
      elementHtml = `<div style="${wrapperStyles}"><div style="width: 100%; height: 100%; background-color: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999;">Elemento no soportado: ${actualElement.type}</div></div>`;
      break;
  }

  return elementHtml;
}

/**
 * Convierte elementos del formato legacy a HTML
 */
function convertLegacyElementToHtml(element) {
  if (!element || !element.type) {
    return '';
  }

  let elementHtml = '';
  let styles = '';

  switch (element.type) {
    case 'text':
      const fontSize = element.fontSize || '16px';
      const color = element.color || '#000000';
      const fontWeight = element.fontWeight || 'normal';
      const textAlign = element.textAlign || 'left';
      const marginBottom = element.marginBottom || '0px';
      
      styles = `font-size: ${fontSize}; color: ${color}; font-weight: ${fontWeight}; text-align: ${textAlign}; margin-bottom: ${marginBottom};`;
      
      elementHtml = `<div style="${styles}">${element.content || ''}</div>`;
      break;

    default:
      elementHtml = `<div>${element.content || ''}</div>`;
      break;
  }

  return elementHtml;
}

module.exports = { convertJsonToHtml };