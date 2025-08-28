const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function checkContentSettings() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔍 VERIFICANDO CONTENT.SETTINGS - DISEÑO ID 62');
        console.log('=' .repeat(60));
        
        // Obtener el diseño
        const design = await db.get('SELECT id, name, content FROM designs WHERE id = 62');
        
        if (!design) {
            console.log('❌ No se encontró el diseño ID 62');
            return;
        }
        
        console.log(`📋 Diseño: ${design.name} (ID: ${design.id})`);
        console.log('');
        
        if (!design.content) {
            console.log('❌ El campo content está vacío');
            return;
        }
        
        try {
            const content = JSON.parse(design.content);
            
            console.log('📄 ESTRUCTURA DEL CAMPO CONTENT:');
            console.log(`   • Claves principales: ${Object.keys(content).join(', ')}`);
            console.log('');
            
            // Verificar dimensiones principales
            console.log('📐 DIMENSIONES PRINCIPALES:');
            console.log(`   • content.width: ${content.width || 'NO EXISTE'}`);
            console.log(`   • content.height: ${content.height || 'NO EXISTE'}`);
            console.log('');
            
            // Verificar settings
            console.log('⚙️ ANÁLISIS DE CONTENT.SETTINGS:');
            if (content.settings) {
                console.log('   ✅ El objeto settings EXISTE');
                console.log(`   • Claves en settings: ${Object.keys(content.settings).join(', ')}`);
                console.log('');
                
                // Verificar dimensiones específicas
                console.log('   📏 DIMENSIONES EN SETTINGS:');
                console.log(`   • canvasWidth: ${content.settings.canvasWidth || 'NO EXISTE'}`);
                console.log(`   • canvasHeight: ${content.settings.canvasHeight || 'NO EXISTE'}`);
                console.log('');
                
                // Mostrar todo el objeto settings
                console.log('   📋 CONTENIDO COMPLETO DE SETTINGS:');
                console.log(JSON.stringify(content.settings, null, 4).split('\n').map(line => `   ${line}`).join('\n'));
                
            } else {
                console.log('   ❌ El objeto settings NO EXISTE');
            }
            console.log('');
            
            // Verificar páginas
            console.log('📄 ANÁLISIS DE PÁGINAS:');
            if (content.pages && content.pages.length > 0) {
                console.log(`   ✅ Encontradas ${content.pages.length} páginas`);
                content.pages.forEach((page, index) => {
                    console.log(`   • Página ${index + 1}:`);
                    console.log(`     - width: ${page.width || 'NO EXISTE'}`);
                    console.log(`     - height: ${page.height || 'NO EXISTE'}`);
                });
            } else {
                console.log('   ❌ No se encontraron páginas');
            }
            console.log('');
            
            // Conclusión sobre cómo el editor lee las dimensiones
            console.log('🎯 CONCLUSIÓN - CÓMO LEE EL EDITOR LAS DIMENSIONES:');
            console.log('   Según DesignEditor.js líneas 289-299:');
            console.log('   1. Busca: design.content.settings.canvasWidth');
            console.log('   2. Busca: design.content.settings.canvasHeight');
            console.log('   3. Si no existen, usa fallback: 1920x1080');
            console.log('');
            
            const hasCanvasSettings = content.settings && content.settings.canvasWidth && content.settings.canvasHeight;
            if (hasCanvasSettings) {
                console.log(`   ✅ ENCONTRADAS dimensiones en settings: ${content.settings.canvasWidth}x${content.settings.canvasHeight}`);
                console.log('   → El editor debería usar estas dimensiones');
            } else {
                console.log('   ❌ NO se encontraron dimensiones en settings');
                console.log('   → El editor usará el fallback: 1920x1080');
                console.log('   → Esto explica por qué el editor muestra 1920x1080');
            }
            
        } catch (error) {
            console.log(`❌ Error al parsear content: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

checkContentSettings();