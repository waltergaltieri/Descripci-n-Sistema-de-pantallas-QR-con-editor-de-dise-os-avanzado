const fs = require('fs');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

/**
 * Obtiene los SVGs separados de un diseño desde la base de datos
 * @param {number} designId - ID del diseño
 * @returns {Promise<Array>} - Array de SVGs o array vacío si no hay
 */
async function getSeparatedSvgs(designId) {
    try {
        const db = await open({
            filename: path.join(__dirname, '../database.sqlite'),
            driver: sqlite3.Database
        });
        
        const design = await db.get(
            'SELECT separated_svgs FROM designs WHERE id = ?',
            [designId]
        );
        
        await db.close();
        
        if (!design || !design.separated_svgs) {
            return [];
        }
        
        return JSON.parse(design.separated_svgs);
    } catch (error) {
        console.error('Error obteniendo SVGs separados:', error);
        return [];
    }
}

/**
 * Extrae las fuentes únicas utilizadas en el diseño
 * @param {Object} designData - Datos del diseño
 * @returns {Object} - Objeto con fuentes de Google y personalizadas
 */
function extractUniqueFonts(designData) {
    const fonts = new Set();
    
    designData.pages.forEach(page => {
        page.children.forEach(element => {
            if (element.type === 'text' && element.fontFamily) {
                fonts.add(element.fontFamily);
            }
        });
    });
    
    const googleFonts = [];
    const customFonts = [];
    
    fonts.forEach(font => {
        if (isSystemFont(font)) {
            // No necesitamos cargar fuentes del sistema
            return;
        }
        
        // Mapeo de nombres comunes a nombres de Google Fonts
        const googleFontMap = {
            'Open Sans': 'Open+Sans',
            'Roboto': 'Roboto',
            'Lato': 'Lato',
            'Montserrat': 'Montserrat',
            'Source Sans Pro': 'Source+Sans+Pro',
            'Oswald': 'Oswald',
            'Raleway': 'Raleway',
            'PT Sans': 'PT+Sans'
        };
        
        if (googleFontMap[font]) {
            googleFonts.push(googleFontMap[font]);
        } else {
            customFonts.push(font);
        }
    });
    
    return {
        googleFonts: [...new Set(googleFonts)],
        customFonts: [...new Set(customFonts)]
    };
}

/**
 * Verifica si una fuente es una fuente del sistema
 * @param {string} fontName - Nombre de la fuente
 * @returns {boolean}
 */
function isSystemFont(fontName) {
    const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'];
    return systemFonts.includes(fontName);
}

/**
 * Genera los enlaces de Google Fonts
 * @param {Array} googleFonts - Array de fuentes de Google
 * @returns {string} - HTML con los enlaces de Google Fonts
 */
function generateGoogleFontsLinks(googleFonts) {
    if (googleFonts.length === 0) {
        return '';
    }
    
    const fontsQuery = googleFonts.join('|');
    return `
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=${fontsQuery}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Preload Google Fonts for better performance -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=${fontsQuery}:wght@300;400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link href="https://fonts.googleapis.com/css2?family=${fontsQuery}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    </noscript>
    
    <!-- Font Display Optimization -->
    <style>
        @import url('https://fonts.googleapis.com/css2?family=${fontsQuery}:wght@300;400;500;600;700&display=swap');
    </style>`;
}

/**
 * Genera las declaraciones @font-face para fuentes personalizadas
 * @param {Array} customFonts - Array de fuentes personalizadas
 * @returns {string} - CSS con las declaraciones @font-face
 */
