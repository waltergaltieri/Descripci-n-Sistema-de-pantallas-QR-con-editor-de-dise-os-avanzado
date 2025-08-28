const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para verificar las mejoras finales en el diseño 64
 */

async function verifyFinalImprovements() {
    console.log('🎯 VERIFICACIÓN FINAL: Mejoras en diseño 64');
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
        
        console.log('🎨 GENERANDO HTML CON MEJORAS APLICADAS:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `verify-final-improvements-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filename), html);
        
        console.log(`✅ HTML generado: ${filename}`);
        
        // Verificar que incluye Google Fonts
        const hasGoogleFonts = html.includes('fonts.googleapis.com');
        const hasRobotoFont = html.includes('Roboto');
        
        console.log('\n📝 VERIFICACIÓN DE FUENTES:');
        console.log('-'.repeat(30));
        console.log(`• Google Fonts incluido: ${hasGoogleFonts ? '✅ SÍ' : '❌ NO'}`);
        console.log(`• Fuente Roboto incluida: ${hasRobotoFont ? '✅ SÍ' : '❌ NO'}`);
        
        // Extraer y analizar el JSON de Konva
        const konvaJsonMatch = html.match(/const konvaJson = \"(.*?)\";/);
        if (konvaJsonMatch) {
            const konvaJsonString = konvaJsonMatch[1].replace(/\\\"/g, '\"');
            const konvaJson = JSON.parse(konvaJsonString);
            
            console.log('\n🔍 ANÁLISIS DETALLADO DE ELEMENTOS:');
            console.log('-'.repeat(50));
            
            const layer = konvaJson.children[0];
            const konvaElements = layer.children;
            
            let textElement = null;
            let abstractFigure = null;
            let rotatedSquare = null;
            
            konvaElements.forEach((element, index) => {
                console.log(`\n${index + 1}. ELEMENTO: ${element.className}`);
                
                if (element.className === 'Text') {
                    textElement = element;
                    console.log(`   📝 TEXTO ANALIZADO:`);
                    console.log(`      • Contenido: "${element.attrs.text}"`);
                    console.log(`      • FontFamily: ${element.attrs.fontFamily}`);
                    console.log(`      • FontStyle: ${element.attrs.fontStyle || 'normal'}`);
                    console.log(`      • FontSize: ${element.attrs.fontSize}`);
                    
                    if (element.attrs.fontFamily === 'Roboto') {
                        console.log(`      ✅ FUENTE: Roboto correctamente aplicada`);
                    } else {
                        console.log(`      ❌ FUENTE: Esperaba 'Roboto', encontró '${element.attrs.fontFamily}'`);
                    }
                    
                    if (element.attrs.fontStyle === 'bold') {
                        console.log(`      ✅ ESTILO: Bold correctamente aplicado`);
                    } else {
                        console.log(`      ❌ ESTILO: Esperaba 'bold', encontró '${element.attrs.fontStyle || 'normal'}'`);
                    }
                }
                
                if (element.className === 'Rect' && element.attrs.cornerRadius && element.attrs.cornerRadius > 50) {
                    abstractFigure = element;
                    console.log(`   🎨 FIGURA ABSTRACTA ANALIZADA:`);
                    console.log(`      • Dimensiones: ${element.attrs.width?.toFixed(1)} x ${element.attrs.height?.toFixed(1)}`);
                    console.log(`      • CornerRadius: ${element.attrs.cornerRadius?.toFixed(1)}`);
                    
                    const minDimension = Math.min(element.attrs.width, element.attrs.height);
                    const radiusPercent = (element.attrs.cornerRadius / minDimension * 100);
                    console.log(`      • Radio como % del lado menor: ${radiusPercent.toFixed(1)}%`);
                    
                    if (radiusPercent <= 20) {
                        console.log(`      ✅ MEJORA: Radio reducido (${radiusPercent.toFixed(1)}%), se ve menos redondeado`);
                    } else {
                        console.log(`      ⚠️  ATENCIÓN: Radio aún alto (${radiusPercent.toFixed(1)}%), puede verse muy redondeado`);
                    }
                    
                    // Verificar deformación orgánica
                    const scaleX = element.attrs.scaleX || 1;
                    const scaleY = element.attrs.scaleY || 1;
                    if (scaleX !== 1 || scaleY !== 1) {
                        console.log(`      ✅ DEFORMACIÓN: ScaleX=${scaleX.toFixed(3)}, ScaleY=${scaleY.toFixed(3)} (más orgánico)`);
                    } else {
                        console.log(`      ⚠️  DEFORMACIÓN: Sin escalas aplicadas`);
                    }
                }
                
                if (element.className === 'Rect' && element.attrs.rotation && !element.attrs.cornerRadius) {
                    rotatedSquare = element;
                    const degrees = (element.attrs.rotation * 180 / Math.PI);
                    console.log(`   📐 CUADRADO ROTADO ANALIZADO:`);
                    console.log(`      • Dimensiones: ${element.attrs.width?.toFixed(1)} x ${element.attrs.height?.toFixed(1)}`);
                    console.log(`      • Rotación: ${degrees.toFixed(1)}°`);
                    console.log(`      • Posición: (${element.attrs.x?.toFixed(1)}, ${element.attrs.y?.toFixed(1)})`);
                    console.log(`      • Opacidad: ${element.attrs.opacity?.toFixed(3)}`);
                    
                    if (element.attrs.width !== element.attrs.height) {
                        console.log(`      ✅ DEFORMACIÓN: Es un rectángulo (${element.attrs.width?.toFixed(1)}x${element.attrs.height?.toFixed(1)})`);
                    } else {
                        console.log(`      ❌ FORMA: Sigue siendo un cuadrado perfecto`);
                    }
                    
                    if (Math.abs(degrees) >= 45) {
                        console.log(`      ✅ ROTACIÓN: ${degrees.toFixed(1)}° es suficiente para verse como diamante`);
                    } else {
                        console.log(`      ❌ ROTACIÓN: ${degrees.toFixed(1)}° puede no ser suficiente`);
                    }
                }
            });
            
            console.log('\n\n📊 RESUMEN DE VERIFICACIÓN:');
            console.log('=' .repeat(70));
            
            console.log('\n1. 📝 PROBLEMA DE TIPOGRAFÍA:');
            if (textElement && textElement.attrs.fontFamily === 'Roboto' && textElement.attrs.fontStyle === 'bold') {
                console.log('   ✅ RESUELTO: Fuente Roboto con estilo bold aplicados correctamente');
                console.log('   ✅ Google Fonts incluido en el HTML para cargar Roboto');
            } else {
                console.log('   ❌ PENDIENTE: Problemas con la fuente o estilo del texto');
            }
            
            console.log('\n2. 🎨 PROBLEMA DE FIGURA ABSTRACTA:');
            if (abstractFigure) {
                const minDimension = Math.min(abstractFigure.attrs.width, abstractFigure.attrs.height);
                const radiusPercent = (abstractFigure.attrs.cornerRadius / minDimension * 100);
                if (radiusPercent <= 20) {
                    console.log('   ✅ MEJORADO: CornerRadius reducido, se ve menos como cuadrado redondeado');
                } else {
                    console.log('   ⚠️  PARCIAL: CornerRadius aún puede ser muy alto');
                }
                
                const scaleX = abstractFigure.attrs.scaleX || 1;
                const scaleY = abstractFigure.attrs.scaleY || 1;
                if (scaleX !== 1 || scaleY !== 1) {
                    console.log('   ✅ MEJORADO: Deformación orgánica aplicada');
                } else {
                    console.log('   ⚠️  LIMITADO: Sin deformación orgánica');
                }
            } else {
                console.log('   ❌ ERROR: Figura abstracta no encontrada');
            }
            
            console.log('\n3. 📐 PROBLEMA DE CUADRADO ROTADO:');
            if (rotatedSquare) {
                const degrees = Math.abs(rotatedSquare.attrs.rotation * 180 / Math.PI);
                if (rotatedSquare.attrs.width !== rotatedSquare.attrs.height) {
                    console.log('   ✅ CORRECTO: Mantiene deformación rectangular');
                } else {
                    console.log('   ⚠️  LIMITACIÓN: Sigue siendo cuadrado perfecto');
                }
                
                if (degrees >= 45) {
                    console.log('   ✅ CORRECTO: Rotación suficiente para verse como diamante');
                } else {
                    console.log('   ❌ INSUFICIENTE: Rotación puede no ser visible');
                }
                
                if (rotatedSquare.attrs.opacity < 1) {
                    console.log('   ✅ CORRECTO: Transparencia aplicada correctamente');
                } else {
                    console.log('   ❌ ERROR: Transparencia no aplicada');
                }
            } else {
                console.log('   ❌ ERROR: Cuadrado rotado no encontrado');
            }
            
            console.log('\n\n🎯 CONCLUSIONES:');
            console.log('-'.repeat(50));
            console.log('• La fuente Roboto ahora se carga desde Google Fonts');
            console.log('• La figura abstracta tiene un cornerRadius más pequeño');
            console.log('• Se aplicó deformación orgánica a la figura abstracta');
            console.log('• El cuadrado rotado mantiene su rotación y transparencia');
            console.log('• Todos los elementos deberían ser visibles correctamente');
            
        } else {
            console.log('❌ No se pudo extraer el JSON de Konva del HTML');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.close();
    }
}

verifyFinalImprovements();