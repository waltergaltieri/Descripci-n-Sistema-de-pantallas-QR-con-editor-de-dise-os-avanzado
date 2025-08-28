const fs = require('fs');
const path = require('path');
const { renderWithKonva } = require('./utils/konvaRenderer');

console.log('🔧 PROBANDO SISTEMA DE POSICIONAMIENTO CORREGIDO');
console.log('============================================================');

// Crear datos de prueba que simulan el diseño 64 original de Polotno
const testPolotnoData = {
    width: 1080,
    height: 1920,
    pages: [{
        children: [
            // Cuadrados de esquina (como referencia)
            {
                type: 'figure',
                subType: 'rect',
                x: 0,
                y: 0,
                width: 50,
                height: 50,
                fill: '#FF0000',
                stroke: '#000000',
                strokeWidth: 2,
                opacity: 0.8
            },
            {
                type: 'figure',
                subType: 'rect',
                x: 1030,
                y: 0,
                width: 50,
                height: 50,
                fill: '#FFA500',
                stroke: '#000000',
                strokeWidth: 2,
                opacity: 0.8
            },
            {
                type: 'figure',
                subType: 'rect',
                x: 0,
                y: 1870,
                width: 50,
                height: 50,
                fill: '#00FF00',
                stroke: '#000000',
                strokeWidth: 2,
                opacity: 0.8
            },
            {
                type: 'figure',
                subType: 'rect',
                x: 1030,
                y: 1870,
                width: 50,
                height: 50,
                fill: '#800080',
                stroke: '#000000',
                strokeWidth: 2,
                opacity: 0.8
            },
            // Texto "1" con diferentes posiciones para probar
            {
                type: 'text',
                x: 240,  // Posición original de Polotno (sin correcciones)
                y: 182.57,
                width: 300,
                height: 361,
                text: '1',
                fontSize: 300,
                fontFamily: 'Roboto',
                fill: 'black',
                align: 'center',
                fontWeight: 'bold',
                opacity: 1,
                visible: true,
                rotation: 0
            }
        ]
    }]
};

console.log('📊 Datos de prueba creados:');
console.log('   Canvas:', testPolotnoData.width + 'x' + testPolotnoData.height);
console.log('   Elementos:', testPolotnoData.pages[0].children.length);

const textElement = testPolotnoData.pages[0].children.find(child => child.type === 'text');
console.log('');
console.log('📝 TEXTO DE PRUEBA (coordenadas originales de Polotno):');
console.log('   X:', textElement.x);
console.log('   Y:', textElement.y);
console.log('   Width:', textElement.width);
console.log('   Height:', textElement.height);
console.log('   Align:', textElement.align);

console.log('');
console.log('🔄 GENERANDO CON SISTEMA CORREGIDO...');

// Generar HTML con el sistema corregido
const correctedHtml = renderWithKonva(testPolotnoData, 'positioning-test');

// Guardar el archivo
const timestamp = Date.now();
const outputPath = path.join(__dirname, `positioning-test-corrected-${timestamp}.html`);
fs.writeFileSync(outputPath, correctedHtml);

console.log('💾 Archivo generado:', path.basename(outputPath));

// Verificar el resultado
console.log('');
console.log('🔍 VERIFICACIÓN DEL RESULTADO:');
console.log('============================================================');

// Extraer y analizar el JSON generado
const verificationMatch = correctedHtml.match(/const konvaJson = "([^"]+)";/);
if (verificationMatch) {
    const verificationJsonString = verificationMatch[1].replace(/\\"/g, '"');
    const verificationData = JSON.parse(verificationJsonString);
    
    const verificationText = verificationData.children[0].children.find(child => 
        child.className === 'Text' && child.attrs.text === '1'
    );
    
    if (verificationText) {
        console.log('📝 POSICIÓN FINAL EN KONVA:');
        console.log('   X:', verificationText.attrs.x);
        console.log('   Y:', verificationText.attrs.y);
        console.log('   Width:', verificationText.attrs.width);
        console.log('   Height:', verificationText.attrs.height);
        console.log('   Align:', verificationText.attrs.align);
        
        console.log('');
        console.log('📊 ANÁLISIS DE TRANSFORMACIÓN:');
        console.log('   Polotno X → Konva X:', textElement.x + ' → ' + verificationText.attrs.x);
        console.log('   Diferencia:', Math.abs(textElement.x - verificationText.attrs.x).toFixed(2) + 'px');
        
        if (textElement.x === verificationText.attrs.x) {
            console.log('   ✅ ¡Coordenadas preservadas correctamente!');
        } else {
            console.log('   ⚠️  Las coordenadas fueron modificadas');
        }
        
        console.log('');
        console.log('🎯 ANÁLISIS DE CENTRADO:');
        const canvasCenter = verificationData.attrs.width / 2; // 540
        const textAreaLeft = verificationText.attrs.x; // Borde izquierdo del área de texto
        const textAreaRight = verificationText.attrs.x + verificationText.attrs.width; // Borde derecho
        const textAreaCenter = textAreaLeft + (verificationText.attrs.width / 2); // Centro del área
        
        console.log('   Centro del canvas:', canvasCenter + 'px');
        console.log('   Área de texto: ' + textAreaLeft + 'px a ' + textAreaRight + 'px');
        console.log('   Centro del área de texto:', textAreaCenter + 'px');
        console.log('   Diferencia de centrado:', Math.abs(canvasCenter - textAreaCenter).toFixed(2) + 'px');
        
        console.log('');
        console.log('💡 EXPLICACIÓN:');
        console.log('   Con align="center", Konva centra el texto DENTRO del área definida');
        console.log('   por (x=' + textAreaLeft + ', y=' + verificationText.attrs.y + ', width=' + verificationText.attrs.width + ', height=' + verificationText.attrs.height + ')');
        console.log('   ');
        console.log('   El texto "1" aparecerá centrado en X=' + textAreaCenter + 'px');
        
        if (Math.abs(canvasCenter - textAreaCenter) < 1) {
            console.log('   ✅ ¡El área de texto está perfectamente centrada!');
        } else if (Math.abs(canvasCenter - textAreaCenter) < 50) {
            console.log('   ⚠️  El área de texto está ligeramente descentrada');
        } else {
            console.log('   ❌ El área de texto está significativamente descentrada');
        }
    }
}

console.log('');
console.log('🔧 COMPARACIÓN CON SISTEMA ANTERIOR:');
console.log('============================================================');
console.log('Sistema ANTERIOR (con corrección incorrecta):');
console.log('   konvaChild.attrs.x = (child.x || 0) + (child.width / 2)');
console.log('   Resultado: X = ' + textElement.x + ' + ' + (textElement.width / 2) + ' = ' + (textElement.x + textElement.width / 2));
console.log('');
console.log('Sistema CORREGIDO (sin modificaciones):');
console.log('   konvaChild.attrs.x = child.x');
console.log('   Resultado: X = ' + textElement.x);
console.log('');
console.log('Diferencia: ' + Math.abs((textElement.x + textElement.width / 2) - textElement.x) + 'px hacia la izquierda');

console.log('');
console.log('✅ PRUEBA COMPLETADA');
console.log('📁 Archivo de prueba:', path.basename(outputPath));
console.log('');
console.log('🎯 CONCLUSIÓN:');
console.log('   El sistema corregido usa las coordenadas exactas de Polotno');
console.log('   sin aplicar correcciones incorrectas que desplazan el texto.');