async function generateCustomFontFaces(customFonts) {
    if (customFonts.length === 0) {
        return '';
    }
    
    let fontFaces = '';
    
    for (const fontName of customFonts) {
        try {
            // Buscar archivos de fuente en el directorio de uploads
            const uploadsDir = path.join(__dirname, '../uploads');
            
            if (fs.existsSync(uploadsDir)) {
                const files = fs.readdirSync(uploadsDir);
                const fontFiles = files.filter(file => {
                    const lowerFile = file.toLowerCase();
                    const lowerFont = fontName.toLowerCase().replace(/\s+/g, '');
                    return (lowerFile.includes(lowerFont) || lowerFile.includes(fontName.toLowerCase())) && 
                           (lowerFile.endsWith('.woff2') || lowerFile.endsWith('.woff') || 
                            lowerFile.endsWith('.ttf') || lowerFile.endsWith('.otf'));
                });
                
                fontFiles.forEach(file => {
                    const fontPath = `/uploads/${file}`;
                    const format = getFontFormat(file);
                    const weight = getFontWeight(file);
                    const style = getFontStyle(file);
                    
                    fontFaces += `
        @font-face {
            font-family: '${fontName}';
            src: url('${fontPath}') format('${format}');
            font-weight: ${weight};
            font-style: ${style};
            font-display: swap;
        }`;
                });
            }
        } catch (error) {
            console.warn(`No se pudo cargar la fuente personalizada: ${fontName}`, error);
            
            // Generar fallback font-face
            fontFaces += generateFallbackFontFace(fontName);
        }
    }
    
    return fontFaces;
}

/**
 * Genera declaraciones @font-face de fallback para fuentes personalizadas
 * @param {Array} customFonts - Array de fuentes personalizadas
 * @returns {string} - CSS con las declaraciones @font-face de fallback
 */
function generateFallbackFontFaces(customFonts) {
    return customFonts.map(fontName => generateFallbackFontFace(fontName)).join('');
}

/**
 * Genera una declaración @font-face de fallback para una fuente específica
 * @param {string} fontName - Nombre de la fuente
 * @returns {string} - CSS con la declaración @font-face de fallback
 */
function generateFallbackFontFace(fontName) {
    return `
        @font-face {
            font-family: '${fontName}';
            src: local('Arial'), local('Helvetica'), local('sans-serif');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }
        @font-face {
            font-family: '${fontName}';
            src: local('Arial Bold'), local('Helvetica Bold'), local('sans-serif');
            font-weight: bold;
            font-style: normal;
            font-display: swap;
        }`;
}

/**
 * Genera clases CSS de fallback para fuentes personalizadas
 * @param {Array} customFonts - Array de fuentes personalizadas
 * @returns {string} - CSS con las clases de fallback
 */
function generateFallbackFontClasses(customFonts) {
    if (customFonts.length === 0) {
        return '';
    }
    
    return customFonts.map(fontName => {
        const className = fontName.replace(/\s+/g, '-').toLowerCase();
        return `
        .font-${className} {
            font-family: '${fontName}', Arial, Helvetica, sans-serif;
        }
        .font-${className}-fallback {
            font-family: Arial, Helvetica, sans-serif;
        }`;
    }).join('');
}

/**
 * Determina el formato de fuente basado en la extensión del archivo
 * @param {string} filename - Nombre del archivo de fuente
 * @returns {string} - Formato de fuente
 */
function getFontFormat(filename) {
    const ext = path.extname(filename).toLowerCase();
    switch (ext) {
        case '.woff2': return 'woff2';
        case '.woff': return 'woff';
        case '.ttf': return 'truetype';
        case '.otf': return 'opentype';
        default: return 'truetype';
    }
}

/**
 * Determina el peso de fuente basado en el nombre del archivo
 * @param {string} filename - Nombre del archivo de fuente
 * @returns {string} - Peso de fuente
 */
function getFontWeight(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('bold')) return 'bold';
    if (lower.includes('light')) return '300';
    if (lower.includes('medium')) return '500';
    if (lower.includes('semibold')) return '600';
    if (lower.includes('heavy') || lower.includes('black')) return '900';
    return 'normal';
}

/**
 * Determina el estilo de fuente basado en el nombre del archivo
 * @param {string} filename - Nombre del archivo de fuente
 * @returns {string} - Estilo de fuente
 */
