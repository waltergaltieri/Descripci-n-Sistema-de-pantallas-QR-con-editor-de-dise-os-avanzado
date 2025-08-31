const fs = require('fs');
const path = require('path');
const { db } = require('../config/database');

/**
 * Extrae todas las fuentes únicas utilizadas en el diseño
 * @param {Object} designData - Datos del diseño
 * @returns {Object} - Objeto con fuentes de Google y personalizadas
 */
function extractUniqueFonts(designData) {
    const allFonts = new Set();
    
    // Recorrer todas las páginas y elementos
    designData.pages.forEach(page => {
        page.children.forEach(child => {
            if (child.type === 'text' && child.fontFamily) {
                allFonts.add(child.fontFamily);
            }
        });
    });
    
    const fonts = Array.from(allFonts);
    
    // Mapear fuentes conocidas de Google Fonts
    const googleFontMap = {
        'Roboto': 'Roboto:wght@400;700',
        'Anton': 'Anton:wght@400',
        'Montserrat Subrayada': 'Montserrat+Subrayada:wght@400;700',
        'Montserrat': 'Montserrat:wght@400;700',
        'Open Sans': 'Open+Sans:wght@400;700',
        'Lato': 'Lato:wght@400;700',
        'Oswald': 'Oswald:wght@400;700',
        'Source Sans Pro': 'Source+Sans+Pro:wght@400;700',
        'Raleway': 'Raleway:wght@400;700',
        'PT Sans': 'PT+Sans:wght@400;700',
        'Inter': 'Inter:wght@400;700',
        'Poppins': 'Poppins:wght@400;700',
        'Nunito': 'Nunito:wght@400;700',
        'Ewert': 'Ewert:wght@400'
    };
    
    // Separar fuentes de Google y personalizadas
    const googleFonts = fonts.filter(font => googleFontMap[font]);
    const customFonts = fonts.filter(font => !googleFontMap[font] && !isSystemFont(font));
    
    return {
        googleFonts,
        customFonts,
        allFonts: fonts
    };
}

/**
 * Verifica si una fuente es una fuente del sistema
 * @param {string} fontName - Nombre de la fuente
 * @returns {boolean} - True si es fuente del sistema
 */
function isSystemFont(fontName) {
    const systemFonts = [
        'Arial', 'Helvetica', 'Times', 'Times New Roman', 'Courier', 'Courier New',
        'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
        'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Sans Unicode', 'Tahoma',
        'Lucida Console', 'Monaco', 'Brush Script MT'
    ];
    return systemFonts.includes(fontName);
}

/**
 * Genera los enlaces de Google Fonts para las fuentes especificadas
 * @param {Array} googleFonts - Array de nombres de fuentes de Google
 * @returns {string} - HTML con los enlaces de Google Fonts
 */
function generateGoogleFontsLinks(googleFonts) {
    if (!googleFonts || googleFonts.length === 0) {
        return '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">';
    }
    
    // Mapear nombres de fuentes a sus equivalentes de Google Fonts
    const fontMap = {
        'Roboto': 'Roboto:wght@400;700',
        'Anton': 'Anton:wght@400',
        'Montserrat Subrayada': 'Montserrat+Subrayada:wght@400;700',
        'Montserrat': 'Montserrat:wght@400;700',
        'Open Sans': 'Open+Sans:wght@400;700',
        'Lato': 'Lato:wght@400;700',
        'Oswald': 'Oswald:wght@400;700',
        'Source Sans Pro': 'Source+Sans+Pro:wght@400;700',
        'Raleway': 'Raleway:wght@400;700',
        'PT Sans': 'PT+Sans:wght@400;700',
        'Inter': 'Inter:wght@400;700',
        'Poppins': 'Poppins:wght@400;700',
        'Nunito': 'Nunito:wght@400;700',
        'Ewert': 'Ewert:wght@400'
    };
    
    const mappedFonts = googleFonts
        .filter(font => fontMap[font])
        .map(font => fontMap[font]);
    
    if (mappedFonts.length === 0) {
        return '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">';
    }
    
    const fontQuery = mappedFonts.join('&family=');
    
    return `<link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${fontQuery}&display=swap" rel="stylesheet">`;
}

