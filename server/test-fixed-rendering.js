const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
require('dotenv').config();

async function testFixedRendering() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🧪 PROBANDO RENDERIZADO CON DIMENSIONES CORREGIDAS');
        console.log('=' .repeat(60));
        
        // 1. Obtener el diseño corregido
        const design = await db.get('SELECT id, name, content FROM designs WHERE id = 62');
        
        if (!design) {
            console.log('❌ No se encontró el diseño ID 62');
            return;
        }
        
        console.log(`📋 Diseño: ${design.name} (ID: ${design.id})`);
        
        // 2. Parsear el contenido
        const content = JSON.parse(design.content);
        
        console.log('');
        console.log('📐 DIMENSIONES EN EL JSON:');
        console.log(`   • content.width: ${content.width}`);
        console.log(`   • content.height: ${content.height}`);
        console.log(`   • pages[0].width: ${content.pages[0].width}`);
        console.log(`   • pages[0].height: ${content.pages[0].height}`);
        console.log('');
        
        // 3. Generar HTML usando konvaRenderer
        console.log('🎨 GENERANDO HTML CON KONVA RENDERER...');
        
        try {
            const html = konvaRenderer.renderWithKonva(content, design.name);
            
            // 4. Verificar las dimensiones en el HTML generado
            console.log('🔍 ANALIZANDO HTML GENERADO:');
            
            // Buscar dimensiones del canvas en el HTML
            const canvasWidthMatch = html.match(/width:\s*(\d+)/i);
            const canvasHeightMatch = html.match(/height:\s*(\d+)/i);
            
            if (canvasWidthMatch && canvasHeightMatch) {
                const htmlWidth = parseInt(canvasWidthMatch[1]);
                const htmlHeight = parseInt(canvasHeightMatch[1]);
                
                console.log(`   • Ancho en HTML: ${htmlWidth}px`);
                console.log(`   • Alto en HTML: ${htmlHeight}px`);
                
                const isCorrect = htmlWidth === 1920 && htmlHeight === 1080;
                console.log('');
                console.log(`🎯 RESULTADO: ${isCorrect ? '✅ DIMENSIONES CORRECTAS' : '❌ DIMENSIONES INCORRECTAS'}`);
                
                if (isCorrect) {
                    console.log('   → El HTML se genera con 1920x1080 como esperado');
                    console.log('   → El problema de renderizado está solucionado');
                } else {
                    console.log(`   → Se esperaba 1920x1080 pero se obtuvo ${htmlWidth}x${htmlHeight}`);
                }
                
            } else {
                console.log('   ❌ No se pudieron encontrar las dimensiones en el HTML');
            }
            
            // 5. Verificar que el HTML contiene los elementos
            const elementCount = (html.match(/<div[^>]*class="[^"]*element[^"]*"/g) || []).length;
            console.log('');
            console.log(`📊 ELEMENTOS RENDERIZADOS: ${elementCount}`);
            
            // 6. Guardar el HTML para inspección
            const fs = require('fs');
            const filename = `design-62-fixed-${Date.now()}.html`;
            fs.writeFileSync(filename, html);
            console.log(`💾 HTML guardado en: ${filename}`);
            
        } catch (renderError) {
            console.log('❌ Error al generar HTML:', renderError.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

testFixedRendering();