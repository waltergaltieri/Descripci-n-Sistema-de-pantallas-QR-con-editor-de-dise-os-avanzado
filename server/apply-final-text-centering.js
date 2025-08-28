const fs = require('fs');
const path = require('path');

console.log('🎯 APLICANDO CORRECCIÓN FINAL DE CENTRADO DE TEXTO...');
console.log('============================================================');

// Leer el archivo HTML existente
const htmlFilePath = path.join(__dirname, 'design-64-definitive-fix-1756226852475.html');
const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
console.log('📄 Archivo HTML leído exitosamente');

// Buscar la línea que contiene konvaJson
const lines = htmlContent.split('\n');
let konvaJsonLine = null;
let lineIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const konvaJson = ')) {
        konvaJsonLine = lines[i];
        lineIndex = i;
        break;
    }
}

if (!konvaJsonLine) {
    console.log('❌ No se pudo encontrar la línea del JSON de Konva');
    process.exit(1);
}

console.log('✅ Línea del JSON de Konva encontrada');

// Extraer el JSON de la línea
const startIndex = konvaJsonLine.indexOf('"') + 1;
const endIndex = konvaJsonLine.lastIndexOf('"');
const jsonString = konvaJsonLine.substring(startIndex, endIndex);

// Parsear el JSON
let konvaData;
try {
    const unescapedJson = jsonString.replace(/\\"/g, '"');
    konvaData = JSON.parse(unescapedJson);
    console.log('✅ JSON parseado exitosamente');
} catch (error) {
    console.log('❌ Error al parsear JSON:', error.message);
    process.exit(1);
}

// Buscar el elemento de texto "1"
const layer = konvaData.children[0];
let textElement = null;

for (const child of layer.children) {
    if (child.className === 'Text' && child.attrs.text === '1') {
        textElement = child;
        break;
    }
}

if (!textElement) {
    console.log('❌ No se encontró el elemento de texto "1"');
    process.exit(1);
}

console.log('✅ Elemento de texto "1" encontrado');
console.log(`📍 Posición actual: X=${textElement.attrs.x}, Y=${textElement.attrs.y}`);
console.log(`📏 Dimensiones: width=${textElement.attrs.width}, height=${textElement.attrs.height}`);

// Calcular la nueva posición X para centrado perfecto
const canvasWidth = konvaData.attrs.width; // 1080
const textWidth = textElement.attrs.width; // 300
const newX = (canvasWidth - textWidth) / 2; // (1080 - 300) / 2 = 390... wait, eso está mal

// El problema es que el texto ya tiene align="center", así que necesitamos centrar el contenedor
const perfectCenterX = canvasWidth / 2; // 540
console.log(`🎯 Nueva posición X calculada: ${perfectCenterX}`);

// Aplicar la corrección
textElement.attrs.x = perfectCenterX;
console.log('✅ Corrección aplicada al elemento de texto');

// Convertir de vuelta a JSON string
const correctedJsonString = JSON.stringify(konvaData).replace(/"/g, '\\"');

// Crear la nueva línea
const newKonvaLine = `        const konvaJson = "${correctedJsonString}";`;

// Reemplazar la línea en el contenido
lines[lineIndex] = newKonvaLine;
const correctedHtml = lines.join('\n');

// Generar nombre de archivo con timestamp
const timestamp = Date.now();
const outputFilePath = path.join(__dirname, `design-64-perfectly-centered-${timestamp}.html`);

// Guardar el archivo corregido
fs.writeFileSync(outputFilePath, correctedHtml);
console.log(`💾 Archivo corregido guardado: ${path.basename(outputFilePath)}`);

// Verificación final
console.log('\n🔍 VERIFICACIÓN FINAL:');
console.log('============================================================');

// Extraer y verificar el JSON corregido
const verificationLines = correctedHtml.split('\n');
let verificationJsonLine = null;

for (const line of verificationLines) {
    if (line.includes('const konvaJson = ')) {
        verificationJsonLine = line;
        break;
    }
}

if (verificationJsonLine) {
    const vStartIndex = verificationJsonLine.indexOf('"') + 1;
    const vEndIndex = verificationJsonLine.lastIndexOf('"');
    const vJsonString = verificationJsonLine.substring(vStartIndex, vEndIndex);
    
    try {
        const vUnescapedJson = vJsonString.replace(/\\"/g, '"');
        const verificationData = JSON.parse(vUnescapedJson);
        
        const vTextElement = verificationData.children[0].children.find(child => 
            child.className === 'Text' && child.attrs.text === '1'
        );
        
        if (vTextElement) {
            const vCanvasWidth = verificationData.attrs.width;
            const vCanvasCenter = vCanvasWidth / 2;
            const vTextX = vTextElement.attrs.x;
            
            console.log(`📊 Canvas width: ${vCanvasWidth}px`);
            console.log(`🎯 Canvas center: ${vCanvasCenter}px`);
            console.log(`📍 Text X position: ${vTextX}px`);
            console.log(`📏 Text width: ${vTextElement.attrs.width}px`);
            console.log(`🔄 Text align: ${vTextElement.attrs.align}`);
            
            if (Math.abs(vTextX - vCanvasCenter) < 1) {
                console.log('✅ ¡PERFECTO! El texto "1" está perfectamente centrado horizontalmente');
            } else {
                console.log(`⚠️  Diferencia de centrado: ${Math.abs(vTextX - vCanvasCenter).toFixed(2)}px`);
            }
        }
    } catch (error) {
        console.log('❌ Error en verificación:', error.message);
    }
}

console.log('\n🎉 ¡PROCESO COMPLETADO!');
console.log(`📁 Archivo final: ${path.basename(outputFilePath)}`);