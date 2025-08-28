const fs = require('fs');
const path = require('path');
const { generateKonvaHtml } = require('./utils/konvaRenderer.js');

console.log('🚀 APLICANDO SOLUCIÓN DE CORRECCIÓN VERTICAL...');

// Función de corrección vertical
const correctionFunction = `
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
        'Helvetica': { ascent: 0.932, descent: 0.213 },
        'Times': { ascent: 0.898, descent: 0.218 },
        'Courier': { ascent: 0.829, descent: 0.171 },
        'default': { ascent: 0.9, descent: 0.2 }
    };
    
    const metrics = fontMetrics[fontFamily] || fontMetrics['default'];
    const totalHeight = (metrics.ascent + metrics.descent) * fontSize;
    const baselineOffset = metrics.ascent * fontSize;
    const geometricCenter = totalHeight / 2;
    
    // Corrección: diferencia entre centro geométrico y baseline
    return geometricCenter - baselineOffset;
}
`;

// Leer konvaRenderer.js
const rendererPath = path.join(__dirname, 'utils', 'konvaRenderer.js');
let content = fs.readFileSync(rendererPath, 'utf8');

// Agregar función si no existe
if (!content.includes('calculateUniversalVerticalCorrection')) {
    const insertPoint = content.indexOf('/**\n * Renderiza un diseño');
    content = content.slice(0, insertPoint) + correctionFunction + '\n' + content.slice(insertPoint);
}

// Modificar case 'text' para aplicar corrección
const textCaseRegex = /(case 'text':[\s\S]*?konvaChild\.attrs\.align = child\.align \|\| 'left';)/;
const match = content.match(textCaseRegex);

if (match) {
    const replacement = match[1] + `
                        
                        // APLICAR CORRECCIÓN VERTICAL AQUÍ
                        konvaChild.attrs.y = (child.y || 0) + calculateUniversalVerticalCorrection(
                            child.fontSize || 16, 
                            child.fontFamily || 'Arial'
                        );`;
    
    content = content.replace(match[1], replacement);
}

// Escribir archivo modificado
fs.writeFileSync(rendererPath, content);
console.log('✅ FUNCIÓN APLICADA A konvaRenderer.js');

// Regenerar HTML
async function regenerateHTML() {
    try {
        const timestamp = Date.now();
        
        // Regenerar diseño 64
        const output64 = `design-64-VERTICAL-FIXED-${timestamp}.html`;
        await generateKonvaHtml(64, output64);
        console.log(`✅ DISEÑO 64 REGENERADO: ${output64}`);
        
        // Regenerar diseño 62
        const output62 = `design-62-VERTICAL-FIXED-${timestamp}.html`;
        await generateKonvaHtml(62, output62);
        console.log(`✅ DISEÑO 62 REGENERADO: ${output62}`);
        
        console.log('🎉 SOLUCIÓN APLICADA COMPLETAMENTE!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

regenerateHTML();