function getFontStyle(filename) {
    const lower = filename.toLowerCase();
    return lower.includes('italic') || lower.includes('oblique') ? 'italic' : 'normal';
}

/**
 * Calcula la corrección vertical universal para el texto
 * @param {number} fontSize - Tamaño de fuente
 * @param {string} fontFamily - Familia de fuente
 * @returns {number} - Corrección vertical en píxeles
 */
function calculateUniversalVerticalCorrection(fontSize, fontFamily = 'Arial') {
    // Métricas de fuente aproximadas para diferentes familias
    const fontMetrics = {
        'Arial': { ascent: 0.9, descent: 0.2 },
        'Helvetica': { ascent: 0.9, descent: 0.2 },
        'Times New Roman': { ascent: 0.85, descent: 0.25 },
        'Georgia': { ascent: 0.85, descent: 0.25 },
        'Verdana': { ascent: 0.92, descent: 0.18 },
        'Trebuchet MS': { ascent: 0.88, descent: 0.22 },
        'Comic Sans MS': { ascent: 0.87, descent: 0.23 },
        'Impact': { ascent: 0.95, descent: 0.15 },
        'Courier New': { ascent: 0.8, descent: 0.3 },
        'Open Sans': { ascent: 0.9, descent: 0.2 },
        'Roboto': { ascent: 0.9, descent: 0.2 },
        'Lato': { ascent: 0.9, descent: 0.2 },
        'Montserrat': { ascent: 0.9, descent: 0.2 },
        'Source Sans Pro': { ascent: 0.9, descent: 0.2 },
        'Oswald': { ascent: 0.92, descent: 0.18 },
        'Raleway': { ascent: 0.9, descent: 0.2 },
        'PT Sans': { ascent: 0.9, descent: 0.2 },
        'default': { ascent: 0.9, descent: 0.2 }
    };
    
    const metrics = fontMetrics[fontFamily] || fontMetrics['default'];
    
    // Calcular la línea base aproximada
    const baseline = fontSize * metrics.ascent;
    
    // La corrección es la diferencia entre la línea base y el centro del texto
    const textCenter = fontSize / 2;
    const correction = baseline - textCenter;
    
    return Math.round(correction * 0.3); // Factor de ajuste empírico
}

/**
 * Renderiza el diseño usando Konva y genera HTML
 * @param {Object} designData - Datos del diseño en formato Polotno
 * @param {string} designName - Nombre del diseño
 * @param {number} designId - ID del diseño (opcional, para obtener SVGs separados)
 * @returns {string} - HTML generado
 */
