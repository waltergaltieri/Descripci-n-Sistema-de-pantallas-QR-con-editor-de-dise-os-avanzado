const { db, initialize } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function verifyDefinitiveSolution() {
    try {
        console.log('🔍 VERIFICANDO SOLUCIÓN DEFINITIVA...');
        console.log('=' .repeat(60));
        
        await initialize();
        const database = db();
        
        // Obtener el diseño 64 actualizado
        const design = await database.get('SELECT * FROM designs WHERE id = ?', [64]);
        
        if (!design || !design.html_content) {
            throw new Error('Diseño 64 no encontrado o sin contenido HTML');
        }
        
        console.log('📋 ANÁLISIS DEL HTML GENERADO:');
        console.log('-'.repeat(50));
        
        // Extraer el JSON de Konva del HTML
        const konvaJsonMatch = design.html_content.match(/const konvaJson = "([\s\S]*?)";/) || 
                               design.html_content.match(/const konvaJson = (\{[\s\S]*?\});/);
        
        if (!konvaJsonMatch) {
            throw new Error('No se encontró el JSON de Konva en el HTML');
        }
        
        let konvaData;
        if (konvaJsonMatch[1].startsWith('{')) {
            // Es un objeto JavaScript
            konvaData = JSON.parse(konvaJsonMatch[1]);
        } else {
            // Es un string JSON escapado
            konvaData = JSON.parse(konvaJsonMatch[1]);
        }
        
        console.log(`🎯 Dimensiones del stage: ${konvaData.attrs.width}x${konvaData.attrs.height}`);
        
        // Buscar el texto "1"
        const layer = konvaData.children[0];
        const textElement = layer.children.find(child => 
            child.className === 'Text' && child.attrs.text === '1'
        );
        
        if (!textElement) {
            throw new Error('Elemento de texto "1" no encontrado');
        }
        
        console.log('\n📝 COORDENADAS FINALES DEL TEXTO "1":');
        console.log('-'.repeat(50));
        console.log(`   • Posición X: ${textElement.attrs.x}`);
        console.log(`   • Posición Y: ${textElement.attrs.y}`);
        console.log(`   • Ancho: ${textElement.attrs.width}`);
        console.log(`   • Alto: ${textElement.attrs.height}`);
        console.log(`   • Alineación: ${textElement.attrs.align}`);
        console.log(`   • Fuente: ${textElement.attrs.fontFamily}`);
        console.log(`   • Tamaño fuente: ${textElement.attrs.fontSize}px`);
        
        // Calcular el centro del texto
        let textCenterX;
        if (textElement.attrs.align === 'center') {
            textCenterX = textElement.attrs.x; // Ya ajustado para que X sea el centro
        } else if (textElement.attrs.align === 'right') {
            textCenterX = textElement.attrs.x - textElement.attrs.width / 2;
        } else {
            textCenterX = textElement.attrs.x + textElement.attrs.width / 2;
        }
        
        const textCenterY = textElement.attrs.y + textElement.attrs.height / 2;
        
        console.log(`\n🎯 CENTRO CALCULADO DEL TEXTO:`);
        console.log('-'.repeat(50));
        console.log(`   • Centro X: ${textCenterX.toFixed(2)}`);
        console.log(`   • Centro Y: ${textCenterY.toFixed(2)}`);
        
        // Centro esperado del lienzo
        const canvasCenterX = konvaData.attrs.width / 2;
        const canvasCenterY = konvaData.attrs.height / 2;
        
        console.log(`\n📐 CENTRO DEL LIENZO:`);
        console.log('-'.repeat(50));
        console.log(`   • Centro X: ${canvasCenterX}`);
        console.log(`   • Centro Y: ${canvasCenterY}`);
        
        // Calcular diferencias
        const diffX = Math.abs(textCenterX - canvasCenterX);
        const diffY = Math.abs(textCenterY - canvasCenterY);
        
        console.log(`\n📊 DIFERENCIAS:`);
        console.log('-'.repeat(50));
        console.log(`   • Diferencia X: ${diffX.toFixed(2)}px`);
        console.log(`   • Diferencia Y: ${diffY.toFixed(2)}px`);
        
        // Buscar los cuadrados de esquinas en el HTML
        console.log('\n🎨 CUADRADOS DE ESQUINAS EN EL HTML:');
        console.log('-'.repeat(50));
        
        const cornerSquares = layer.children.filter(child => 
            child.className === 'Rect' && 
            child.attrs.fill && 
            (child.attrs.fill.includes('255,0,0') || // Rojo
             child.attrs.fill.includes('255,106,0') || // Naranja
             child.attrs.fill.includes('0,255,21') || // Verde
             child.attrs.fill.includes('202,0,255')) // Morado
        );
        
        cornerSquares.forEach((square, index) => {
            let color = 'Desconocido';
            if (square.attrs.fill.includes('255,0,0')) color = 'Rojo (Superior Izquierda)';
            else if (square.attrs.fill.includes('255,106,0')) color = 'Naranja (Superior Derecha)';
            else if (square.attrs.fill.includes('0,255,21')) color = 'Verde (Inferior Izquierda)';
            else if (square.attrs.fill.includes('202,0,255')) color = 'Morado (Inferior Derecha)';
            
            console.log(`   ${index + 1}. ${color}:`);
            console.log(`      • X: ${square.attrs.x}, Y: ${square.attrs.y}`);
            console.log(`      • Tamaño: ${square.attrs.width}x${square.attrs.height}`);
        });
        
        // Evaluación final
        console.log('\n🎉 EVALUACIÓN FINAL:');
        console.log('=' .repeat(60));
        
        if (diffX < 1) {
            console.log('✅ POSICIÓN X: PERFECTA (diferencia < 1px)');
        } else if (diffX < 10) {
            console.log('⚠️  POSICIÓN X: Aceptable (diferencia < 10px)');
        } else {
            console.log('❌ POSICIÓN X: Necesita corrección (diferencia > 10px)');
        }
        
        if (textElement.attrs.align === 'center') {
            console.log('✅ ALINEACIÓN: Correcta (center)');
        } else {
            console.log('❌ ALINEACIÓN: Incorrecta');
        }
        
        console.log(`\n📝 RESUMEN:`);
        console.log(`   • El texto "1" está en X=${textElement.attrs.x}, Y=${textElement.attrs.y}`);
        console.log(`   • Su centro está en X=${textCenterX.toFixed(2)}, Y=${textCenterY.toFixed(2)}`);
        console.log(`   • El centro del lienzo está en X=${canvasCenterX}, Y=${canvasCenterY}`);
        console.log(`   • Diferencia horizontal: ${diffX.toFixed(2)}px`);
        
        if (diffX < 1) {
            console.log('\n🎯 ¡SOLUCIÓN EXITOSA! El texto está correctamente centrado horizontalmente.');
        } else {
            console.log('\n⚠️  La solución necesita ajustes adicionales.');
        }
        
        return {
            success: true,
            textPosition: { x: textElement.attrs.x, y: textElement.attrs.y },
            textCenter: { x: textCenterX, y: textCenterY },
            canvasCenter: { x: canvasCenterX, y: canvasCenterY },
            differences: { x: diffX, y: diffY },
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
    verifyDefinitiveSolution();
}

module.exports = { verifyDefinitiveSolution };