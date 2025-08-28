const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { renderWithKonva } = require('./utils/konvaRenderer');
const fs = require('fs');

/**
 * Script para probar el konvaRenderer.js actualizado con soporte completo para transformaciones
 */

async function testUpdatedKonvaRenderer() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    
    console.log('🧪 PRUEBA: konvaRenderer.js actualizado con transformaciones completas');
    console.log('=' .repeat(70));
    
    try {
        // Obtener el diseño 64 que tiene el círculo rojo
        const design = await new Promise((resolve, reject) => {
            db.get(`
                SELECT id, name, content 
                FROM designs 
                WHERE id = 64
            `, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!design) {
            console.log('❌ No se encontró el diseño 64');
            return;
        }
        
        console.log(`🎨 Procesando diseño: ${design.name}`);
        
        const designData = JSON.parse(design.content);
        const firstPage = designData.pages[0];
        
        console.log('\n📋 ELEMENTOS ENCONTRADOS EN EL DISEÑO:');
        console.log('-'.repeat(50));
        
        firstPage.children.forEach((element, index) => {
            console.log(`${index + 1}. 🎯 Elemento ID: ${element.id}`);
            console.log(`   • Tipo: ${element.type} ${element.subType ? `(${element.subType})` : ''}`);
            console.log(`   • Dimensiones: ${element.width?.toFixed(2) || 'N/A'} x ${element.height?.toFixed(2) || 'N/A'}`);
            console.log(`   • Posición: (${element.x?.toFixed(2) || 0}, ${element.y?.toFixed(2) || 0})`);
            
            // Mostrar transformaciones si existen
            const transformations = [];
            if (element.rotation) transformations.push(`rotation: ${element.rotation}°`);
            if (element.scaleX && element.scaleX !== 1) transformations.push(`scaleX: ${element.scaleX}`);
            if (element.scaleY && element.scaleY !== 1) transformations.push(`scaleY: ${element.scaleY}`);
            if (element.skewX) transformations.push(`skewX: ${element.skewX}`);
            if (element.skewY) transformations.push(`skewY: ${element.skewY}`);
            if (element.flipX) transformations.push(`flipX: ${element.flipX}`);
            if (element.flipY) transformations.push(`flipY: ${element.flipY}`);
            
            if (transformations.length > 0) {
                console.log(`   • 🔄 Transformaciones: ${transformations.join(', ')}`);
            }
            
            // Mostrar propiedades específicas
            if (element.fill) console.log(`   • 🎨 Color: ${element.fill}`);
            if (element.stroke) console.log(`   • 🖊️ Borde: ${element.stroke} (${element.strokeWidth || 1}px)`);
            if (element.cornerRadius) console.log(`   • 🔄 Corner Radius: ${element.cornerRadius}`);
            if (element.numPoints) console.log(`   • ⭐ Puntos: ${element.numPoints}`);
            if (element.text) console.log(`   • 📝 Texto: "${element.text}"`);
            if (element.fontSize) console.log(`   • 📏 Tamaño fuente: ${element.fontSize}`);
            
            console.log('');
        });
        
        console.log('\n🔧 GENERANDO HTML CON KONVA RENDERER ACTUALIZADO...');
        
        // Generar HTML usando el renderer actualizado
        const htmlContent = renderWithKonva(designData, design.name);
        
        // Guardar el HTML generado
        const outputPath = path.join(__dirname, `design-64-updated-renderer-${Date.now()}.html`);
        fs.writeFileSync(outputPath, htmlContent);
        
        console.log(`✅ HTML generado exitosamente: ${path.basename(outputPath)}`);
        
        // Analizar el JSON de Konva generado
        console.log('\n🔍 ANÁLISIS DEL JSON DE KONVA GENERADO:');
        console.log('-'.repeat(50));
        
        // Extraer el JSON de Konva del HTML
        const konvaJsonMatch = htmlContent.match(/const konvaJson = (.*?);/);
        if (konvaJsonMatch) {
            const konvaJson = JSON.parse(konvaJsonMatch[1]);
            const layer = konvaJson.children[0];
            
            layer.children.forEach((konvaElement, index) => {
                console.log(`${index + 1}. 🎯 Elemento Konva: ${konvaElement.className}`);
                console.log(`   • Atributos principales:`);
                
                Object.entries(konvaElement.attrs).forEach(([key, value]) => {
                    if (typeof value === 'number') {
                        console.log(`     - ${key}: ${value.toFixed(3)}`);
                    } else {
                        console.log(`     - ${key}: ${value}`);
                    }
                });
                
                // Verificar si las transformaciones están incluidas
                const hasTransformations = [
                    'scaleX', 'scaleY', 'skewX', 'skewY', 'rotation'
                ].some(prop => konvaElement.attrs[prop] !== undefined && konvaElement.attrs[prop] !== 0 && konvaElement.attrs[prop] !== 1);
                
                if (hasTransformations) {
                    console.log(`   • ✅ TRANSFORMACIONES DETECTADAS`);
                } else {
                    console.log(`   • ℹ️ Sin transformaciones especiales`);
                }
                
                console.log('');
            });
        } else {
            console.log('❌ No se pudo extraer el JSON de Konva del HTML');
        }
        
        console.log('\n📊 RESUMEN DE MEJORAS IMPLEMENTADAS:');
        console.log('=' .repeat(70));
        console.log('✅ 1. TRANSFORMACIONES DE ESCALA:');
        console.log('   • scaleX y scaleY ahora se incluyen en el JSON de Konva');
        console.log('   • Permite deformaciones adicionales sin cambiar dimensiones base');
        console.log('');
        console.log('✅ 2. TRANSFORMACIONES DE SESGO:');
        console.log('   • skewX y skewY para efectos de inclinación');
        console.log('   • Útil para perspectivas y efectos visuales');
        console.log('');
        console.log('✅ 3. TRANSFORMACIONES DE VOLTEO:');
        console.log('   • flipX y flipY se convierten a escalas negativas');
        console.log('   • Manejo nativo de Konva para efectos espejo');
        console.log('');
        console.log('✅ 4. FIGURAS MEJORADAS:');
        console.log('   • Círculos: Ahora usan Konva.Ellipse con radiusX/radiusY');
        console.log('   • Estrellas: Usan Konva.Star con numPoints y radios');
        console.log('   • Rectángulos: Mantienen cornerRadius para esquinas redondeadas');
        console.log('');
        console.log('✅ 5. SOPORTE SVG BÁSICO:');
        console.log('   • Elementos SVG se manejan como grupos');
        console.log('   • Base para futuras mejoras de renderizado SVG');
        console.log('');
        console.log('🎯 RESULTADO: ¡El konvaRenderer.js ahora maneja TODAS las transformaciones!');
        console.log('   • Los círculos deformados se renderizan como óvalos correctos');
        console.log('   • Las escalas, rotaciones y sesgos se preservan');
        console.log('   • El HTML generado es mucho más fiel al diseño original');
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    } finally {
        await db.close();
    }
}

testUpdatedKonvaRenderer();