async function renderWithKonva(designData, designName, designId = null) {
    // Obtener SVGs separados si se proporciona el ID del diseño
    const separatedSvgs = designId ? await getSeparatedSvgs(designId) : [];
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
            children: (() => {
                // Primero, identificar elementos que deben ser reemplazados por SVGs
                const figureTypes = ['figure', 'mask', 'shape', 'rect', 'circle', 'ellipse', 'polygon', 'star', 'line', 'arrow'];
                let svgIndex = 0;
                
                return firstPage.children.map((child, index) => {
                    const isMaskedImage = child.type === 'image' && child.clipSrc && child.clipSrc.trim() !== '';
                    const isEmbeddedSvgImage = child.type === 'image' && child.src && child.src.includes('data:image/svg+xml');
                    
                    if (figureTypes.includes(child.type) || isMaskedImage || isEmbeddedSvgImage) {
                        // Buscar SVG correspondiente usando el índice de SVG actual
                        const correspondingSvg = separatedSvgs[svgIndex];
                        const currentSvgIndex = svgIndex; // Guardar el índice actual antes de incrementar
                        svgIndex++; // Incrementar para el próximo SVG
                        
                        if (correspondingSvg && correspondingSvg.svgData) {
                            console.log(`🎨 Reemplazando elemento ${child.type} en posición ${index} con SVG ${correspondingSvg.filename}`);
                            console.log(`📍 Coordenadas originales: x=${child.x}, y=${child.y}, width=${child.width}, height=${child.height}`);
                            console.log(`🔄 Transformaciones: rotation=${child.rotation}, scaleX=${child.scaleX}, scaleY=${child.scaleY}`);
                            // Crear elemento Group que contendrá el SVG como imagen
                            const svgElement = {
                                attrs: {
                                    x: child.x || 0,
                                    y: child.y || 0,
                                    width: child.width || 100,
                                    height: child.height || 100,
                                    rotation: child.rotation || 0,
                                    scaleX: child.scaleX || 1,
                                    scaleY: child.scaleY || 1,
                                    opacity: child.opacity !== undefined ? child.opacity : 1,
                                    svgId: `svg_${currentSvgIndex}`,
                                    isSvgElement: true
                                },
                                className: 'Group'
                            };
                            return svgElement;
                        } else {
                            console.log(`⚠️ No se encontró SVG para elemento ${child.type} en posición ${index}`);
                            // Si no hay SVG correspondiente, crear placeholder
                            return {
                                attrs: {
                                    x: child.x || 0,
                                    y: child.y || 0,
                                    width: child.width || 100,
                                    height: child.height || 100,
                                    fill: '#f0f0f0',
                                    stroke: '#cccccc',
                                    strokeWidth: 1,
                                    rotation: child.rotation || 0,
                                    scaleX: child.scaleX || 1,
                                    scaleY: child.scaleY || 1,
                                    opacity: child.opacity !== undefined ? child.opacity : 1
                                },
                                className: 'Rect'
                            };
                        }
                    }
                    
                    // Procesar elementos normales (texto, imágenes sin máscara)
                    if (child.type === 'text') {
                        // Calcular corrección vertical
                        const verticalCorrection = calculateUniversalVerticalCorrection(
                            child.fontSize || 16, 
                            child.fontFamily || 'Arial'
                        );
                        
                        return {
                            attrs: {
                                x: child.x || 0,
                                y: (child.y || 0) + verticalCorrection,
                                text: child.text || '',
                                fontSize: child.fontSize || 16,
                                fontFamily: child.fontFamily || 'Arial',
                                fill: child.fill || '#000000',
                                align: child.align || 'left',
                                width: child.width,
                                height: child.height,
                                rotation: child.rotation || 0,
                                scaleX: child.scaleX || 1,
                                scaleY: child.scaleY || 1,
                                opacity: child.opacity !== undefined ? child.opacity : 1
                            },
                            className: 'Text'
                        };
                    } else if (child.type === 'image') {
                        return {
                            attrs: {
                                x: child.x || 0,
                                y: child.y || 0,
                                width: child.width,
                                height: child.height,
                                rotation: child.rotation || 0,
                                scaleX: child.scaleX || 1,
                                scaleY: child.scaleY || 1,
                                opacity: child.opacity !== undefined ? child.opacity : 1,
                                src: child.src
                            },
                            className: 'Image'
                        };
                    } else if (child.type === 'svg') {
                        // Para SVGs, crear un placeholder por ahora
                        return {
                            attrs: {
                                x: child.x || 0,
                                y: child.y || 0,
                                width: child.width,
                                height: child.height,
                                fill: '#cccccc',
                                stroke: '#999999',
                                strokeWidth: 1
                            },
                            className: 'Rect'
                        };
                    }
                    
                    return null;
                }).filter(Boolean);
            })()
        }]
    };
    
    // Contar elementos reemplazados por SVGs
    const figureTypes = ['figure', 'mask', 'shape', 'rect', 'circle', 'ellipse', 'polygon', 'star', 'line', 'arrow'];
    const replacedElements = firstPage.children.filter(child => {
        const isMaskedImage = child.type === 'image' && child.clipSrc && child.clipSrc.trim() !== '';
        const isEmbeddedSvgImage = child.type === 'image' && child.src && child.src.includes('data:image/svg+xml');
        return figureTypes.includes(child.type) || isMaskedImage || isEmbeddedSvgImage;
    });
    
    const replacedElementsComments = replacedElements.map((element, index) => {
        const correspondingSvg = separatedSvgs[index];
        const status = correspondingSvg ? 'reemplazado con SVG' : 'placeholder';
        return `<!-- Elemento ${element.type} - Posición: x=${element.x}, y=${element.y}, rotación=${element.rotation || 0}° - ${status} -->`;
    }).join('\n    ');
    
    console.log(`📊 Estadísticas de reemplazo: ${separatedSvgs.length} SVGs disponibles, ${replacedElements.length} elementos a reemplazar`);

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
        ${replacedElements.length > 0 ? `<p style="color: #4CAF50; font-size: 12px;">Elementos reemplazados con SVGs: ${Math.min(separatedSvgs.length, replacedElements.length)}/${replacedElements.length}</p>` : ''}
        ${separatedSvgs.length > 0 ? `<p style="color: #2196F3; font-size: 12px;">SVGs disponibles: ${separatedSvgs.length}</p>` : ''}
    </div>
    
    ${replacedElementsComments.length > 0 ? replacedElementsComments : '<!-- No hay elementos reemplazados -->'}
    
    <div id="canvas-container"></div>
    
    <script>
        // JSON del diseño en formato Konva
        const konvaJson = ${JSON.stringify(konvaStage)};
        
        // SVGs separados para evitar problemas de escape
        const svgData = {
            ${separatedSvgs.map((svg, index) => `"svg_${index}": ${JSON.stringify(svg.svgData)}`).join(',\n            ')}
        };
        
        console.log('Creando stage con JSON:', konvaJson);
        console.log('SVGs disponibles:', Object.keys(svgData).length);
        
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
            
            // Manejar elementos SVG embebidos (buscar Groups con isSvgElement)
            const allGroups = stage.find('Group');
            const svgElements = allGroups.filter(group => group.getAttr('isSvgElement'));
            console.log('🔍 Elementos SVG encontrados:', svgElements.length);
            
            svgElements.forEach(svgNode => {
                const svgId = svgNode.getAttr('svgId');
                const svgDataContent = svgData[svgId];
                console.log('📋 Procesando SVG:', svgId, 'Datos disponibles:', !!svgDataContent);
                console.log('📍 Posición del Group: x=' + svgNode.x() + ', y=' + svgNode.y() + ', width=' + svgNode.getAttr('width') + ', height=' + svgNode.getAttr('height'));
                console.log('🔄 Transformaciones del Group: rotation=' + svgNode.rotation() + ', scaleX=' + svgNode.scaleX() + ', scaleY=' + svgNode.scaleY());
                
                if (svgDataContent) {
                    // Crear un elemento imagen desde el SVG
                    const img = new Image();
                    img.onload = () => {
                        // Crear un nodo Image y agregarlo al Group
                        const imageNode = new Konva.Image({
                            x: 0, // Relativo al Group (el Group ya tiene las coordenadas correctas)
                            y: 0, // Relativo al Group (el Group ya tiene las coordenadas correctas)
                            width: svgNode.getAttr('width'),
                            height: svgNode.getAttr('height'),
                            image: img,
                            // Mantener las transformaciones del Group padre
                            scaleX: 1,
                            scaleY: 1,
                            rotation: 0 // La rotación se maneja en el Group padre
                        });
                        
                        // Limpiar el Group y agregar la imagen
                        svgNode.destroyChildren();
                        svgNode.add(imageNode);
                        stage.batchDraw();
                    };
                    
                    // Convertir SVG a data URL
                    const svgBlob = new Blob([svgDataContent], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(svgBlob);
                    img.src = url;
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
    const html = await renderWithKonva(jsonData, `design-${designId}-container`, designId);
    
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