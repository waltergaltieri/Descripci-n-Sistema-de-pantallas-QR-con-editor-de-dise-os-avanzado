const fs = require('fs');
const path = require('path');
const { db } = require('../config/database');
const { 
  generateAnimationKeyframes, 
  generateContinuousAnimations,
  extractAnimations, 
  generateAnimationCSS
} = require('./animationsEngine');

/**
 * Obtiene los SVGs separados de un diseño desde la base de datos
 * @param {number} designId - ID del diseño
 * @returns {Promise<Array>} - Array de SVGs o array vacío si no hay
 */
async function getSeparatedSvgs(designId) {
    try {
        const design = await db().get(
            'SELECT separated_svgs FROM designs WHERE id = ?',
            [designId]
        );

        if (!design || !design.separated_svgs) {
            return [];
        }
        
        return JSON.parse(design.separated_svgs);
    } catch (error) {
        console.error('Error obteniendo SVGs separados:', error);
        return [];
    }
}

function collectElements(elements, collected = []) {
    if (!Array.isArray(elements)) {
        return collected;
    }

    elements.forEach(element => {
        if (!element) {
            return;
        }

        collected.push(element);

        if (Array.isArray(element.children) && element.children.length > 0) {
            collectElements(element.children, collected);
        }
    });

    return collected;
}

function normalizeFontWeight(fontWeight) {
    switch (fontWeight) {
        case 'normal':
            return '400';
        case 'bold':
            return '700';
        case 'lighter':
            return '300';
        case '100':
        case '200':
        case '300':
        case '400':
        case '500':
        case '600':
        case '700':
        case '800':
        case '900':
            return fontWeight;
        default:
            return '400';
    }
}

function sortGoogleFontVariantEntries(a, b) {
    const [italicA, weightA] = a.split(',').map(Number);
    const [italicB, weightB] = b.split(',').map(Number);

    if (italicA !== italicB) {
        return italicA - italicB;
    }

    return weightA - weightB;
}

function buildGoogleFontQuery(fontToken, variants) {
    const requests = new Set();
    let hasItalic = false;

    variants.forEach(variant => {
        const normalizedWeight = normalizeFontWeight(variant.weight);
        const isItalic = variant.style === 'italic';

        requests.add(`0,${normalizedWeight}`);
        if (isItalic) {
            requests.add(`1,${normalizedWeight}`);
            hasItalic = true;
        }
    });

    requests.add('0,400');
    requests.add('0,700');

    if (hasItalic) {
        requests.add('1,400');
        requests.add('1,700');
        return `${fontToken}:ital,wght@${Array.from(requests).sort(sortGoogleFontVariantEntries).join(';')}`;
    }

    const weights = Array.from(requests)
        .map(entry => entry.split(',')[1])
        .sort((a, b) => Number(a) - Number(b));

    return `${fontToken}:wght@${weights.join(';')}`;
}

function getSvgDimensions(svgContent) {
    const viewBoxMatch = svgContent.match(/viewBox="[^"]*?(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)"/i);
    if (viewBoxMatch) {
        return {
            width: Number.parseFloat(viewBoxMatch[3]),
            height: Number.parseFloat(viewBoxMatch[4])
        };
    }

    const widthMatch = svgContent.match(/\bwidth="(-?\d+(?:\.\d+)?)"/i);
    const heightMatch = svgContent.match(/\bheight="(-?\d+(?:\.\d+)?)"/i);

    if (widthMatch && heightMatch) {
        return {
            width: Number.parseFloat(widthMatch[1]),
            height: Number.parseFloat(heightMatch[1])
        };
    }

    return null;
}

