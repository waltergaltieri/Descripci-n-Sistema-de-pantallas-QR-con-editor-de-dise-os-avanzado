const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para diagnosticar los problemas restantes en el diseño 64
 */

async function debugRemainingIssues() {
    console.log('🔍 DIAGNÓSTICO: Problemas restantes en diseño 64');
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
        
        console.log('🎯 ANÁLISIS DE PROBLEMAS ESPECÍFICOS:');
        console.log('-'.repeat(50));
        
        elements.forEach((element, index) => {
            console.log(`\n${index + 1}. ELEMENTO: ${element.type} (${element.subType || 'N/A'})`);
            console.log(`   • ID: ${element.id}`);
            
            // PROBLEMA 1: Tipografía del texto
            if (element.type === 'text') {
                console.log(`\n   📝 ANÁLISIS DE TEXTO:`);
                console.log(`      • Texto: "${element.text}"`);
                console.log(`      • FontFamily: ${element.fontFamily || 'no definida'}`);
                console.log(`      • FontWeight: ${element.fontWeight || 'no definido'}`);
                console.log(`      • FontSize: ${element.fontSize || 'no definido'}`);
                
                if (element.fontFamily !== 'Roboto') {
                    console.log(`      ❌ PROBLEMA: FontFamily debería ser 'Roboto', pero es '${element.fontFamily}'`);
                }
                
                if (element.fontWeight !== 'bold') {
                    console.log(`      ❌ PROBLEMA: FontWeight debería ser 'bold', pero es '${element.fontWeight}'`);
                }
            }
            
            // PROBLEMA 2: Cuadrado rotado que no muestra rotación
            if (element.type === 'figure' && element.subType === 'diamond') {
                console.log(`\n   📐 ANÁLISIS DE CUADRADO ROTADO (DIAMOND):`);
                console.log(`      • Dimensiones: ${element.width?.toFixed(1)} x ${element.height?.toFixed(1)}`);
                console.log(`      • Rotación: ${element.rotation || 0}°`);
                console.log(`      • ScaleX: ${element.scaleX || 1}`);
                console.log(`      • ScaleY: ${element.scaleY || 1}`);
                
                if (element.width === element.height) {
                    console.log(`      ❌ PROBLEMA: Es un cuadrado perfecto (${element.width}x${element.height})`);
                    console.log(`      💡 SOLUCIÓN: Debería ser deformado para verse como diamante`);
                } else {
                    console.log(`      ✅ DEFORMACIÓN: Correcta (${element.width?.toFixed(1)}x${element.height?.toFixed(1)})`);
                }
                
                if (!element.rotation || Math.abs(element.rotation) < 45) {
                    console.log(`      ❌ PROBLEMA: Rotación insuficiente (${element.rotation || 0}°)`);
                } else {
                    console.log(`      ✅ ROTACIÓN: Correcta (${element.rotation}°)`);
                }
            }
            
            // PROBLEMA 3: Figura abstracta como cuadrado redondeado
            if (element.type === 'figure' && element.subType && element.subType.startsWith('blob')) {
                console.log(`\n   🎨 ANÁLISIS DE FIGURA ABSTRACTA (${element.subType}):`);
                console.log(`      • Dimensiones: ${element.width?.toFixed(1)} x ${element.height?.toFixed(1)}`);
                console.log(`      • CornerRadius original: ${element.cornerRadius || 'no definido'}`);
                
                const calculatedRadius = Math.min(element.width || 100, element.height || 100) * 0.3;
                console.log(`      • CornerRadius calculado: ${calculatedRadius.toFixed(1)}`);
                
                if (element.subType === 'blob14') {
                    console.log(`      ⚠️  LIMITACIÓN: 'blob14' se renderiza como Rect con cornerRadius`);
                    console.log(`      💡 MEJORA POSIBLE: Implementar formas SVG personalizadas`);
                }
            }
        });
        
        console.log('\n\n🎨 GENERANDO HTML Y ANALIZANDO KONVA JSON:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `debug-remaining-issues-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filename), html);
        
        console.log(`✅ HTML generado: ${filename}`);
        
        // Extraer y analizar el JSON de Konva
        const konvaJsonMatch = html.match(/const konvaJson = \"(.*?)\";/);
        if (konvaJsonMatch) {
            const konvaJsonString = konvaJsonMatch[1].replace(/\\\"/g, '\"');
            const konvaJson = JSON.parse(konvaJsonString);
            
            console.log('\n🔍 ANÁLISIS DEL JSON DE KONVA:');
            console.log('-'.repeat(50));
            
            const layer = konvaJson.children[0];
            const konvaElements = layer.children;
            
            konvaElements.forEach((konvaElement, index) => {
                console.log(`\n✅ ELEMENTO KONVA ${index + 1}: ${konvaElement.className}`);
                
                // Analizar texto
                if (konvaElement.className === 'Text') {
                    console.log(`   📝 TEXTO KONVA:`);
                    console.log(`      • Texto: "${konvaElement.attrs.text}"`);
                    console.log(`      • FontFamily: ${konvaElement.attrs.fontFamily}`);
                    console.log(`      • FontStyle: ${konvaElement.attrs.fontStyle || 'no definido'}`);
                    console.log(`      • FontSize: ${konvaElement.attrs.fontSize}`);
                    
                    if (konvaElement.attrs.fontFamily !== 'Roboto') {
                        console.log(`      ❌ PROBLEMA: FontFamily en Konva es '${konvaElement.attrs.fontFamily}', debería ser 'Roboto'`);
                    }
                    
                    if (konvaElement.attrs.fontStyle !== 'bold') {
                        console.log(`      ❌ PROBLEMA: FontStyle en Konva es '${konvaElement.attrs.fontStyle}', debería ser 'bold'`);
                    }
                }
                
                // Analizar cuadrado rotado
                if (konvaElement.className === 'Rect' && konvaElement.attrs.rotation) {
                    const degrees = (konvaElement.attrs.rotation * 180 / Math.PI).toFixed(1);
                    console.log(`   📐 RECTÁNGULO ROTADO:`);
                    console.log(`      • Dimensiones: ${konvaElement.attrs.width?.toFixed(1)} x ${konvaElement.attrs.height?.toFixed(1)}`);
                    console.log(`      • Rotación: ${degrees}°`);
                    console.log(`      • Posición: (${konvaElement.attrs.x?.toFixed(1)}, ${konvaElement.attrs.y?.toFixed(1)})`);
                    
                    if (konvaElement.attrs.width === konvaElement.attrs.height) {
                        console.log(`      ❌ PROBLEMA: Sigue siendo un cuadrado perfecto`);
                        console.log(`      💡 CAUSA: Las dimensiones originales no se preservan`);
                    } else {
                        console.log(`      ✅ DEFORMACIÓN: Preservada correctamente`);
                    }
                    
                    if (Math.abs(parseFloat(degrees)) < 45) {
                        console.log(`      ❌ PROBLEMA: Rotación insuficiente para verse como diamante`);
                    } else {
                        console.log(`      ✅ ROTACIÓN: Suficiente para verse como diamante`);
                    }
                }
                
                // Analizar figura abstracta
                if (konvaElement.className === 'Rect' && konvaElement.attrs.cornerRadius && konvaElement.attrs.cornerRadius > 50) {
                    console.log(`   🎨 FIGURA ABSTRACTA:`);
                    console.log(`      • Dimensiones: ${konvaElement.attrs.width?.toFixed(1)} x ${konvaElement.attrs.height?.toFixed(1)}`);
                    console.log(`      • CornerRadius: ${konvaElement.attrs.cornerRadius?.toFixed(1)}`);
                    
                    const radiusPercent = (konvaElement.attrs.cornerRadius / Math.min(konvaElement.attrs.width, konvaElement.attrs.height) * 100).toFixed(1);
                    console.log(`      • Radio como % del lado menor: ${radiusPercent}%`);
                    
                    if (parseFloat(radiusPercent) >= 50) {
                        console.log(`      ⚠️  LIMITACIÓN: Con ${radiusPercent}% de radio, se ve muy redondeado`);
                        console.log(`      💡 ALTERNATIVA: Reducir cornerRadius o usar formas SVG`);
                    }
                }
            });
            
            console.log('\n\n🛠️  SOLUCIONES PROPUESTAS:');
            console.log('=' .repeat(70));
            
            console.log('\n1. 📝 PROBLEMA DE TIPOGRAFÍA:');
            console.log('   • Verificar que fontFamily se preserve correctamente');
            console.log('   • Asegurar que fontWeight="bold" se mapee a fontStyle="bold"');
            console.log('   • Revisar si hay sobrescritura de fuentes en el HTML');
            
            console.log('\n2. 📐 PROBLEMA DE ROTACIÓN VISUAL:');
            console.log('   • La rotación se aplica correctamente (90°)');
            console.log('   • El problema puede ser que se ve como cuadrado normal');
            console.log('   • Verificar que las dimensiones deformadas se preserven');
            console.log('   • Considerar ajustar el punto de rotación');
            
            console.log('\n3. 🎨 PROBLEMA DE FIGURA ABSTRACTA:');
            console.log('   • Actualmente se renderiza como Rect con cornerRadius');
            console.log('   • Para formas más complejas, considerar:');
            console.log('     - Usar Konva.Path con datos SVG');
            console.log('     - Implementar formas personalizadas');
            console.log('     - Ajustar el cornerRadius para mejor apariencia');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.close();
    }
}

debugRemainingIssues();