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

    // Estructura básica HTML
    let html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diseño</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #ffffff;
        }
        .design-container {
            width: 100%;
            height: 100vh;
            position: relative;
            overflow: hidden;
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

    // Procesar páginas si existen
    if (data.pages && Array.isArray(data.pages)) {
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

  const x = element.x || 0;
  const y = element.y || 0;
  const width = element.width || 100;
  const height = element.height || 100;
  const rotation = element.rotation || 0;

  let elementHtml = '';
  let styles = `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;`;
  
  if (rotation !== 0) {
    styles += ` transform: rotate(${rotation}deg);`;
  }

  switch (element.type) {
    case 'text':
      const fontSize = element.fontSize || 16;
      const fontFamily = element.fontFamily || 'Arial';
      const fill = element.fill || '#000000';
      const textAlign = element.align || 'left';
      const fontWeight = element.fontWeight || 'normal';
      const fontStyle = element.fontStyle || 'normal';
      
      styles += ` font-size: ${fontSize}px; font-family: ${fontFamily}; color: ${fill}; text-align: ${textAlign}; font-weight: ${fontWeight}; font-style: ${fontStyle};`;
      
      elementHtml = `<div class="design-element text-element" style="${styles}">${element.text || ''}</div>`;
      break;

    case 'image':
      if (element.src) {
        styles += ` background-image: url('${element.src}');`;
      }
      elementHtml = `<div class="design-element image-element" style="${styles}"></div>`;
      break;

    case 'rect':
    case 'rectangle':
      const fill_rect = element.fill || '#cccccc';
      const cornerRadius = element.cornerRadius || 0;
      styles += ` background-color: ${fill_rect}; border-radius: ${cornerRadius}px;`;
      elementHtml = `<div class="design-element shape-element" style="${styles}"></div>`;
      break;

    case 'circle':
    case 'ellipse':
      const fill_circle = element.fill || '#cccccc';
      styles += ` background-color: ${fill_circle}; border-radius: 50%;`;
      elementHtml = `<div class="design-element shape-element" style="${styles}"></div>`;
      break;

    default:
      // Para otros tipos de elementos, crear un div básico
      const fill_default = element.fill || '#cccccc';
      styles += ` background-color: ${fill_default};`;
      elementHtml = `<div class="design-element" style="${styles}"></div>`;
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