function sanitizeSvgForImageEmbedding(svgContent) {
    if (typeof svgContent !== 'string' || !svgContent.includes('transform:')) {
        return svgContent;
    }

    const dimensions = getSvgDimensions(svgContent);
    if (!dimensions) {
        return svgContent;
    }

    return svgContent.replace(/<g([^>]*?)style="([^"]*?)"([^>]*)>/gi, (match, before, styleValue, after) => {
        const transformMatch = styleValue.match(/transform\s*:\s*([^;]+)/i);
        const flipX = transformMatch ? /scaleX\(\s*-1\s*\)/i.test(transformMatch[1]) : false;
        const flipY = transformMatch ? /scaleY\(\s*-1\s*\)/i.test(transformMatch[1]) : false;

        const cleanedStyle = styleValue
            .split(';')
            .map(part => part.trim())
            .filter(part => part && !part.toLowerCase().startsWith('transform'))
            .join('; ');

        let nextAttributes = `${before}${cleanedStyle ? ` style="${cleanedStyle};"` : ''}${after}`;

        if (!flipX && !flipY) {
            return `<g${nextAttributes}>`;
        }

        const translateX = flipX ? dimensions.width : 0;
        const translateY = flipY ? dimensions.height : 0;
        const scaleX = flipX ? -1 : 1;
        const scaleY = flipY ? -1 : 1;
        const svgTransform = `translate(${translateX} ${translateY}) scale(${scaleX} ${scaleY})`;

        if (/\btransform="/i.test(nextAttributes)) {
            nextAttributes = nextAttributes.replace(/\btransform="([^"]*)"/i, (_, currentTransform) => {
                return `transform="${`${currentTransform} ${svgTransform}`.trim()}"`;
            });
        } else {
            nextAttributes += ` transform="${svgTransform}"`;
        }

        return `<g${nextAttributes}>`;
    });
}

/**
 * Extrae las fuentes únicas utilizadas en el diseño
 * @param {Object} designData - Datos del diseño
 * @returns {Object} - Objeto con fuentes de Google y personalizadas
 */
