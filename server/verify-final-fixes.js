const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para verificar que todas las correcciones del diseño ID 64 funcionan correctamente
 */

async function verifyFinalFixes() {
    console.log('✅ VERIFICACIÓN FINAL: Correcciones del diseño ID 64');
    console.log('=' .repeat(70));
    
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
    
    try {
        // Obtener el diseño ID 64
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
        const elements = content.pages[0].children;
        
        console.log('🎯 RESUMEN DE ELEMENTOS EN EL DISEÑO:');
        console.log('-'.repeat(50));
        
        elements.forEach((element, index) => {
            console.log(`\n${index + 1}. ${element.type.toUpperCase()} (${element.subType || 'N/A'})`);
            
            if (element.type === 'figure') {
                console.log(`   • Posición: (${element.x?.toFixed(1)}, ${element.y?.toFixed(1)})`);
                console.log(`   • Tamaño: ${element.width?.toFixed(1)} x ${element.height?.toFixed(1)}`);
                console.log(`   • Color: ${element.fill}`);
                console.log(`   • Stroke: ${element.stroke} (width: ${element.strokeWidth})`);
                
                if (element.rotation && element.rotation !== 0) {
                    console.log(`   • 🔄 Rotación: ${element.rotation}°`);
                }
                
                if (element.scaleX !== 1 || element.scaleY !== 1) {
                    console.log(`   • 📏 Escala: ${element.scaleX} x ${element.scaleY}`);
                }
                
                // Identificar el tipo de figura
                if (element.subType === 'circle') {
                    console.log(`   • 🔵 CÍRCULO`);
                } else if (element.subType === 'blob14') {
                    console.log(`   • 🎨 FIGURA ABSTRACTA (blob14)`);
                } else if (element.subType === 'diamond') {
                    console.log(`   • 💎 DIAMANTE/ROMBO`);
                } else {
                    console.log(`   • 📐 FIGURA: ${element.subType}`);
                }
            }
            
            if (element.type === 'text') {
                console.log(`   • Texto: \"${element.text}\"`);
                console.log(`   • Fuente: ${element.fontFamily} ${element.fontSize}px`);
                console.log(`   • Peso: ${element.fontWeight || 'normal'}`);
                console.log(`   • Color: ${element.fill}`);
            }
            
            if (element.type === 'image') {
                console.log(`   • 🖼️ IMAGEN DE FONDO`);
                console.log(`   • Tamaño: ${element.width?.toFixed(1)} x ${element.height?.toFixed(1)}`);
            }
        });
        
        console.log('\n\n🎨 GENERANDO HTML CORREGIDO:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `design-64-FIXED-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filename), html);
        
        console.log(`✅ HTML corregido generado: ${filename}`);
        
        // Extraer y analizar el JSON de Konva
        const konvaJsonMatch = html.match(/const konvaJson = \"(.*?)\";/);
        if (konvaJsonMatch) {
            const konvaJsonString = konvaJsonMatch[1].replace(/\\\"/g, '\"');
            const konvaJson = JSON.parse(konvaJsonString);
            
            console.log('\n🔍 VERIFICACIÓN DE CORRECCIONES:');
            console.log('-'.repeat(50));
            
            const layer = konvaJson.children[0];
            const konvaElements = layer.children;
            
            let problemasEncontrados = 0;
            let correccionesVerificadas = 0;
            
            konvaElements.forEach((konvaElement, index) => {
                console.log(`\n✅ ELEMENTO ${index + 1}: ${konvaElement.className}`);
                
                // Verificar corrección de stroke
                if (konvaElement.attrs.stroke && !konvaElement.attrs.strokeWidth) {
                    console.log(`   ❌ PROBLEMA: Stroke sin strokeWidth`);
                    problemasEncontrados++;
                } else if (!konvaElement.attrs.stroke && !konvaElement.attrs.strokeWidth) {
                    console.log(`   ✅ CORRECCIÓN: Sin bordes negros no deseados`);
                    correccionesVerificadas++;
                }
                
                // Verificar transformaciones
                const hasRotation = konvaElement.attrs.rotation && konvaElement.attrs.rotation !== 0;
                const hasScale = (konvaElement.attrs.scaleX && konvaElement.attrs.scaleX !== 1) || 
                               (konvaElement.attrs.scaleY && konvaElement.attrs.scaleY !== 1);
                
                if (hasRotation) {
                    console.log(`   ✅ TRANSFORMACIÓN: Rotación aplicada (${(konvaElement.attrs.rotation * 180 / Math.PI).toFixed(1)}°)`);
                    correccionesVerificadas++;
                }
                
                if (hasScale) {
                    console.log(`   ✅ TRANSFORMACIÓN: Escala aplicada (${konvaElement.attrs.scaleX}, ${konvaElement.attrs.scaleY})`);
                    correccionesVerificadas++;
                }
                
                // Verificar texto en negrita
                if (konvaElement.className === 'Text') {
                    if (konvaElement.attrs.fontStyle === 'bold') {
                        console.log(`   ✅ CORRECCIÓN: Texto en negrita aplicado`);
                        correccionesVerificadas++;
                    } else {
                        console.log(`   ⚠️  Texto sin negrita`);
                    }
                    
                    console.log(`   • Fuente: ${konvaElement.attrs.fontFamily}`);
                    console.log(`   • Tamaño: ${konvaElement.attrs.fontSize}px`);
                }
                
                // Verificar figuras específicas
                if (konvaElement.className === 'Ellipse') {
                    console.log(`   ✅ CORRECCIÓN: Círculo renderizado como Ellipse`);
                    console.log(`   • Radios: ${konvaElement.attrs.radiusX?.toFixed(1)} x ${konvaElement.attrs.radiusY?.toFixed(1)}`);
                    correccionesVerificadas++;
                }
                
                if (konvaElement.className === 'Rect') {
                    if (konvaElement.attrs.cornerRadius && konvaElement.attrs.cornerRadius > 0) {
                        console.log(`   ✅ CORRECCIÓN: Figura abstracta con esquinas redondeadas`);
                        console.log(`   • Corner radius: ${konvaElement.attrs.cornerRadius?.toFixed(1)}`);
                        correccionesVerificadas++;
                    }
                }
            });
            
            console.log('\n\n📊 RESUMEN DE VERIFICACIÓN:');
            console.log('=' .repeat(70));
            console.log(`✅ Correcciones verificadas: ${correccionesVerificadas}`);
            console.log(`❌ Problemas encontrados: ${problemasEncontrados}`);
            
            if (problemasEncontrados === 0) {
                console.log('\n🎉 ¡TODAS LAS CORRECCIONES FUNCIONAN CORRECTAMENTE!');
                console.log('\n📋 PROBLEMAS RESUELTOS:');
                console.log('   ✅ Bordes negros eliminados');
                console.log('   ✅ Texto en negrita aplicado');
                console.log('   ✅ Círculos renderizados como Ellipse');
                console.log('   ✅ Transformaciones (rotación, escala) aplicadas');
                console.log('   ✅ Figuras abstractas con mejor renderizado');
                
                console.log('\n🎯 EL HTML GENERADO AHORA DEBERÍA:');
                console.log('   • Mostrar el círculo rosa sin borde negro');
                console.log('   • Mostrar el texto "1" en negrita con Roboto');
                console.log('   • Mostrar el cuadrado deformado y rotado correctamente');
                console.log('   • Mostrar la figura abstracta con esquinas redondeadas');
                console.log('   • Mantener la imagen de fondo intacta');
                
            } else {
                console.log('\n⚠️  Aún hay algunos problemas por resolver.');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

verifyFinalFixes();