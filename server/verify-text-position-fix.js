const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para verificar que la corrección de posición del texto funciona correctamente
 */

async function verifyTextPositionFix() {
    console.log('🎯 VERIFICACIÓN: Corrección de posición del texto centrado');
    console.log('=' .repeat(70));
    
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
    
    try {
        const design = await db.get(`
            SELECT id, name, content 
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design) {
            console.log('❌ Diseño ID 64 no encontrado');
            return;
        }
        
        const content = JSON.parse(design.content);
        const textElement = content.pages[0].children.find(el => el.type === 'text');
        
        if (!textElement) {
            console.log('❌ No se encontró elemento de texto');
            return;
        }
        
        console.log('📝 ELEMENTO DE TEXTO ORIGINAL:');
        console.log(`   • Texto: "${textElement.text}"`);
        console.log(`   • Posición: (${textElement.x}, ${textElement.y})`);
        console.log(`   • Dimensiones: ${textElement.width} x ${textElement.height}`);
        console.log(`   • Alineación: ${textElement.align}`);
        console.log(`   • FontSize: ${textElement.fontSize}`);
        
        // Calcular la posición esperada en Konva
        let expectedKonvaX;
        if (textElement.align === 'center') {
            expectedKonvaX = textElement.x + (textElement.width / 2);
        } else if (textElement.align === 'right') {
            expectedKonvaX = textElement.x + textElement.width;
        } else {
            expectedKonvaX = textElement.x;
        }
        
        console.log(`\n🎯 POSICIÓN ESPERADA EN KONVA:`);
        console.log(`   • X esperada: ${expectedKonvaX}`);
        console.log(`   • Y esperada: ${textElement.y} (sin cambios)`);
        
        // Generar HTML con el renderer corregido
        console.log('\n🎨 GENERANDO HTML CON RENDERER CORREGIDO:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `text-position-fixed-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filename), html);
        
        console.log(`✅ HTML generado: ${filename}`);
        
        // Extraer y analizar el JSON de Konva
        const konvaJsonMatch = html.match(/const konvaJson = \"(.*?)\";/);
        if (konvaJsonMatch) {
            const konvaJsonString = konvaJsonMatch[1].replace(/\\\"/g, '\"');
            const konvaJson = JSON.parse(konvaJsonString);
            
            console.log('\n🔍 ANÁLISIS DEL TEXTO EN KONVA:');
            console.log('-'.repeat(50));
            
            const layer = konvaJson.children[0];
            const konvaTextElement = layer.children.find(el => el.className === 'Text');
            
            if (konvaTextElement) {
                console.log('📝 ELEMENTO DE TEXTO EN KONVA:');
                console.log(`   • Texto: "${konvaTextElement.attrs.text}"`);
                console.log(`   • Posición X: ${konvaTextElement.attrs.x}`);
                console.log(`   • Posición Y: ${konvaTextElement.attrs.y}`);
                console.log(`   • Align: ${konvaTextElement.attrs.align}`);
                console.log(`   • FontSize: ${konvaTextElement.attrs.fontSize}`);
                console.log(`   • FontFamily: ${konvaTextElement.attrs.fontFamily}`);
                
                console.log('\n📐 VERIFICACIÓN DE LA CORRECCIÓN:');
                console.log('-'.repeat(40));
                
                const actualX = konvaTextElement.attrs.x;
                const actualY = konvaTextElement.attrs.y;
                
                const deltaX = Math.abs(actualX - expectedKonvaX);
                const deltaY = Math.abs(actualY - textElement.y);
                
                console.log(`• Posición X esperada: ${expectedKonvaX}`);
                console.log(`• Posición X actual: ${actualX}`);
                console.log(`• Diferencia X: ${deltaX.toFixed(2)}`);
                
                console.log(`• Posición Y esperada: ${textElement.y}`);
                console.log(`• Posición Y actual: ${actualY}`);
                console.log(`• Diferencia Y: ${deltaY.toFixed(2)}`);
                
                if (deltaX < 1 && deltaY < 1) {
                    console.log('\n✅ CORRECCIÓN EXITOSA:');
                    console.log('   • La posición del texto se ha corregido correctamente');
                    console.log('   • El texto centrado ahora se posiciona en el centro del contenedor');
                } else {
                    console.log('\n❌ PROBLEMA PERSISTENTE:');
                    console.log('   • La posición del texto aún no es correcta');
                    console.log('   • Se requiere ajuste adicional en el renderer');
                }
                
                // Verificar que la alineación se mantiene
                if (konvaTextElement.attrs.align === textElement.align) {
                    console.log('   • ✅ Alineación preservada correctamente');
                } else {
                    console.log(`   • ❌ Alineación incorrecta: esperada '${textElement.align}', actual '${konvaTextElement.attrs.align}'`);
                }
                
            } else {
                console.log('❌ No se encontró elemento de texto en Konva');
            }
            
        } else {
            console.log('❌ No se pudo extraer el JSON de Konva del HTML');
        }
        
        console.log('\n\n🎨 COMPARACIÓN VISUAL:');
        console.log('-'.repeat(50));
        console.log(`📄 Archivo generado: ${filename}`);
        console.log('💡 Abre este archivo en el navegador para verificar visualmente');
        console.log('   que el texto "1" ahora aparece en la posición correcta');
        
        console.log('\n\n📊 RESUMEN DE LA CORRECCIÓN:');
        console.log('=' .repeat(70));
        console.log('🔧 PROBLEMA IDENTIFICADO:');
        console.log('   • Konva interpreta las coordenadas de texto centrado de manera diferente');
        console.log('   • En Polotno: (x,y) = esquina superior izquierda del contenedor');
        console.log('   • En Konva: (x,y) = punto de anclaje del texto según alineación');
        
        console.log('\n✅ SOLUCIÓN IMPLEMENTADA:');
        console.log('   • Para align="center": x = x_original + (width / 2)');
        console.log('   • Para align="right": x = x_original + width');
        console.log('   • Para align="left": x = x_original (sin cambios)');
        
        console.log('\n🎯 RESULTADO ESPERADO:');
        console.log('   • El texto "1" debe aparecer centrado en su posición original');
        console.log('   • La fuente Roboto debe cargarse correctamente');
        console.log('   • El tamaño y estilo del texto deben mantenerse');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.close();
    }
}

verifyTextPositionFix();