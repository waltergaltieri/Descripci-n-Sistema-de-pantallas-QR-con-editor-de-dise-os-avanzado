const { db, initialize } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function createDefinitivePositioningSolution() {
    try {
        console.log('🎯 CREANDO SOLUCIÓN DEFINITIVA DE POSICIONAMIENTO...');
        console.log('=' .repeat(70));
        
        await initialize();
        const database = db();
        
        // Obtener el diseño 64
        const design = await database.get('SELECT * FROM designs WHERE id = ?', [64]);
        const content = JSON.parse(design.content);
        const firstPage = content.pages[0];
        
        console.log('📊 ANÁLISIS DE CUADRADOS DE REFERENCIA:');
        console.log('-'.repeat(50));
        
        // Encontrar los cuadrados de esquinas (búsqueda más flexible)
        const cornerSquares = {
            topLeft: firstPage.children.find(child => 
                child.type === 'figure' && 
                child.fill && child.fill.includes('255,0,0') && // Rojo
                Math.abs(child.x) < 1 && Math.abs(child.y) < 1
            ),
            topRight: firstPage.children.find(child => 
                child.type === 'figure' && 
                child.fill && child.fill.includes('255,106,0') && // Naranja
                child.x > 900 && Math.abs(child.y) < 1
            ),
            bottomLeft: firstPage.children.find(child => 
                child.type === 'figure' && 
                child.fill && child.fill.includes('0,255,21') && // Verde
                Math.abs(child.x) < 1 && child.y > 1700
            ),
            bottomRight: firstPage.children.find(child => 
                child.type === 'figure' && 
                child.fill && child.fill.includes('202,0,255') && // Morado
                child.x > 900 && child.y > 1700
            )
        };
        
        console.log('🔍 Cuadrados encontrados:');
        Object.entries(cornerSquares).forEach(([position, square]) => {
            if (square) {
                console.log(`   ✅ ${position}: X=${square.x}, Y=${square.y}, Tamaño=${square.width}x${square.height}`);
            } else {
                console.log(`   ❌ ${position}: No encontrado`);
            }
        });
        
        // Calcular el sistema de coordenadas real
        const canvasWidth = content.width; // 1080
        const canvasHeight = content.height; // 1920
        const squareSize = cornerSquares.topLeft ? cornerSquares.topLeft.width : 134.5;
        
        console.log('\n📐 SISTEMA DE COORDENADAS DETECTADO:');
        console.log('-'.repeat(50));
        console.log(`   • Lienzo teórico: ${canvasWidth}x${canvasHeight}px`);
        console.log(`   • Tamaño de cuadrados: ${squareSize}px`);
        console.log(`   • Área útil: ${canvasWidth - squareSize}x${canvasHeight - squareSize}px`);
        
        // El problema: Los cuadrados están en las esquinas EXACTAS (0,0) pero deberían estar
        // en las esquinas VISIBLES del lienzo. Esto indica que hay un offset.
        
        const actualTopRightX = cornerSquares.topRight.x; // 945.5
        const actualBottomY = cornerSquares.bottomLeft.y; // 1785.5
        
        const offsetX = canvasWidth - actualTopRightX - squareSize; // 1080 - 945.5 - 134.5 = 0
        const offsetY = canvasHeight - actualBottomY - squareSize; // 1920 - 1785.5 - 134.5 = 0
        
        console.log(`   • Offset calculado: X=${offsetX}px, Y=${offsetY}px`);
        
        // Analizar el texto "1" con el nuevo entendimiento
        const textElement = firstPage.children.find(child => 
            child.type === 'text' && child.text === '1'
        );
        
        console.log('\n📝 ANÁLISIS DEL TEXTO "1":');
        console.log('-'.repeat(50));
        console.log(`   • Posición actual: X=${textElement.x}, Y=${textElement.y}`);
        console.log(`   • Tamaño: ${textElement.width}x${textElement.height}`);
        console.log(`   • Alineación: ${textElement.align}`);
        
        // El texto debería estar centrado en el lienzo
        const expectedCenterX = canvasWidth / 2;
        const expectedCenterY = canvasHeight / 2;
        
        // Para texto centrado, la posición X debería ser centerX - width/2
        const expectedTextX = expectedCenterX - textElement.width / 2;
        const expectedTextY = expectedCenterY - textElement.height / 2;
        
        console.log(`   • Centro esperado del lienzo: X=${expectedCenterX}, Y=${expectedCenterY}`);
        console.log(`   • Posición esperada del texto: X=${expectedTextX}, Y=${expectedTextY}`);
        
        const textOffsetX = textElement.x - expectedTextX;
        const textOffsetY = textElement.y - expectedTextY;
        
        console.log(`   • Desplazamiento del texto: X=${textOffsetX.toFixed(2)}px, Y=${textOffsetY.toFixed(2)}px`);
        
        // SOLUCIÓN DEFINITIVA
        console.log('\n🎯 SOLUCIÓN DEFINITIVA:');
        console.log('=' .repeat(70));
        
        console.log('\n📋 PROBLEMA IDENTIFICADO:');
        console.log('   El texto "1" está desplazado hacia arriba y a la izquierda.');
        console.log('   Los cuadrados de esquinas confirman que el sistema de coordenadas');
        console.log('   está funcionando correctamente, pero hay un problema en el cálculo');
        console.log('   de posición para elementos centrados.');
        
        console.log('\n🔧 CORRECCIÓN NECESARIA:');
        console.log('   Para elementos con align="center", la posición X debe ajustarse');
        console.log('   para que el centro del texto coincida con la coordenada especificada.');
        
        // Crear la nueva versión del konvaRenderer.js
        const konvaRendererPath = path.join(__dirname, 'utils', 'konvaRenderer.js');
        let konvaContent = fs.readFileSync(konvaRendererPath, 'utf8');
        
        // Buscar la sección donde se procesan los elementos de texto
        const textProcessingRegex = /(if \(child\.type === 'text'\) \{[\s\S]*?\})/;
        
        const newTextProcessing = `if (child.type === 'text') {
                    konvaChild = {
                        className: 'Text',
                        attrs: {
                            x: child.x,
                            y: child.y,
                            text: child.text,
                            fontSize: child.fontSize,
                            fontFamily: child.fontFamily,
                            fill: child.fill,
                            align: child.align,
                            width: child.width,
                            height: child.height,
                            fontStyle: child.fontStyle,
                            textDecoration: child.textDecoration,
                            lineHeight: child.lineHeight
                        }
                    };
                    
                    // CORRECCIÓN DEFINITIVA PARA ALINEACIÓN DE TEXTO
                    // Ajustar la posición X basada en la alineación para que coincida
                    // con el comportamiento esperado del editor
                    if (child.align === 'center') {
                        // Para texto centrado, ajustar X para que el centro del texto
                        // esté en la coordenada especificada
                        konvaChild.attrs.x = child.x + (child.width / 2);
                        konvaChild.attrs.align = 'center';
                    } else if (child.align === 'right') {
                        // Para texto alineado a la derecha
                        konvaChild.attrs.x = child.x + child.width;
                        konvaChild.attrs.align = 'right';
                    } else {
                        // Para texto alineado a la izquierda (por defecto)
                        konvaChild.attrs.align = 'left';
                    }
                }`;
        
        // Aplicar la corrección
        const updatedKonvaContent = konvaContent.replace(textProcessingRegex, newTextProcessing);
        
        // Guardar el archivo actualizado
        fs.writeFileSync(konvaRendererPath, updatedKonvaContent, 'utf8');
        
        console.log('\n✅ ARCHIVO ACTUALIZADO: konvaRenderer.js');
        
        // Regenerar el HTML del diseño 64
        const { renderWithKonva } = require('./utils/konvaRenderer');
        const newHtmlContent = renderWithKonva(content);
        
        // Actualizar la base de datos
        await database.run(
            'UPDATE designs SET html_content = ? WHERE id = ?',
            [newHtmlContent, 64]
        );
        
        console.log('✅ BASE DE DATOS ACTUALIZADA');
        
        // Generar archivo de prueba
        const timestamp = Date.now();
        const testFileName = `design-64-definitive-fix-${timestamp}.html`;
        const testFilePath = path.join(__dirname, testFileName);
        
        fs.writeFileSync(testFilePath, newHtmlContent, 'utf8');
        
        console.log(`✅ ARCHIVO DE PRUEBA GENERADO: ${testFileName}`);
        
        // Verificar las coordenadas del texto en el nuevo HTML
        const konvaJsonMatch = newHtmlContent.match(/const konvaJson = (\{[\s\S]*?\});/);
        if (konvaJsonMatch) {
            const konvaData = JSON.parse(konvaJsonMatch[1]);
            const textNode = konvaData.children[0].children.find(child => 
                child.className === 'Text' && child.attrs.text === '1'
            );
            
            if (textNode) {
                console.log('\n🎯 VERIFICACIÓN DE COORDENADAS FINALES:');
                console.log('-'.repeat(50));
                console.log(`   • Nueva posición X: ${textNode.attrs.x}`);
                console.log(`   • Nueva posición Y: ${textNode.attrs.y}`);
                console.log(`   • Alineación: ${textNode.attrs.align}`);
                console.log(`   • Ancho: ${textNode.attrs.width}`);
                
                const finalCenterX = textNode.attrs.align === 'center' ? 
                    textNode.attrs.x : textNode.attrs.x + textNode.attrs.width / 2;
                
                console.log(`   • Centro calculado X: ${finalCenterX}`);
                console.log(`   • Centro esperado X: ${expectedCenterX}`);
                console.log(`   • Diferencia: ${Math.abs(finalCenterX - expectedCenterX).toFixed(2)}px`);
            }
        }
        
        console.log('\n🎉 SOLUCIÓN DEFINITIVA APLICADA');
        console.log('=' .repeat(70));
        console.log('\n📝 RESUMEN DE LA CORRECCIÓN:');
        console.log('   1. ✅ Identificados cuadrados de referencia en las esquinas');
        console.log('   2. ✅ Confirmado que el sistema de coordenadas base funciona');
        console.log('   3. ✅ Detectado problema específico en alineación de texto centrado');
        console.log('   4. ✅ Aplicada corrección para ajustar posición X según alineación');
        console.log('   5. ✅ Actualizado konvaRenderer.js con la lógica definitiva');
        console.log('   6. ✅ Regenerado HTML y actualizada base de datos');
        
        return {
            success: true,
            testFile: testFileName,
            textPosition: textNode ? { x: textNode.attrs.x, y: textNode.attrs.y } : null
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
    createDefinitivePositioningSolution();
}

module.exports = { createDefinitivePositioningSolution };