/**
 * Genera reglas @font-face para fuentes personalizadas
 * @param {Array} customFonts - Array de nombres de fuentes personalizadas
 * @returns {Promise<string>} - CSS con las reglas @font-face
 */
async function generateCustomFontFaces(customFonts) {
    if (!customFonts || customFonts.length === 0) {
        return '';
    }
    
    let fontFaces = '';
    
    try {
        const database = db();
        
        // Verificar si la base de datos está disponible
        if (!database) {
            console.log('⚠️ Base de datos no disponible para fuentes personalizadas, usando fallback');
            return generateFallbackFontFaces(customFonts);
        }
        
        for (const fontName of customFonts) {
            // Buscar archivos de fuente en la base de datos de uploads
            const fontFiles = await database.all(
                `SELECT * FROM uploads WHERE 
                 original_name LIKE ? AND 
                 (mimetype LIKE 'font/%' OR 
                  original_name LIKE '%.ttf' OR 
                  original_name LIKE '%.woff' OR 
                  original_name LIKE '%.woff2' OR 
                  original_name LIKE '%.otf')`,
                [`%${fontName}%`]
            );
            
            if (fontFiles.length > 0) {
                // Generar reglas @font-face para cada archivo encontrado
                fontFiles.forEach(fontFile => {
                    const fontFormat = getFontFormat(fontFile.filename);
                    const fontWeight = getFontWeight(fontFile.original_name);
                    const fontStyle = getFontStyle(fontFile.original_name);
                    
                    fontFaces += `
@font-face {
    font-family: '${fontName}';
    src: url('${fontFile.url}') format('${fontFormat}');
    font-weight: ${fontWeight};
    font-style: ${fontStyle};
    font-display: swap;
}
`;
                });
            } else {
                console.log(`⚠️ Fuente personalizada '${fontName}' no encontrada en uploads, usando fallback`);
                // Generar fallback para fuentes no encontradas
                fontFaces += generateFallbackFontFace(fontName);
            }
        }
        
    } catch (error) {
        console.error('Error generando fuentes personalizadas:', error);
        return generateFallbackFontFaces(customFonts);
    }
    
    return fontFaces;
}

/**
 * Genera fallbacks para fuentes personalizadas no encontradas
 * @param {Array} customFonts - Array de nombres de fuentes personalizadas
 * @returns {string} - CSS con fallbacks
 */
function generateFallbackFontFaces(customFonts) {
    let fallbackCSS = '';
    
    customFonts.forEach(fontName => {
        fallbackCSS += generateFallbackFontFace(fontName);
    });
    
    return fallbackCSS;
}

/**
 * Genera un fallback para una fuente personalizada específica
 * @param {string} fontName - Nombre de la fuente
 * @returns {string} - CSS con fallback
 */
function generateFallbackFontFace(fontName) {
    // Mapeo de fuentes personalizadas a fallbacks apropiados
    const fallbackMap = {
        'Super Sunkissed': 'cursive, "Brush Script MT", "Comic Sans MS", fantasy',
        'Ewert': 'serif, "Times New Roman", Georgia',
        // Agregar más fallbacks según sea necesario
    };
    
    const fallback = fallbackMap[fontName] || 'sans-serif, Arial, Helvetica';
    
    return `
/* Fallback para fuente personalizada: ${fontName} */
@font-face {
    font-family: '${fontName}';
    src: local('${fontName}'), local('${fontName.replace(/\s+/g, '-')}');
    font-display: swap;
}

/* Clase de fallback para fuente personalizada: ${fontName} */
.font-${fontName.replace(/\s+/g, '-').toLowerCase()} {
    font-family: "${fontName}", ${fallback} !important;
}
`;
}

