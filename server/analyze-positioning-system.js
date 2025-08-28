const fs = require('fs');
const path = require('path');

console.log('🔍 ANÁLISIS DEL SISTEMA DE POSICIONAMIENTO');
console.log('============================================================');

// Analizar el archivo konvaRenderer.js
const rendererPath = path.join(__dirname, 'utils', 'konvaRenderer.js');
const rendererContent = fs.readFileSync(rendererPath, 'utf8');

console.log('📄 Analizando konvaRenderer.js...');
console.log('');

// Buscar todas las líneas que modifican posiciones
const lines = rendererContent.split('\n');
const positioningLines = [];

lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Buscar líneas que asignan coordenadas X o Y
    if (line.includes('.x =') || line.includes('.y =') || 
        line.includes('x:') || line.includes('y:') ||
        line.includes('attrs.x') || line.includes('attrs.y')) {
        positioningLines.push({
            lineNumber: lineNum,
            content: line.trim(),
            type: 'position_assignment'
        });
    }
    
    // Buscar cálculos de posición
    if (line.includes('child.x') || line.includes('child.y') ||
        line.includes('width') || line.includes('height') ||
        line.includes('/ 2') || line.includes('* 2')) {
        positioningLines.push({
            lineNumber: lineNum,
            content: line.trim(),
            type: 'position_calculation'
        });
    }
    
    // Buscar correcciones específicas
    if (line.includes('CORRECCIÓN') || line.includes('Ajustar') ||
        line.includes('center') || line.includes('centrado')) {
        positioningLines.push({
            lineNumber: lineNum,
            content: line.trim(),
            type: 'correction'
        });
    }
});

console.log('🎯 LÍNEAS RELACIONADAS CON POSICIONAMIENTO:');
console.log('============================================================');

positioningLines.forEach(item => {
    const icon = item.type === 'correction' ? '🔧' : 
                 item.type === 'position_calculation' ? '📐' : '📍';
    console.log(`${icon} Línea ${item.lineNumber}: ${item.content}`);
});

console.log('');
console.log('🔍 ANÁLISIS ESPECÍFICO DEL TEXTO:');
console.log('============================================================');

// Buscar específicamente el manejo de texto
const textLines = lines.filter((line, index) => {
    const context = lines.slice(Math.max(0, index - 2), index + 3).join('\n');
    return context.includes("case 'text':") || 
           (line.includes('text') && (line.includes('center') || line.includes('align')));
});

textLines.forEach((line, index) => {
    const originalIndex = lines.indexOf(line);
    console.log(`📝 Línea ${originalIndex + 1}: ${line.trim()}`);
});

console.log('');
console.log('⚠️  PROBLEMAS IDENTIFICADOS:');
console.log('============================================================');

// Identificar la corrección problemática
const problematicCorrection = lines.find((line, index) => {
    return line.includes('child.align === \'center\'') && line.includes('child.width');
});

if (problematicCorrection) {
    const lineIndex = lines.indexOf(problematicCorrection);
    console.log('🚨 CORRECCIÓN PROBLEMÁTICA ENCONTRADA:');
    console.log(`   Línea ${lineIndex + 1}: ${problematicCorrection.trim()}`);
    console.log('');
    console.log('📋 CONTEXTO:');
    for (let i = Math.max(0, lineIndex - 3); i <= Math.min(lines.length - 1, lineIndex + 3); i++) {
        const marker = i === lineIndex ? '>>> ' : '    ';
        console.log(`${marker}${i + 1}: ${lines[i]}`);
    }
    console.log('');
    console.log('🔍 EXPLICACIÓN DEL PROBLEMA:');
    console.log('   Esta corrección está sumando width/2 a la posición X del texto');
    console.log('   cuando align="center", pero esto es INCORRECTO porque:');
    console.log('   ');
    console.log('   1. En Konva, cuando align="center", el texto se centra automáticamente');
    console.log('      dentro del área definida por x, y, width, height');
    console.log('   ');
    console.log('   2. La posición X debe ser la esquina izquierda del área de texto,');
    console.log('      NO el centro del texto');
    console.log('   ');
    console.log('   3. Al sumar width/2, estamos moviendo el área de texto hacia la derecha,');
    console.log('      lo que hace que el texto centrado aparezca más a la derecha de lo debido');
}

console.log('');
console.log('💡 SOLUCIÓN RECOMENDADA:');
console.log('============================================================');
console.log('1. ELIMINAR la corrección que suma width/2 para texto centrado');
console.log('2. Usar las coordenadas originales de Polotno directamente');
console.log('3. Confiar en que Konva maneje el centrado automáticamente');
console.log('');
console.log('📐 FÓRMULA CORRECTA:');
console.log('   Para texto con align="center":');
console.log('   konvaChild.attrs.x = child.x  // SIN modificaciones');
console.log('   konvaChild.attrs.y = child.y  // SIN modificaciones');
console.log('   konvaChild.attrs.width = child.width');
console.log('   konvaChild.attrs.align = "center"');
console.log('');
console.log('🎯 RESULTADO ESPERADO:');
console.log('   El texto se centrará automáticamente dentro del área definida');
console.log('   por (x, y, width, height), coincidiendo con el diseño original');

console.log('');
console.log('✅ ANÁLISIS COMPLETADO');
console.log('============================================================');