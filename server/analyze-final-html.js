const fs = require('fs');
const path = require('path');

async function analyzeFinalHtml() {
    try {
        console.log('🔍 ANALIZANDO HTML FINAL GENERADO...');
        console.log('=' .repeat(60));
        
        // Buscar el archivo HTML más reciente
        const files = fs.readdirSync(__dirname)
            .filter(file => file.startsWith('design-64-definitive-fix-') && file.endsWith('.html'))
            .sort((a, b) => {
                const timeA = parseInt(a.match(/-(\d+)\.html$/)[1]);
                const timeB = parseInt(b.match(/-(\d+)\.html$/)[1]);
                return timeB - timeA;
            });
        
        if (files.length === 0) {
            throw new Error('No se encontró archivo HTML generado');
        }
        
        const latestFile = files[0];
        const filePath = path.join(__dirname, latestFile);
        
        console.log(`📄 Analizando archivo: ${latestFile}`);
        
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        
        // Extraer el JSON de Konva (buscar en múltiples líneas)
        const jsonMatch = htmlContent.match(/const konvaJson = "([\s\S]*?)";/);
        
        if (!jsonMatch) {
            throw new Error('No se encontró el JSON de Konva');
        }
        
        // Decodificar el JSON
        const jsonString = jsonMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        
        const konvaData = JSON.parse(jsonString);
        
        console.log('\n📊 INFORMACIÓN DEL STAGE:');
        console.log('-'.repeat(50));
        console.log(`   • Ancho: ${konvaData.attrs.width}px`);
        console.log(`   • Alto: ${konvaData.attrs.height}px`);
        console.log(`   • Centro teórico: X=${konvaData.attrs.width/2}, Y=${konvaData.attrs.height/2}`);
        
        // Buscar el texto "1"
        const layer = konvaData.children[0];
        const textElement = layer.children.find(child => 
            child.className === 'Text' && child.attrs.text === '1'
        );
        
        if (!textElement) {
            throw new Error('Elemento de texto "1" no encontrado');
        }
        
        console.log('\n📝 ELEMENTO DE TEXTO "1":');
        console.log('-'.repeat(50));
        console.log(`   • Posición: X=${textElement.attrs.x}, Y=${textElement.attrs.y}`);
        console.log(`   • Tamaño: ${textElement.attrs.width}x${textElement.attrs.height}`);
        console.log(`   • Alineación: ${textElement.attrs.align}`);
        console.log(`   • Fuente: ${textElement.attrs.fontFamily}, ${textElement.attrs.fontSize}px`);
        console.log(`   • Estilo: ${textElement.attrs.fontStyle || 'normal'}`);
        
        // Calcular centro del texto según la alineación
        let textCenterX;
        const textX = textElement.attrs.x;
        const textWidth = textElement.attrs.width;
        
        if (textElement.attrs.align === 'center') {
            // Si la alineación es center, X debería ser el centro del texto
            textCenterX = textX;
        } else if (textElement.attrs.align === 'right') {
            textCenterX = textX - textWidth / 2;
        } else {
            textCenterX = textX + textWidth / 2;
        }
        
        const textCenterY = textElement.attrs.y + textElement.attrs.height / 2;
        
        console.log('\n🎯 ANÁLISIS DE CENTRADO:');
        console.log('-'.repeat(50));
        console.log(`   • Centro calculado del texto: X=${textCenterX.toFixed(2)}, Y=${textCenterY.toFixed(2)}`);
        console.log(`   • Centro del lienzo: X=${konvaData.attrs.width/2}, Y=${konvaData.attrs.height/2}`);
        
        const diffX = Math.abs(textCenterX - konvaData.attrs.width/2);
        const diffY = Math.abs(textCenterY - konvaData.attrs.height/2);
        
        console.log(`   • Diferencia X: ${diffX.toFixed(2)}px`);
        console.log(`   • Diferencia Y: ${diffY.toFixed(2)}px`);
        
        // Buscar cuadrados de esquinas
        console.log('\n🎨 CUADRADOS DE ESQUINAS:');
        console.log('-'.repeat(50));
        
        const squares = layer.children.filter(child => 
            child.className === 'Rect' && 
            child.attrs.width < 200 && child.attrs.height < 200
        );
        
        squares.forEach((square, index) => {
            const x = square.attrs.x;
            const y = square.attrs.y;
            const fill = square.attrs.fill;
            
            let position = 'Desconocida';
            if (x < 100 && y < 100) position = 'Superior Izquierda';
            else if (x > 900 && y < 100) position = 'Superior Derecha';
            else if (x < 100 && y > 1700) position = 'Inferior Izquierda';
            else if (x > 900 && y > 1700) position = 'Inferior Derecha';
            
            console.log(`   ${index + 1}. ${position}: X=${x.toFixed(2)}, Y=${y.toFixed(2)}, Color=${fill}`);
        });
        
        // Evaluación final
        console.log('\n🎉 EVALUACIÓN FINAL:');
        console.log('=' .repeat(60));
        
        if (diffX < 1) {
            console.log('✅ CENTRADO HORIZONTAL: PERFECTO (diferencia < 1px)');
        } else if (diffX < 10) {
            console.log('⚠️  CENTRADO HORIZONTAL: Aceptable (diferencia < 10px)');
        } else {
            console.log('❌ CENTRADO HORIZONTAL: Necesita corrección');
        }
        
        console.log('\n📋 RESUMEN DE LA SOLUCIÓN:');
        console.log(`   • Texto "1" en posición: X=${textElement.attrs.x}, Y=${textElement.attrs.y}`);
        console.log(`   • Alineación aplicada: ${textElement.attrs.align}`);
        console.log(`   • Centro calculado: X=${textCenterX.toFixed(2)}, Y=${textCenterY.toFixed(2)}`);
        console.log(`   • Precisión horizontal: ${diffX.toFixed(2)}px de diferencia`);
        
        if (diffX < 1) {
            console.log('\n🎯 ¡ÉXITO! La solución definitiva funciona correctamente.');
            console.log('   El texto "1" está perfectamente centrado horizontalmente.');
        } else {
            console.log('\n⚠️  La solución necesita ajustes adicionales.');
        }
        
        return {
            success: true,
            file: latestFile,
            textPosition: { x: textElement.attrs.x, y: textElement.attrs.y },
            textCenter: { x: textCenterX, y: textCenterY },
            canvasCenter: { x: konvaData.attrs.width/2, y: konvaData.attrs.height/2 },
            horizontalDifference: diffX,
            isCorrect: diffX < 1
        };
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

if (require.main === module) {
    analyzeFinalHtml();
}

module.exports = { analyzeFinalHtml };