/**
 * Genera clases CSS de fallback para fuentes personalizadas
 * @param {Array} customFonts - Array de nombres de fuentes personalizadas
 * @returns {string} - CSS con clases de fallback
 */
function generateFallbackFontClasses(customFonts) {
    if (!customFonts || customFonts.length === 0) {
        return '';
    }
    
    let fallbackClasses = '';
    
    customFonts.forEach(fontName => {
        const fallbackMap = {
            'Super Sunkissed': 'cursive, "Brush Script MT", "Comic Sans MS", fantasy',
            'Ewert': 'serif, "Times New Roman", Georgia',
            // Agregar más fallbacks según sea necesario
        };
        
        const fallback = fallbackMap[fontName] || 'sans-serif, Arial, Helvetica';
        const className = fontName.replace(/\s+/g, '-').toLowerCase();
        
        fallbackClasses += `
/* Clase de fallback para fuente personalizada: ${fontName} */
.font-${className} {
    font-family: "${fontName}", ${fallback} !important;
}
`;
    });
    
    return fallbackClasses;
}

/**
 * Determina el formato de fuente basado en la extensión del archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} - Formato de fuente
 */
function getFontFormat(filename) {
    const ext = path.extname(filename).toLowerCase();
    const formatMap = {
        '.woff2': 'woff2',
        '.woff': 'woff',
        '.ttf': 'truetype',
        '.otf': 'opentype',
        '.eot': 'embedded-opentype'
    };
    return formatMap[ext] || 'truetype';
}

/**
 * Extrae el peso de la fuente del nombre del archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} - Peso de la fuente
 */
function getFontWeight(filename) {
    const name = filename.toLowerCase();
    if (name.includes('bold') || name.includes('700')) return '700';
    if (name.includes('semibold') || name.includes('600')) return '600';
    if (name.includes('medium') || name.includes('500')) return '500';
    if (name.includes('light') || name.includes('300')) return '300';
    if (name.includes('thin') || name.includes('100')) return '100';
    return '400'; // normal
}

/**
 * Extrae el estilo de la fuente del nombre del archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} - Estilo de la fuente
 */
function getFontStyle(filename) {
    const name = filename.toLowerCase();
    if (name.includes('italic') || name.includes('oblique')) return 'italic';
    return 'normal';
}

/**
 * Calcula la corrección vertical necesaria para alinear texto de Polotno con Konva
 * @param {number} fontSize - Tamaño de fuente en píxeles
 * @param {string} fontFamily - Familia de fuente
 * @returns {number} Corrección en píxeles para aplicar a la coordenada Y
 */
function calculateUniversalVerticalCorrection(fontSize, fontFamily = 'Arial') {
    // Métricas tipográficas estándar (basadas en OpenType)
    const fontMetrics = {
        'Arial': { ascent: 0.905, descent: 0.212 },
        'Roboto': { ascent: 0.927, descent: 0.244 },
        'Helvetica': { ascent: 0.932, descent: 0.213 },
        'Times': { ascent: 0.898, descent: 0.218 },
        'Courier': { ascent: 0.829, descent: 0.171 },
        'Anton': { ascent: 0.95, descent: 0.25 },
        'Montserrat': { ascent: 0.92, descent: 0.24 },
        'Montserrat Subrayada': { ascent: 0.92, descent: 0.24 },
        'default': { ascent: 0.9, descent: 0.2 }
    };
    
    const metrics = fontMetrics[fontFamily] || fontMetrics['default'];
    const totalHeight = (metrics.ascent + metrics.descent) * fontSize;
    const baselineOffset = metrics.ascent * fontSize;
    const geometricCenter = totalHeight / 2;
    
    // Corrección ajustada: mover el texto hacia abajo para alineación perfecta
    // Aplicamos una corrección negativa del 50% para bajar el texto al máximo
    const correction = -(geometricCenter - baselineOffset) * 0.55;
    return correction;
}

