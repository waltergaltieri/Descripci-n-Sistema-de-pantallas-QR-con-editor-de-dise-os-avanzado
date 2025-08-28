const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para verificar que la corrección final de transparencia funciona correctamente
 */

async function verifyFinalTransparencyFix() {
    console.log('🔍 VERIFICACIÓN FINAL: Corrección de transparencia RGBA');
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
        const elements = content.pages[0].children;
        
        console.log('🎯 ANÁLISIS DE ELEMENTOS CON TRANSPARENCIA:');
        console.log('-'.repeat(50));
        
        const transparentElements = elements.filter(el => 
            el.fill && el.fill.includes('rgba')
        );
        
        console.log(`Total de elementos con RGBA: ${transparentElements.length}`);
        
        transparentElements.forEach((element, index) => {
            console.log(`\n${index + 1}. ELEMENTO CON RGBA:`);
            console.log(`   • ID: ${element.id}`);
            console.log(`   • Tipo: ${element.type} (${element.subType || 'N/A'})`);
            console.log(`   • Fill original: ${element.fill}`);
            
            // Analizar el valor RGBA
            const rgbaMatch = element.fill.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
            if (rgbaMatch) {
                const r = parseInt(rgbaMatch[1]);
                const g = parseInt(rgbaMatch[2]);
                const b = parseInt(rgbaMatch[3]);
                const alpha = parseFloat(rgbaMatch[4]);
                
                console.log(`   • RGB: (${r}, ${g}, ${b})`);
                console.log(`   • Alpha: ${alpha}`);
                
                if (alpha <= 1) {
                    console.log(`   • ✅ ESCALA: 0-1 (correcto para Konva)`);
                    console.log(`   • 🎯 OPACIDAD ESPERADA: ${alpha}`);
                } else {
                    console.log(`   • ⚠️  ESCALA: 0-255 (necesita conversión)`);
                    console.log(`   • 🎯 OPACIDAD ESPERADA: ${(alpha / 255).toFixed(3)}`);
                }
                
                const transparencyPercent = alpha <= 1 
                    ? ((1 - alpha) * 100).toFixed(1)
                    : ((255 - alpha) / 255 * 100).toFixed(1);
                console.log(`   • 👻 TRANSPARENCIA: ${transparencyPercent}%`);
            }
        });
        
        console.log('\n\n🎨 GENERANDO HTML CON CORRECCIÓN MEJORADA:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `design-64-final-transparency-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filename), html);
        
        console.log(`✅ HTML generado: ${filename}`);
        
        // Extraer y analizar el JSON de Konva
        const konvaJsonMatch = html.match(/const konvaJson = \"(.*?)\";/);
        if (konvaJsonMatch) {
            const konvaJsonString = konvaJsonMatch[1].replace(/\\\"/g, '\"');
            const konvaJson = JSON.parse(konvaJsonString);
            
            console.log('\n🔍 VERIFICACIÓN EN JSON DE KONVA:');
            console.log('-'.repeat(50));
            
            const layer = konvaJson.children[0];
            const konvaElements = layer.children;
            
            console.log(`Total de elementos en Konva: ${konvaElements.length}`);
            
            let visibilityProblems = 0;
            let transparencyCorrect = 0;
            
            konvaElements.forEach((konvaElement, index) => {
                console.log(`\n✅ ELEMENTO KONVA ${index + 1}: ${konvaElement.className}`);
                console.log(`   • Posición: (${konvaElement.attrs.x?.toFixed(1)}, ${konvaElement.attrs.y?.toFixed(1)})`);
                
                if (konvaElement.attrs.fill) {
                    console.log(`   • Fill: ${konvaElement.attrs.fill}`);
                    
                    // Verificar opacidad
                    const opacity = konvaElement.attrs.opacity || 1;
                    console.log(`   • Opacidad: ${opacity.toFixed(3)}`);
                    
                    if (opacity < 0.01) {
                        console.log(`   • ❌ PROBLEMA: Opacidad demasiado baja (${opacity.toFixed(6)}) - elemento invisible`);
                        visibilityProblems++;
                    } else if (opacity < 1) {
                        console.log(`   • ✅ TRANSPARENCIA APLICADA: ${((1 - opacity) * 100).toFixed(1)}% transparente`);
                        transparencyCorrect++;
                    } else {
                        console.log(`   • ℹ️  OPACO: Sin transparencia`);
                    }
                    
                    // Verificar que el color sea RGB (no RGBA)
                    if (konvaElement.attrs.fill.startsWith('rgb(') && !konvaElement.attrs.fill.includes('rgba')) {
                        console.log(`   • ✅ COLOR PROCESADO: RGBA → RGB + opacity`);
                    } else if (konvaElement.attrs.fill.includes('rgba')) {
                        console.log(`   • ❌ PROBLEMA: Aún contiene RGBA sin procesar`);
                    }
                }
                
                // Verificar otras propiedades importantes
                if (konvaElement.className === 'Ellipse') {
                    console.log(`   • 🔵 CÍRCULO: radiusX=${konvaElement.attrs.radiusX?.toFixed(1)}, radiusY=${konvaElement.attrs.radiusY?.toFixed(1)}`);
                }
                
                if (konvaElement.attrs.cornerRadius) {
                    console.log(`   • 🎨 FIGURA ABSTRACTA: cornerRadius=${konvaElement.attrs.cornerRadius?.toFixed(1)}`);
                }
                
                if (konvaElement.attrs.rotation && konvaElement.attrs.rotation !== 0) {
                    const degrees = (konvaElement.attrs.rotation * 180 / Math.PI).toFixed(1);
                    console.log(`   • 🔄 ROTACIÓN: ${degrees}°`);
                }
            });
            
            console.log('\n\n📊 DIAGNÓSTICO FINAL:');
            console.log('=' .repeat(70));
            
            // Verificar elementos específicos
            const circleFound = konvaElements.find(el => el.className === 'Ellipse');
            const abstractFound = konvaElements.find(el => 
                el.className === 'Rect' && el.attrs.cornerRadius && el.attrs.cornerRadius > 50
            );
            const rotatedFound = konvaElements.find(el => 
                el.attrs.rotation && Math.abs(el.attrs.rotation) > 1
            );
            
            console.log(`\n🔵 CÍRCULO:`);
            if (circleFound) {
                const opacity = circleFound.attrs.opacity || 1;
                if (opacity < 0.01) {
                    console.log(`   ❌ ENCONTRADO PERO INVISIBLE (opacidad: ${opacity.toFixed(6)})`);
                } else {
                    console.log(`   ✅ ENCONTRADO Y VISIBLE (opacidad: ${opacity.toFixed(3)})`);
                }
            } else {
                console.log(`   ❌ NO ENCONTRADO`);
            }
            
            console.log(`\n🎨 FIGURA ABSTRACTA:`);
            if (abstractFound) {
                const opacity = abstractFound.attrs.opacity || 1;
                if (opacity < 0.01) {
                    console.log(`   ❌ ENCONTRADA PERO INVISIBLE (opacidad: ${opacity.toFixed(6)})`);
                } else {
                    console.log(`   ✅ ENCONTRADA Y VISIBLE (opacidad: ${opacity.toFixed(3)})`);
                }
            } else {
                console.log(`   ❌ NO ENCONTRADA`);
            }
            
            console.log(`\n📐 CUADRADO ROTADO:`);
            if (rotatedFound) {
                const opacity = rotatedFound.attrs.opacity || 1;
                const degrees = (rotatedFound.attrs.rotation * 180 / Math.PI).toFixed(1);
                console.log(`   ✅ ENCONTRADO: rotación ${degrees}°, opacidad ${opacity.toFixed(3)}`);
            } else {
                console.log(`   ❌ ROTACIÓN NO APLICADA`);
            }
            
            console.log('\n\n🎉 RESUMEN FINAL:');
            console.log('=' .repeat(70));
            console.log(`✅ Elementos con transparencia correcta: ${transparencyCorrect}`);
            console.log(`❌ Problemas de visibilidad: ${visibilityProblems}`);
            
            if (visibilityProblems === 0) {
                console.log('\n🎊 ¡ÉXITO! Todos los elementos son visibles con transparencia correcta');
                console.log('   • El círculo debería aparecer');
                console.log('   • La figura abstracta debería aparecer');
                console.log('   • El cuadrado rotado debería aparecer con rotación');
                console.log('   • El texto debería aparecer en negrita');
            } else {
                console.log('\n⚠️  Aún hay elementos con problemas de visibilidad');
                console.log('   • Revisar valores de opacidad muy bajos');
                console.log('   • Verificar conversión de escalas RGBA');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.close();
    }
}

verifyFinalTransparencyFix();