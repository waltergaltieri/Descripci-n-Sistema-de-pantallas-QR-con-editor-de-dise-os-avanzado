const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para diagnosticar por qué el texto "1" no está en la posición correcta
 */

async function debugTextPosition() {
    console.log('🎯 DIAGNÓSTICO: Posición del texto "1" en diseño 64');
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
        
        console.log('📊 ANÁLISIS DE COORDENADAS ORIGINALES:');
        console.log('-'.repeat(50));
        
        // Encontrar el elemento de texto
        const textElement = elements.find(el => el.type === 'text');
        
        if (textElement) {
            console.log('📝 ELEMENTO DE TEXTO ORIGINAL:');
            console.log(`   • Texto: "${textElement.text}"`);
            console.log(`   • Posición X: ${textElement.x}`);
            console.log(`   • Posición Y: ${textElement.y}`);
            console.log(`   • Ancho: ${textElement.width}`);
            console.log(`   • Alto: ${textElement.height}`);
            console.log(`   • FontSize: ${textElement.fontSize}`);
            console.log(`   • FontFamily: ${textElement.fontFamily}`);
            console.log(`   • Align: ${textElement.align || 'no definido'}`);
            
            // Calcular posición del centro del texto
            const centerX = textElement.x + (textElement.width / 2);
            const centerY = textElement.y + (textElement.height / 2);
            console.log(`   • Centro calculado: (${centerX}, ${centerY})`);
            
        } else {
            console.log('❌ No se encontró elemento de texto');
            return;
        }
        
        console.log('\n🎨 GENERANDO HTML Y ANALIZANDO KONVA:');
        console.log('-'.repeat(50));
        
        const html = konvaRenderer.renderWithKonva(content, design.name);
        const filename = `debug-text-position-${Date.now()}.html`;
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
            const konvaElements = layer.children;
            
            const konvaTextElement = konvaElements.find(el => el.className === 'Text');
            
            if (konvaTextElement) {
                console.log('📝 ELEMENTO DE TEXTO EN KONVA:');
                console.log(`   • Texto: "${konvaTextElement.attrs.text}"`);
                console.log(`   • Posición X: ${konvaTextElement.attrs.x}`);
                console.log(`   • Posición Y: ${konvaTextElement.attrs.y}`);
                console.log(`   • Ancho: ${konvaTextElement.attrs.width}`);
                console.log(`   • Alto: ${konvaTextElement.attrs.height}`);
                console.log(`   • FontSize: ${konvaTextElement.attrs.fontSize}`);
                console.log(`   • FontFamily: ${konvaTextElement.attrs.fontFamily}`);
                console.log(`   • Align: ${konvaTextElement.attrs.align}`);
                
                console.log('\n📐 COMPARACIÓN DE POSICIONES:');
                console.log('-'.repeat(30));
                
                const deltaX = konvaTextElement.attrs.x - textElement.x;
                const deltaY = konvaTextElement.attrs.y - textElement.y;
                
                console.log(`• Diferencia X: ${deltaX.toFixed(1)} (Original: ${textElement.x}, Konva: ${konvaTextElement.attrs.x})`);
                console.log(`• Diferencia Y: ${deltaY.toFixed(1)} (Original: ${textElement.y}, Konva: ${konvaTextElement.attrs.y})`);
                
                if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
                    console.log('❌ PROBLEMA DETECTADO: Las posiciones no coinciden');
                    
                    console.log('\n🔍 ANÁLISIS DETALLADO:');
                    console.log('-'.repeat(30));
                    
                    // Verificar si hay diferencias en dimensiones
                    const deltaWidth = konvaTextElement.attrs.width - textElement.width;
                    const deltaHeight = konvaTextElement.attrs.height - textElement.height;
                    
                    console.log(`• Diferencia Ancho: ${deltaWidth.toFixed(1)}`);
                    console.log(`• Diferencia Alto: ${deltaHeight.toFixed(1)}`);
                    
                    // Verificar alineación
                    if (textElement.align !== konvaTextElement.attrs.align) {
                        console.log(`❌ ALINEACIÓN DIFERENTE: Original='${textElement.align || 'undefined'}', Konva='${konvaTextElement.attrs.align}'`);
                    }
                    
                    // Verificar si el problema está en el cálculo del renderer
                    console.log('\n🛠️  POSIBLES CAUSAS:');
                    console.log('1. El renderer está modificando las coordenadas');
                    console.log('2. Konva interpreta las posiciones de manera diferente');
                    console.log('3. La alineación del texto afecta la posición');
                    console.log('4. Las dimensiones del contenedor afectan el posicionamiento');
                    
                } else {
                    console.log('✅ POSICIONES CORRECTAS: Las coordenadas coinciden');
                }
                
                console.log('\n📏 INFORMACIÓN ADICIONAL:');
                console.log('-'.repeat(30));
                console.log(`• Dimensiones del canvas: ${content.width}x${content.height}`);
                console.log(`• Posición relativa X: ${(konvaTextElement.attrs.x / content.width * 100).toFixed(1)}%`);
                console.log(`• Posición relativa Y: ${(konvaTextElement.attrs.y / content.height * 100).toFixed(1)}%`);
                
            } else {
                console.log('❌ No se encontró elemento de texto en Konva');
            }
            
        } else {
            console.log('❌ No se pudo extraer el JSON de Konva del HTML');
        }
        
        console.log('\n\n🔍 REVISIÓN DEL CÓDIGO DEL RENDERER:');
        console.log('-'.repeat(50));
        
        // Leer el código del renderer para ver cómo maneja las posiciones de texto
        const rendererPath = path.join(__dirname, 'utils', 'konvaRenderer.js');
        const rendererCode = fs.readFileSync(rendererPath, 'utf8');
        
        // Buscar la sección que maneja elementos de texto
        const textHandlingMatch = rendererCode.match(/case 'text':[\s\S]*?break;/);
        
        if (textHandlingMatch) {
            console.log('📝 CÓDIGO QUE MANEJA ELEMENTOS DE TEXTO:');
            console.log(textHandlingMatch[0]);
            
            console.log('\n🔍 ANÁLISIS DEL CÓDIGO:');
            if (textHandlingMatch[0].includes('child.x') && textHandlingMatch[0].includes('child.y')) {
                console.log('✅ El renderer usa directamente child.x y child.y');
            } else {
                console.log('❌ El renderer podría estar modificando las coordenadas');
            }
            
            if (textHandlingMatch[0].includes('align')) {
                console.log('⚠️  El renderer maneja alineación, esto podría afectar la posición');
            }
        }
        
        console.log('\n\n💡 RECOMENDACIONES:');
        console.log('-'.repeat(50));
        console.log('1. Verificar que las coordenadas se copien exactamente del JSON original');
        console.log('2. Revisar si la alineación del texto afecta el posicionamiento');
        console.log('3. Considerar las diferencias entre el sistema de coordenadas de Polotno y Konva');
        console.log('4. Verificar si hay transformaciones adicionales aplicadas');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.close();
    }
}

debugTextPosition();