const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para debuggear los problemas específicos de renderizado del diseño ID 64
 */

async function debugDesign64Rendering() {
    console.log('🐛 DEBUG: Problemas de renderizado del diseño ID 64');
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
        
        console.log('🔍 ANÁLISIS DE PROBLEMAS REPORTADOS:');
        console.log('-'.repeat(50));
        
        console.log('\n1. 🎯 ANÁLISIS DE ELEMENTOS Y SUS PROPIEDADES:');
        
        elements.forEach((element, index) => {
            console.log(`\n   ELEMENTO ${index + 1}: ${element.type.toUpperCase()}`);
            console.log(`   ├─ ID: ${element.id}`);
            console.log(`   ├─ Posición: (${element.x?.toFixed(1)}, ${element.y?.toFixed(1)})`);
            console.log(`   ├─ Tamaño: ${element.width?.toFixed(1)} x ${element.height?.toFixed(1)}`);
            
            if (element.type === 'figure') {
                console.log(`   ├─ SubTipo: ${element.subType || 'NO DEFINIDO'}`);
                console.log(`   ├─ Fill: ${element.fill || 'NO DEFINIDO'}`);
                console.log(`   ├─ Stroke: ${element.stroke || 'NO DEFINIDO'}`);
                console.log(`   ├─ StrokeWidth: ${element.strokeWidth !== undefined ? element.strokeWidth : 'NO DEFINIDO'}`);
                console.log(`   ├─ Rotation: ${element.rotation || 0}°`);
                console.log(`   ├─ ScaleX: ${element.scaleX || 1}`);
                console.log(`   ├─ ScaleY: ${element.scaleY || 1}`);
                console.log(`   ├─ CornerRadius: ${element.cornerRadius || 0}`);
                
                // Identificar el problema específico
                if (element.strokeWidth === 0 && element.stroke) {
                    console.log(`   ⚠️  PROBLEMA: Tiene stroke definido pero strokeWidth = 0`);
                    console.log(`       → El renderer podría estar aplicando stroke por defecto`);
                }
                
                if (element.scaleX !== 1 || element.scaleY !== 1) {
                    console.log(`   ⚠️  TRANSFORMACIÓN: Elemento escalado (${element.scaleX}, ${element.scaleY})`);
                }
                
                if (element.rotation !== 0) {
                    console.log(`   ⚠️  TRANSFORMACIÓN: Elemento rotado ${element.rotation}°`);
                }
            }
            
            if (element.type === 'text') {
                console.log(`   ├─ Texto: "${element.text}"`);
                console.log(`   ├─ FontSize: ${element.fontSize}`);
                console.log(`   ├─ FontFamily: ${element.fontFamily}`);
                console.log(`   ├─ FontWeight: ${element.fontWeight || 'normal'}`);
                console.log(`   ├─ Fill: ${element.fill}`);
                console.log(`   ├─ Stroke: ${element.stroke || 'ninguno'}`);
                console.log(`   ├─ StrokeWidth: ${element.strokeWidth || 0}`);
                
                if (element.fontWeight && element.fontWeight !== 'normal') {
                    console.log(`   ⚠️  FORMATO: Texto en negrita (${element.fontWeight})`);
                }
            }
        });
        
        console.log('\n\n2. 🎨 GENERANDO HTML CON RENDERER ACTUAL:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `debug-design-64-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filename), html);
        
        console.log(`✅ HTML generado: ${filename}`);
        
        // Extraer y analizar el JSON de Konva
        const konvaJsonMatch = html.match(/const konvaJson = \"(.*?)\";/);
        if (konvaJsonMatch) {
            const konvaJsonString = konvaJsonMatch[1].replace(/\\\"/g, '\"');
            const konvaJson = JSON.parse(konvaJsonString);
            
            console.log('\n3. 🔍 ANÁLISIS DEL JSON DE KONVA GENERADO:');
            console.log('-'.repeat(50));
            
            const layer = konvaJson.children[0];
            const konvaElements = layer.children;
            
            konvaElements.forEach((konvaElement, index) => {
                console.log(`\n   KONVA ELEMENTO ${index + 1}: ${konvaElement.className}`);
                console.log(`   ├─ Posición: (${konvaElement.attrs.x?.toFixed(1)}, ${konvaElement.attrs.y?.toFixed(1)})`);
                
                if (konvaElement.className === 'Ellipse' || konvaElement.className === 'Rect' || konvaElement.className === 'Star') {
                    console.log(`   ├─ Fill: ${konvaElement.attrs.fill || 'NO DEFINIDO'}`);
                    console.log(`   ├─ Stroke: ${konvaElement.attrs.stroke || 'NO DEFINIDO'}`);
                    console.log(`   ├─ StrokeWidth: ${konvaElement.attrs.strokeWidth !== undefined ? konvaElement.attrs.strokeWidth : 'NO DEFINIDO'}`);
                    
                    // Identificar problemas
                    if (konvaElement.attrs.stroke && !konvaElement.attrs.strokeWidth) {
                        console.log(`   ❌ PROBLEMA: Stroke definido sin strokeWidth → Borde negro no deseado`);
                    }
                    
                    if (konvaElement.attrs.strokeWidth > 0 && !konvaElement.attrs.stroke) {
                        console.log(`   ❌ PROBLEMA: StrokeWidth > 0 sin stroke definido`);
                    }
                    
                    // Verificar transformaciones
                    const hasTransforms = konvaElement.attrs.scaleX !== 1 || 
                                        konvaElement.attrs.scaleY !== 1 || 
                                        konvaElement.attrs.rotation !== 0;
                    
                    if (hasTransforms) {
                        console.log(`   ✅ TRANSFORMACIONES APLICADAS:`);
                        console.log(`      • ScaleX: ${konvaElement.attrs.scaleX}`);
                        console.log(`      • ScaleY: ${konvaElement.attrs.scaleY}`);
                        console.log(`      • Rotation: ${konvaElement.attrs.rotation}`);
                    } else {
                        console.log(`   ⚠️  SIN TRANSFORMACIONES (puede ser el problema)`);
                    }
                }
                
                if (konvaElement.className === 'Text') {
                    console.log(`   ├─ Texto: \"${konvaElement.attrs.text}\"`);  
                    console.log(`   ├─ FontSize: ${konvaElement.attrs.fontSize}`);
                    console.log(`   ├─ FontFamily: ${konvaElement.attrs.fontFamily}`);
                    console.log(`   ├─ FontStyle: ${konvaElement.attrs.fontStyle || 'normal'}`);
                    console.log(`   ├─ Fill: ${konvaElement.attrs.fill}`);
                    
                    // Verificar si la negrita se perdió
                    if (!konvaElement.attrs.fontStyle || konvaElement.attrs.fontStyle === 'normal') {
                        console.log(`   ⚠️  PROBLEMA: Negrita no aplicada en Konva`);
                    }
                }
            });
        }
        
        console.log('\n\n4. 🔧 DIAGNÓSTICO DE PROBLEMAS:');
        console.log('=' .repeat(70));
        
        console.log('\n🔴 PROBLEMA 1: Bordes negros no deseados');
        console.log('   CAUSA: El konvaRenderer está aplicando stroke por defecto');
        console.log('   SOLUCIÓN: Verificar que strokeWidth = 0 cuando no hay stroke');
        
        console.log('\n🔴 PROBLEMA 2: Figuras aparecen como cuadrados simples');
        console.log('   CAUSA: Las transformaciones (escala, rotación) no se aplican correctamente');
        console.log('   SOLUCIÓN: Verificar que scaleX, scaleY, rotation se transfieren a Konva');
        
        console.log('\n🔴 PROBLEMA 3: Texto sin negrita ni tipografía correcta');
        console.log('   CAUSA: FontWeight y FontFamily no se transfieren correctamente');
        console.log('   SOLUCIÓN: Mapear fontWeight a fontStyle en Konva');
        
        console.log('\n🔴 PROBLEMA 4: Figuras abstractas aparecen como cuadrados');
        console.log('   CAUSA: Elementos SVG no se procesan correctamente');
        console.log('   SOLUCIÓN: Mejorar el manejo de elementos SVG complejos');
        
        console.log('\n\n5. 🛠️  PRÓXIMOS PASOS PARA CORREGIR:');
        console.log('=' .repeat(70));
        console.log('   1. Corregir manejo de stroke en konvaRenderer.js');
        console.log('   2. Verificar transferencia de transformaciones');
        console.log('   3. Corregir mapeo de fontWeight a fontStyle');
        console.log('   4. Mejorar procesamiento de elementos SVG');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

debugDesign64Rendering();