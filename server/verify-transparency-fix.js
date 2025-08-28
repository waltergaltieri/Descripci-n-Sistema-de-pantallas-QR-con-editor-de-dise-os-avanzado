const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para verificar que la transparencia RGBA se maneja correctamente
 */

async function verifyTransparencyFix() {
    console.log('🔍 VERIFICACIÓN: Corrección de transparencia RGBA');
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
        
        console.log('🎯 ANÁLISIS DE ELEMENTOS CON TRANSPARENCIA:');
        console.log('-'.repeat(50));
        
        // Buscar elementos con valores RGBA
        const elementsWithRGBA = elements.filter(element => 
            element.fill && element.fill.includes('rgba')
        );
        
        if (elementsWithRGBA.length === 0) {
            console.log('⚠️  No se encontraron elementos con valores RGBA');
            return;
        }
        
        elementsWithRGBA.forEach((element, index) => {
            console.log(`\n${index + 1}. ELEMENTO CON RGBA:`);
            console.log(`   • ID: ${element.id}`);
            console.log(`   • Tipo: ${element.type} (${element.subType || 'N/A'})`);
            console.log(`   • Color original: ${element.fill}`);
            
            // Analizar el valor RGBA
            const rgbaMatch = element.fill.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/);
            if (rgbaMatch) {
                const r = parseInt(rgbaMatch[1]);
                const g = parseInt(rgbaMatch[2]);
                const b = parseInt(rgbaMatch[3]);
                const alpha = parseInt(rgbaMatch[4]);
                
                console.log(`   • RGB: (${r}, ${g}, ${b})`);
                console.log(`   • Alpha original: ${alpha} (escala 0-255)`);
                console.log(`   • Opacidad esperada: ${(alpha / 255).toFixed(3)} (escala 0-1)`);
                
                // Calcular porcentaje de transparencia
                const transparencyPercent = ((255 - alpha) / 255 * 100).toFixed(1);
                console.log(`   • Transparencia: ${transparencyPercent}% transparente`);
            }
        });
        
        console.log('\n\n🎨 GENERANDO HTML CON CORRECCIÓN DE TRANSPARENCIA:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `design-64-transparency-fixed-${Date.now()}.html`;
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
            
            let transparencyFixed = 0;
            let transparencyProblems = 0;
            
            konvaElements.forEach((konvaElement, index) => {
                console.log(`\n✅ ELEMENTO ${index + 1}: ${konvaElement.className}`);
                
                if (konvaElement.attrs.fill) {
                    console.log(`   • Fill: ${konvaElement.attrs.fill}`);
                    
                    // Verificar si tiene opacidad aplicada
                    if (konvaElement.attrs.opacity !== undefined && konvaElement.attrs.opacity !== 1) {
                        console.log(`   • ✅ OPACIDAD APLICADA: ${konvaElement.attrs.opacity.toFixed(3)}`);
                        
                        // Calcular porcentaje de transparencia
                        const transparencyPercent = ((1 - konvaElement.attrs.opacity) * 100).toFixed(1);
                        console.log(`   • 🎯 TRANSPARENCIA: ${transparencyPercent}% transparente`);
                        
                        transparencyFixed++;
                        
                        // Verificar si el color es RGB (sin alpha)
                        if (konvaElement.attrs.fill.startsWith('rgb(') && !konvaElement.attrs.fill.includes('rgba')) {
                            console.log(`   • ✅ COLOR CONVERTIDO: RGBA → RGB + opacity`);
                        }
                    } else if (konvaElement.attrs.fill.includes('rgba')) {
                        console.log(`   • ❌ PROBLEMA: Aún contiene RGBA sin procesar`);
                        transparencyProblems++;
                    } else {
                        console.log(`   • ℹ️  Sin transparencia (opacidad = 1.0)`);
                    }
                }
                
                // Mostrar otras propiedades relevantes
                if (konvaElement.attrs.rotation && konvaElement.attrs.rotation !== 0) {
                    const degrees = (konvaElement.attrs.rotation * 180 / Math.PI).toFixed(1);
                    console.log(`   • 🔄 Rotación: ${degrees}°`);
                }
                
                if (konvaElement.attrs.scaleX !== 1 || konvaElement.attrs.scaleY !== 1) {
                    console.log(`   • 📏 Escala: ${konvaElement.attrs.scaleX} x ${konvaElement.attrs.scaleY}`);
                }
            });
            
            console.log('\n\n📊 RESUMEN DE VERIFICACIÓN DE TRANSPARENCIA:');
            console.log('=' .repeat(70));
            console.log(`✅ Elementos con transparencia corregida: ${transparencyFixed}`);
            console.log(`❌ Problemas de transparencia encontrados: ${transparencyProblems}`);
            
            if (transparencyProblems === 0 && transparencyFixed > 0) {
                console.log('\n🎉 ¡TRANSPARENCIA CORREGIDA EXITOSAMENTE!');
                console.log('\n📋 CORRECCIONES APLICADAS:');
                console.log('   ✅ Valores RGBA procesados correctamente');
                console.log('   ✅ Alpha convertido de escala 0-255 a 0-1');
                console.log('   ✅ Colores convertidos de RGBA a RGB');
                console.log('   ✅ Opacidad aplicada como propiedad separada');
                
                console.log('\n🎯 RESULTADO ESPERADO:');
                console.log('   • El cuadrado deformado ahora debería verse semi-transparente');
                console.log('   • La transparencia debería coincidir con el diseño original');
                console.log('   • Todos los demás elementos mantienen sus propiedades');
                
            } else if (transparencyFixed === 0) {
                console.log('\n⚠️  No se encontraron elementos con transparencia en el resultado');
            } else {
                console.log('\n⚠️  Aún hay algunos problemas de transparencia por resolver');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

verifyTransparencyFix();