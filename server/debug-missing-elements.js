const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para diagnosticar por qué algunos elementos no aparecen en el HTML
 */

async function debugMissingElements() {
    console.log('🔍 DIAGNÓSTICO: Elementos que no aparecen en el HTML');
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
        
        console.log('🎯 ANÁLISIS DETALLADO DE CADA ELEMENTO:');
        console.log('-'.repeat(50));
        
        elements.forEach((element, index) => {
            console.log(`\n${index + 1}. ELEMENTO ORIGINAL:`);
            console.log(`   • ID: ${element.id}`);
            console.log(`   • Tipo: ${element.type}`);
            console.log(`   • SubTipo: ${element.subType || 'N/A'}`);
            console.log(`   • Visible: ${element.visible !== false}`);
            console.log(`   • Posición: (${element.x?.toFixed(1)}, ${element.y?.toFixed(1)})`);
            console.log(`   • Tamaño: ${element.width?.toFixed(1)} x ${element.height?.toFixed(1)}`);
            
            if (element.fill) {
                console.log(`   • Fill: ${element.fill}`);
            }
            
            if (element.stroke) {
                console.log(`   • Stroke: ${element.stroke} (width: ${element.strokeWidth || 0})`);
            }
            
            // Verificar propiedades específicas por tipo
            if (element.type === 'figure') {
                console.log(`   🔍 ANÁLISIS DE FIGURA:`);
                
                switch (element.subType) {
                    case 'circle':
                        console.log(`      → Debería convertirse a Konva.Ellipse`);
                        console.log(`      → RadiusX: ${(element.width || 100) / 2}`);
                        console.log(`      → RadiusY: ${(element.height || 100) / 2}`);
                        console.log(`      → Centro X: ${(element.x || 0) + (element.width || 100) / 2}`);
                        console.log(`      → Centro Y: ${(element.y || 0) + (element.height || 100) / 2}`);
                        break;
                        
                    case 'blob14':
                        console.log(`      → Debería convertirse a Konva.Rect con cornerRadius`);
                        console.log(`      → CornerRadius calculado: ${Math.min(element.width || 100, element.height || 100) * 0.3}`);
                        break;
                        
                    case 'diamond':
                        console.log(`      → Debería convertirse a Konva.Rect`);
                        console.log(`      → Rotación: ${element.rotation || 0}°`);
                        break;
                        
                    default:
                        console.log(`      → SubTipo desconocido: ${element.subType}`);
                }
            }
            
            // Verificar transformaciones
            const transformations = [];
            if (element.rotation && element.rotation !== 0) {
                transformations.push(`rotation: ${element.rotation}°`);
            }
            if (element.scaleX && element.scaleX !== 1) {
                transformations.push(`scaleX: ${element.scaleX}`);
            }
            if (element.scaleY && element.scaleY !== 1) {
                transformations.push(`scaleY: ${element.scaleY}`);
            }
            
            if (transformations.length > 0) {
                console.log(`   🔄 Transformaciones: ${transformations.join(', ')}`);
            }
        });
        
        console.log('\n\n🎨 GENERANDO HTML Y ANALIZANDO RESULTADO:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `debug-missing-elements-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filename), html);
        
        console.log(`✅ HTML generado: ${filename}`);
        
        // Extraer y analizar el JSON de Konva
        const konvaJsonMatch = html.match(/const konvaJson = \"(.*?)\";/);
        if (konvaJsonMatch) {
            const konvaJsonString = konvaJsonMatch[1].replace(/\\\"/g, '\"');
            const konvaJson = JSON.parse(konvaJsonString);
            
            console.log('\n🔍 ELEMENTOS EN EL JSON DE KONVA:');
            console.log('-'.repeat(50));
            
            const layer = konvaJson.children[0];
            const konvaElements = layer.children;
            
            console.log(`Total de elementos en Konva: ${konvaElements.length}`);
            console.log(`Total de elementos originales: ${elements.length}`);
            
            if (konvaElements.length !== elements.length) {
                console.log(`⚠️  DISCREPANCIA: Faltan ${elements.length - konvaElements.length} elementos`);
            }
            
            konvaElements.forEach((konvaElement, index) => {
                console.log(`\n✅ ELEMENTO KONVA ${index + 1}: ${konvaElement.className}`);
                console.log(`   • Posición: (${konvaElement.attrs.x?.toFixed(1)}, ${konvaElement.attrs.y?.toFixed(1)})`);
                
                if (konvaElement.attrs.width && konvaElement.attrs.height) {
                    console.log(`   • Tamaño: ${konvaElement.attrs.width?.toFixed(1)} x ${konvaElement.attrs.height?.toFixed(1)}`);
                }
                
                if (konvaElement.attrs.radiusX && konvaElement.attrs.radiusY) {
                    console.log(`   • Radios: ${konvaElement.attrs.radiusX?.toFixed(1)} x ${konvaElement.attrs.radiusY?.toFixed(1)}`);
                }
                
                if (konvaElement.attrs.fill) {
                    console.log(`   • Fill: ${konvaElement.attrs.fill}`);
                }
                
                if (konvaElement.attrs.opacity && konvaElement.attrs.opacity !== 1) {
                    console.log(`   • Opacidad: ${konvaElement.attrs.opacity.toFixed(3)}`);
                }
                
                if (konvaElement.attrs.rotation && konvaElement.attrs.rotation !== 0) {
                    const degrees = (konvaElement.attrs.rotation * 180 / Math.PI).toFixed(1);
                    console.log(`   • Rotación: ${degrees}°`);
                }
                
                if (konvaElement.attrs.cornerRadius) {
                    console.log(`   • Corner Radius: ${konvaElement.attrs.cornerRadius?.toFixed(1)}`);
                }
                
                // Verificar si el elemento es visible
                if (konvaElement.attrs.visible === false) {
                    console.log(`   ❌ PROBLEMA: Elemento marcado como invisible`);
                }
                
                // Verificar si el elemento tiene tamaño 0
                if ((konvaElement.attrs.width === 0 || konvaElement.attrs.height === 0) && 
                    konvaElement.className !== 'Ellipse') {
                    console.log(`   ❌ PROBLEMA: Elemento con tamaño 0`);
                }
                
                // Verificar si el elemento está fuera del canvas
                const stageWidth = konvaJson.attrs.width;
                const stageHeight = konvaJson.attrs.height;
                
                if (konvaElement.attrs.x < -1000 || konvaElement.attrs.x > stageWidth + 1000 ||
                    konvaElement.attrs.y < -1000 || konvaElement.attrs.y > stageHeight + 1000) {
                    console.log(`   ⚠️  ADVERTENCIA: Elemento posiblemente fuera del canvas`);
                }
            });
            
            console.log('\n\n📊 DIAGNÓSTICO DE PROBLEMAS:');
            console.log('=' .repeat(70));
            
            // Buscar elementos específicos que faltan
            const circleFound = konvaElements.some(el => el.className === 'Ellipse');
            const abstractFound = konvaElements.some(el => 
                el.className === 'Rect' && el.attrs.cornerRadius && el.attrs.cornerRadius > 50
            );
            const rotatedFound = konvaElements.some(el => 
                el.attrs.rotation && Math.abs(el.attrs.rotation) > 1
            );
            
            console.log(`\n🔵 CÍRCULO:`);
            if (circleFound) {
                console.log(`   ✅ Encontrado como Ellipse`);
            } else {
                console.log(`   ❌ NO ENCONTRADO - Posibles causas:`);
                console.log(`      • Error en conversión de circle a Ellipse`);
                console.log(`      • Problema con cálculo de radios`);
                console.log(`      • Elemento invisible o fuera del canvas`);
            }
            
            console.log(`\n🎨 FIGURA ABSTRACTA (blob14):`);
            if (abstractFound) {
                console.log(`   ✅ Encontrada como Rect con cornerRadius`);
            } else {
                console.log(`   ❌ NO ENCONTRADA - Posibles causas:`);
                console.log(`      • Error en detección de subType 'blob14'`);
                console.log(`      • Problema con cálculo de cornerRadius`);
                console.log(`      • Elemento convertido pero sin cornerRadius visible`);
            }
            
            console.log(`\n📐 CUADRADO ROTADO:`);
            if (rotatedFound) {
                console.log(`   ✅ Rotación aplicada correctamente`);
            } else {
                console.log(`   ❌ ROTACIÓN NO APLICADA - Posibles causas:`);
                console.log(`      • Error en conversión de grados a radianes`);
                console.log(`      • Rotación perdida durante la conversión`);
                console.log(`      • Valor de rotación demasiado pequeño`);
            }
            
            console.log('\n\n🛠️  PRÓXIMOS PASOS:');
            console.log('=' .repeat(70));
            
            if (!circleFound) {
                console.log('1. 🔵 CORREGIR CÍRCULO:');
                console.log('   • Verificar conversión de figure/circle a Ellipse');
                console.log('   • Revisar cálculos de radiusX y radiusY');
                console.log('   • Verificar posicionamiento del centro');
            }
            
            if (!abstractFound) {
                console.log('2. 🎨 CORREGIR FIGURA ABSTRACTA:');
                console.log('   • Verificar detección de subType "blob14"');
                console.log('   • Revisar cálculo de cornerRadius');
                console.log('   • Asegurar que se aplique correctamente');
            }
            
            if (!rotatedFound) {
                console.log('3. 📐 CORREGIR ROTACIÓN:');
                console.log('   • Verificar conversión de grados a radianes');
                console.log('   • Asegurar que rotation se preserve');
                console.log('   • Revisar orden de aplicación de transformaciones');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.close();
    }
}

debugMissingElements();