/**
 * Renderiza un diseño JSON usando la funcionalidad nativa de Konva
 * @param {Object} designData - El JSON del diseño de Polotno
 * @param {string} designName - Nombre del diseño
 * @returns {string} HTML completo con Konva integrado
 */
async function renderWithKonva(designData, designName) {
    // Extraer fuentes únicas del diseño
    const fontData = extractUniqueFonts(designData);
    const googleFontsLinks = generateGoogleFontsLinks(fontData.googleFonts);
    const customFontFaces = await generateCustomFontFaces(fontData.customFonts);
    
    // Generar clases CSS de fallback para fuentes personalizadas
    const fallbackFontClasses = generateFallbackFontClasses(fontData.customFonts);
    
    // Convertir el JSON de Polotno al formato que espera Konva.Node.create()
    const firstPage = designData.pages[0];
    const konvaStage = {
        attrs: {
            width: designData.width,
            height: designData.height
        },
        className: 'Stage',
        children: [{
            attrs: {},
            className: 'Layer',
            children: firstPage.children.map(child => {
                // Convertir cada elemento de Polotno a formato Konva
                const konvaChild = {
                    attrs: {
                        x: child.x || 0,
                        y: child.y || 0,
                        width: child.width || 100,
                        height: child.height || 100,
                        rotation: (child.rotation || 0) * Math.PI / 180, // Convertir a radianes
                        opacity: child.opacity !== undefined ? child.opacity : 1,
                        visible: child.visible !== undefined ? child.visible : true,
                        // Transformaciones de escala
                        scaleX: child.scaleX !== undefined ? child.scaleX : 1,
                        scaleY: child.scaleY !== undefined ? child.scaleY : 1,
                        // Transformaciones de sesgo (skew)
                        skewX: child.skewX !== undefined ? child.skewX : 0,
                        skewY: child.skewY !== undefined ? child.skewY : 0,
                        // Transformaciones de volteo (flip)
                        // En Konva, el flip se maneja con escalas negativas
                        ...(child.flipX && { scaleX: (child.scaleX !== undefined ? child.scaleX : 1) * -1 }),
                        ...(child.flipY && { scaleY: (child.scaleY !== undefined ? child.scaleY : 1) * -1 })
                    }
                };
                
                // Solo aplicar stroke si strokeWidth > 0
                if (child.strokeWidth && child.strokeWidth > 0) {
                    konvaChild.attrs.stroke = child.stroke || '#000000';
                    konvaChild.attrs.strokeWidth = child.strokeWidth;
                }
                
                // Determinar el tipo de elemento Konva basado en el tipo de Polotno
                switch (child.type) {
                    case 'text':
                        konvaChild.className = 'Text';
                        konvaChild.attrs.text = child.text || '';
                        konvaChild.attrs.fontSize = child.fontSize || 16;
                        konvaChild.attrs.fontFamily = child.fontFamily || 'Arial';
                        konvaChild.attrs.fill = child.fill || '#000000';
                        konvaChild.attrs.align = child.align || 'left';
                        
                        // APLICAR CORRECCIÓN VERTICAL AQUÍ
                        konvaChild.attrs.y = (child.y || 0) + calculateUniversalVerticalCorrection(
                            child.fontSize || 16, 
                            child.fontFamily || 'Arial'
                        );
                        
                        // Mapear fontWeight='bold' a fontStyle='bold' para Konva
                        if (child.fontWeight === 'bold') {
                            konvaChild.attrs.fontStyle = 'bold';
                        }
                        
                        // Aplicar clase CSS de fallback para fuentes personalizadas
                        const fontFamily = child.fontFamily || 'Arial';
                        if (fontData.customFonts && fontData.customFonts.includes(fontFamily)) {
                            const className = fontFamily.replace(/\s+/g, '-').toLowerCase();
                            konvaChild.attrs.className = `font-${className}`;
                        }
                        
                        // POSICIONAMIENTO CORRECTO: Usar coordenadas originales de Polotno
                        // Konva maneja automáticamente el centrado cuando align="center"
                        // NO se debe modificar la posición X para texto centrado
                        break;
                        
                    case 'image':
                        konvaChild.className = 'Image';
                        // Nota: Las imágenes necesitan ser cargadas por separado
                        if (child.src) {
                            konvaChild.attrs.src = child.src;
                        }
                        break;
                        

                        
                    case 'svg':
                        // Para elementos SVG, usar un grupo con el contenido SVG
                        konvaChild.className = 'Group';
                        // Nota: En una implementación real, necesitarías parsear el SVG
                        // Por ahora, creamos un rectángulo como placeholder
                        konvaChild.children = [{
                            className: 'Rect',
                            attrs: {
                                x: 0,
                                y: 0,
                                width: child.width || 100,
                                height: child.height || 100,
                                fill: child.fill || '#cccccc',
                                stroke: child.stroke || '#000000',
                                strokeWidth: child.strokeWidth || 1
                            }
                        }];
                        break;
                        
                    default:
                        konvaChild.className = 'Rect';
                        konvaChild.attrs.fill = '#cccccc';
                }
                
                return konvaChild;
            })
        }]
    };
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diseño ${designName} - Konva</title>
    ${googleFontsLinks}
    <script src="https://unpkg.com/konva@9/konva.min.js"></script>
    <style>
        ${customFontFaces}
        ${fallbackFontClasses}
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }
        .info {
            text-align: center;
            margin: 20px 0;
            color: #666;
            background: white;
            padding: 10px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #canvas-container {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="info">
        <h2>Diseño ${designName} - Konva Native</h2>
        <p>Dimensiones: ${designData.width}x${designData.height}px</p>
    </div>
    
    <div id="canvas-container"></div>
    
    <script>
        // JSON del diseño en formato Konva
        const konvaJson = ${JSON.stringify(JSON.stringify(konvaStage))};
        
        console.log('Creando stage con JSON:', konvaJson);
        
        try {
            // Crear el stage usando Konva.Node.create()
            const stage = Konva.Node.create(konvaJson, 'canvas-container');
            console.log('Stage creado exitosamente:', stage);
            
            // Manejar la carga de imágenes si es necesario
            const images = stage.find('Image');
            images.forEach(imageNode => {
                const src = imageNode.getAttr('src');
                if (src) {
                    const img = new Image();
                    img.onload = () => {
                        imageNode.image(img);
                        stage.batchDraw();
                    };
                    img.src = src;
                }
            });
            
        } catch (error) {
            console.error('Error al crear el stage:', error);
            document.getElementById('canvas-container').innerHTML = 
                '<p style="color: red;">Error: ' + error.message + '</p>';
        }
    </script>
</body>
</html>`;
}

/**
 * Genera un archivo HTML usando Konva nativo para un diseño específico
 * @param {number} designId - ID del diseño en la base de datos
 * @param {string} outputPath - Ruta donde guardar el archivo HTML
 */
async function generateKonvaHtml(designId, outputPath) {
  const { db, initialize } = require('../config/database');
  
  try {
    await initialize();
    const database = db();
    
    const design = await database.get('SELECT * FROM designs WHERE id = ?', [designId]);
    
    if (!design) {
      throw new Error(`Diseño con ID ${designId} no encontrado`);
    }
    
    const jsonData = JSON.parse(design.content);
    const html = await renderWithKonva(jsonData, `design-${designId}-container`);
    
    fs.writeFileSync(outputPath, html);
    
    return {
      success: true,
      designName: design.name,
      outputPath,
      fileSize: html.length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  renderWithKonva,
  generateKonvaHtml
};