function extractUniqueFonts(designData) {
    const fontVariants = new Map(); // Mapa para almacenar fuentes con sus variantes
    
    designData.pages.forEach(page => {
        collectElements(page.children || []).forEach(element => {
            if (element.type === 'text' && element.fontFamily) {
                const fontFamily = element.fontFamily;
                const fontWeight = element.fontWeight || 'normal';
                const fontStyle = element.fontStyle || 'normal';
                
                // Crear clave única para la variante de fuente
                
                if (!fontVariants.has(fontFamily)) {
                    fontVariants.set(fontFamily, new Set());
                }
                
                // Agregar la variante específica
                fontVariants.get(fontFamily).add({ weight: fontWeight, style: fontStyle });
            }
        });
    });
    
    const googleFonts = [];
    const customFonts = [];
    const fontFamilies = [];
    
    // Mapeo de nombres comunes a nombres de Google Fonts
    const googleFontMap = {
        'Open Sans': 'Open+Sans',
        'Roboto': 'Roboto',
        'Lato': 'Lato',
        'Montserrat': 'Montserrat',
        'Source Sans Pro': 'Source+Sans+Pro',
        'Oswald': 'Oswald',
        'Raleway': 'Raleway',
        'PT Sans': 'PT+Sans',
        'Inter': 'Inter',
        'Anton': 'Anton',
        'Poppins': 'Poppins',
        'Nunito': 'Nunito',
        'Playfair Display': 'Playfair+Display',
        'Merriweather': 'Merriweather',
        'Ubuntu': 'Ubuntu',
        'Fira Sans': 'Fira+Sans',
        'Noto Sans': 'Noto+Sans',
        'Work Sans': 'Work+Sans',
        'Crimson Text': 'Crimson+Text',
        'Libre Baskerville': 'Libre+Baskerville',
        'Dancing Script': 'Dancing+Script',
        'Pacifico': 'Pacifico',
        'Lobster': 'Lobster',
        'Comfortaa': 'Comfortaa',
        'Quicksand': 'Quicksand',
        'Rubik': 'Rubik',
        'Barlow': 'Barlow',
        'Oxygen': 'Oxygen',
        'Cabin': 'Cabin',
        'Karla': 'Karla',
        'Bitter': 'Bitter',
        'Arvo': 'Arvo',
        'Dosis': 'Dosis',
        'Titillium Web': 'Titillium+Web',
        'Exo': 'Exo',
        'Fjalla One': 'Fjalla+One',
        'Abril Fatface': 'Abril+Fatface',
        'Righteous': 'Righteous',
        'Fredoka One': 'Fredoka+One',
        'Bangers': 'Bangers',
        'Creepster': 'Creepster',
        'Shadows Into Light': 'Shadows+Into+Light',
        'Bahiana': 'Bahiana'
    };
    
    fontVariants.forEach((variants, fontFamily) => {
        fontFamilies.push(fontFamily);

        if (isSystemFont(fontFamily)) {
            // No necesitamos cargar fuentes del sistema
            return;
        }
        
        if (googleFontMap[fontFamily]) {
            googleFonts.push(buildGoogleFontQuery(googleFontMap[fontFamily], variants));
            return;

            // Construir string de pesos para Google Fonts
            const weights = new Set();
            variants.forEach(variant => {
                let weight = '400'; // peso normal por defecto
                
                // Mapear fontWeight a números
                switch(variant.weight) {
                    case 'normal': weight = '400'; break;
                    case 'bold': weight = '700'; break;
                    case 'lighter': weight = '300'; break;
                    case '100': case '200': case '300': case '400': 
                    case '500': case '600': case '700': case '800': case '900':
                        weight = variant.weight; break;
                    default: weight = '400';
                }
                
                // Agregar peso normal y bold si se necesita italic
                if (variant.style === 'italic') {
                    weights.add(weight);
                    weights.add(weight + 'i'); // Agregar versión itálica
                } else {
                    weights.add(weight);
                }
            });
            
            // Siempre incluir pesos básicos para asegurar compatibilidad
            weights.add('400'); // normal
            weights.add('700'); // bold
            
            const fontString = `${googleFontMap[fontFamily]}:wght@${Array.from(weights).sort().join(';')}`;
            googleFonts.push(fontString);
        } else {
            customFonts.push(fontFamily);
        }
    });
    
    return {
        googleFonts: [...new Set(googleFonts)],
        customFonts: [...new Set(customFonts)],
        fontFamilies: [...new Set(fontFamilies)]
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
    
    // Unir las fuentes con sus pesos específicos
    const fontsQuery = googleFonts.join('&family=');
    const fullFontsUrl = `family=${fontsQuery}&display=swap`;
    
    return `
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?${fullFontsUrl}" rel="stylesheet">
    
    <!-- Preload Google Fonts for better performance -->
    <link rel="preload" href="https://fonts.googleapis.com/css2?${fullFontsUrl}" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript>
        <link href="https://fonts.googleapis.com/css2?${fullFontsUrl}" rel="stylesheet">
    </noscript>
    
    <!-- Font Display Optimization -->
    <style>
        @import url('https://fonts.googleapis.com/css2?${fullFontsUrl}');
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
                
                if (fontFiles.length > 0) {
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
                } else {
                    // Si no se encuentran archivos, generar fallbacks básicos
                    fontFaces += `
        @font-face {
            font-family: '${fontName}';
            src: local('${fontName}'), local('${fontName.replace(/\s+/g, '-')}');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }
        @font-face {
            font-family: '${fontName}';
            src: local('${fontName} Bold'), local('${fontName.replace(/\s+/g, '-')}-Bold');
            font-weight: bold;
            font-style: normal;
            font-display: swap;
        }
        @font-face {
            font-family: '${fontName}';
            src: local('${fontName} Italic'), local('${fontName.replace(/\s+/g, '-')}-Italic');
            font-weight: normal;
            font-style: italic;
            font-display: swap;
        }
        @font-face {
            font-family: '${fontName}';
            src: local('${fontName} Bold Italic'), local('${fontName.replace(/\s+/g, '-')}-BoldItalic');
            font-weight: bold;
            font-style: italic;
            font-display: swap;
        }`;
                }
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
    
    // Detectar pesos específicos por número
    if (lower.includes('100') || lower.includes('thin')) return '100';
    if (lower.includes('200') || lower.includes('extralight')) return '200';
    if (lower.includes('300') || lower.includes('light')) return '300';
    if (lower.includes('400') || lower.includes('regular')) return '400';
    if (lower.includes('500') || lower.includes('medium')) return '500';
    if (lower.includes('600') || lower.includes('semibold') || lower.includes('semi-bold')) return '600';
    if (lower.includes('700') || lower.includes('bold')) return '700';
    if (lower.includes('800') || lower.includes('extrabold') || lower.includes('extra-bold')) return '800';
    if (lower.includes('900') || lower.includes('black') || lower.includes('heavy')) return '900';
    
    // Detectar variantes comunes
    if (lower.includes('bold')) return '700';
    if (lower.includes('light')) return '300';
    
    return '400'; // normal
}

/**
 * Determina el estilo de fuente basado en el nombre del archivo
 * @param {string} filename - Nombre del archivo de fuente
 * @returns {string} - Estilo de fuente
 */
function getFontStyle(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes('italic') || lower.includes('oblique') || lower.includes('slant')) return 'italic';
    return 'normal';
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
    const sanitizedSeparatedSvgs = separatedSvgs.map(svg => ({
        ...svg,
        svgData: sanitizeSvgForImageEmbedding(svg.svgData)
    }));
    
    // Extraer animaciones del diseño
    const animations = extractAnimations(designData);
    console.log('🎬 Animaciones extraídas:', animations.length);
    
    // Extraer fuentes únicas del diseño
    const fontData = extractUniqueFonts(designData);
    console.log('🔤 Fuentes extraídas:', fontData);
    
    const googleFontsLinks = generateGoogleFontsLinks(fontData.googleFonts);
    console.log('🌐 Google Fonts Links generados:', googleFontsLinks.length, 'caracteres');
    
    const customFontFaces = await generateCustomFontFaces(fontData.customFonts);
    console.log('📝 Custom Font Faces generados:', customFontFaces.length, 'caracteres');
    
    // Generar clases CSS de fallback para fuentes personalizadas
    const fallbackFontClasses = generateFallbackFontClasses(fontData.customFonts);
    console.log('🔄 Fallback Font Classes generados:', fallbackFontClasses.length, 'caracteres');
    
    // Debug: Mostrar contenido de las fuentes si están vacías
    if (googleFontsLinks.length === 0 && customFontFaces.length === 0) {
        console.log('⚠️ No se generaron fuentes. Datos del diseño:', JSON.stringify(designData, null, 2).substring(0, 1000));
    }
    
    // Convertir el JSON de Polotno al formato que espera Konva.Node.create()
    const firstPage = designData.pages[0];
    
    // Obtener el color de fondo del diseño
    const backgroundValue = firstPage.background || '#ffffff';
    
    // Determinar si es una imagen o un color
    const isImageBackground = backgroundValue.startsWith('http');
    const canvasBackgroundStyle = isImageBackground 
        ? `url('${backgroundValue}') center/cover no-repeat` 
        : backgroundValue;
    
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
                        const correspondingSvg = sanitizedSeparatedSvgs[svgIndex];
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
                                    isSvgElement: true,
                                    elementId: child.id // Agregar ID para animaciones
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
                                fontWeight: child.fontWeight || 'normal',
                                fontStyle: child.fontStyle || 'normal',
                                textDecoration: child.textDecoration || 'none',
                                fill: child.fill || '#000000',
                                align: child.align || 'left',
                                width: child.width,
                                height: child.height,
                                rotation: child.rotation || 0,
                                scaleX: child.scaleX || 1,
                                scaleY: child.scaleY || 1,
                                opacity: child.opacity !== undefined ? child.opacity : 1,
                                elementId: child.id // Agregar ID para animaciones
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
                                src: child.src,
                                elementId: child.id // Agregar ID para animaciones
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
        const correspondingSvg = sanitizedSeparatedSvgs[index];
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
    <script src="/konva-animations.js"></script>
    <style>
        ${customFontFaces}
        ${fallbackFontClasses}
        
        /* Keyframes de animaciones */
        ${generateAnimationKeyframes()}
        ${generateContinuousAnimations()}
        
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
            background: ${canvasBackgroundStyle};
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        /* Asegurar que los elementos con font-weight se rendericen correctamente */
        .konvajs-content * {
            font-synthesis: weight style;
        }
        
        /* Clases de utilidad para pesos de fuente */
        .font-weight-100 { font-weight: 100 !important; }
        .font-weight-200 { font-weight: 200 !important; }
        .font-weight-300 { font-weight: 300 !important; }
        .font-weight-400 { font-weight: 400 !important; }
        .font-weight-500 { font-weight: 500 !important; }
        .font-weight-600 { font-weight: 600 !important; }
        .font-weight-700 { font-weight: 700 !important; }
        .font-weight-800 { font-weight: 800 !important; }
        .font-weight-900 { font-weight: 900 !important; }
        .font-weight-bold { font-weight: bold !important; }
        .font-weight-normal { font-weight: normal !important; }
        
        /* Clases de utilidad para estilos de fuente */
        .font-style-normal { font-style: normal !important; }
        .font-style-italic { font-style: italic !important; }
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
            ${sanitizedSeparatedSvgs.map((svg, index) => `"svg_${index}": ${JSON.stringify(svg.svgData)}`).join(',\n            ')}
        };
        const fontFamilies = ${JSON.stringify(fontData.fontFamilies || [])};
        
        console.log('Creando stage con JSON:', konvaJson);
        console.log('SVGs disponibles:', Object.keys(svgData).length);
        
        // Declarar stage globalmente para que esté disponible en animaciones
        var stage;
        
        try {
            // Crear el stage usando Konva.Node.create()
            stage = Konva.Node.create(konvaJson, 'canvas-container');
            console.log('Stage creado exitosamente:', stage);
            
            // Hacer el stage accesible globalmente
            window.konvaStage = stage;
            
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
            
            // Aplicar propiedades de fuente a elementos de texto y agregar data-element-id
            const textNodes = stage.find('Text');
            console.log('📝 Elementos de texto encontrados:', textNodes.length);
            
            textNodes.forEach(textNode => {
                const fontWeight = textNode.getAttr('fontWeight');
                const fontStyle = textNode.getAttr('fontStyle');
                const fontFamily = textNode.getAttr('fontFamily');
                const elementId = textNode.getAttr('elementId');
                
                console.log('🔤 Texto:', textNode.text().substring(0, 20) + '...', 
                           'Familia:', fontFamily, 
                           'Peso:', fontWeight, 
                           'Estilo:', fontStyle);
                
                // Construir el estilo de fuente completo
                let fullFontStyle = '';
                
                // Agregar peso de fuente
                if (fontWeight && (fontWeight === 'bold' || fontWeight === '700' || fontWeight === 'bolder')) {
                    fullFontStyle += 'bold ';
                } else if (fontWeight && fontWeight !== 'normal' && fontWeight !== '400') {
                    fullFontStyle += fontWeight + ' ';
                }
                
                // Agregar estilo de fuente
                if (fontStyle === 'italic') {
                    fullFontStyle += 'italic ';
                }
                
                // Aplicar el estilo completo o normal si está vacío
                const finalStyle = fullFontStyle.trim() || 'normal';
                textNode.fontStyle(finalStyle);
                
                // Agregar data-element-id al elemento DOM
                if (elementId) {
                    const domElement = textNode.getStage().container().querySelector('canvas').parentElement;
                    if (domElement) {
                        textNode.on('draw', function() {
                            const canvas = textNode.getStage().container().querySelector('canvas');
                            if (canvas && !canvas.hasAttribute('data-element-id-' + elementId)) {
                                canvas.setAttribute('data-element-id-' + elementId, 'true');
                            }
                        });
                    }
                }
                
                console.log('🎨 Estilo aplicado:', finalStyle);
            });
            
            const ensureFontsReady = async () => {
                if (!document.fonts || fontFamilies.length === 0) {
                    return;
                }

                try {
                    await Promise.all(fontFamilies.map(fontFamily =>
                        document.fonts.load('16px "' + fontFamily + '"')
                    ));
                    await document.fonts.ready;
                    stage.batchDraw();
                    console.log('ðŸ”¤ Fuentes listas, stage redibujado');
                } catch (fontError) {
                    console.warn('âš ï¸ No se pudieron precargar todas las fuentes:', fontError);
                }
            };

            ensureFontsReady();

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
        
        // Aplicar animaciones después de que el stage esté listo
        setTimeout(function() {
          if (typeof window.applyKonvaAnimations === 'function' && window.konvaStage) {
            const animationsData = ${JSON.stringify(animations)};
            console.log('🎬 Aplicando animaciones al stage...');
            window.applyKonvaAnimations(window.konvaStage, animationsData);
          } else {
            console.error('❌ No se puede aplicar animaciones:', {
              funcionDisponible: typeof window.applyKonvaAnimations === 'function',
              stageDisponible: !!window.konvaStage
            });
          }
        }, 500);
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
  generateKonvaHtml,
  extractUniqueFonts,
  sanitizeSvgForImageEmbedding
};
