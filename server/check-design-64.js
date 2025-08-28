const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function checkDesign64() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔍 VERIFICANDO DISEÑO ID 64');
        console.log('=' .repeat(50));
        
        // Buscar el diseño ID 64
        const design = await db.get(`
            SELECT id, name, content, created_at, updated_at 
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design) {
            console.log('❌ No se encontró el diseño ID 64');
            console.log('\n🔍 Verificando los últimos diseños creados:');
            
            const latestDesigns = await db.all(`
                SELECT id, name, created_at 
                FROM designs 
                ORDER BY id DESC 
                LIMIT 5
            `);
            
            console.log('\n📋 Últimos 5 diseños:');
            for (const d of latestDesigns) {
                console.log(`   • ID ${d.id}: ${d.name} (${d.created_at})`);
            }
            
            return;
        }
        
        console.log(`✅ Diseño encontrado: "${design.name}"`);
        console.log(`📅 Creado: ${design.created_at}`);
        console.log(`📅 Actualizado: ${design.updated_at}`);
        console.log('');
        
        // Parsear y analizar el contenido
        try {
            const content = JSON.parse(design.content);
            
            console.log('📐 ANÁLISIS DE DIMENSIONES:');
            console.log(`   • content.width: ${content.width}`);
            console.log(`   • content.height: ${content.height}`);
            
            if (content.pages && content.pages.length > 0) {
                const page = content.pages[0];
                console.log(`   • pages[0].width: ${page.width}`);
                console.log(`   • pages[0].height: ${page.height}`);
                
                // Verificar sincronización
                const contentDims = `${content.width}x${content.height}`;
                const pageDims = `${page.width}x${page.height}`;
                const isSynced = contentDims === pageDims;
                
                console.log('');
                console.log(`🎯 RESULTADO DE SINCRONIZACIÓN:`);
                console.log(`   • Content: ${contentDims}`);
                console.log(`   • Page: ${pageDims}`);
                console.log(`   • Sincronizado: ${isSynced ? '✅ SÍ' : '❌ NO'}`);
                
                if (isSynced) {
                    console.log('');
                    console.log('🎉 ¡PERFECTO! El diseño se guardó con dimensiones correctas.');
                    console.log('   → La función syncContentDimensions() está funcionando.');
                    console.log('   → Los nuevos diseños se crean automáticamente sincronizados.');
                } else {
                    console.log('');
                    console.log('⚠️ PROBLEMA: Las dimensiones no están sincronizadas.');
                    console.log('   → Puede que la función no se esté ejecutando correctamente.');
                }
                
                // Verificar orientación
                const isVertical = page.height > page.width;
                const expectedOrientation = page.width === 1080 && page.height === 1920;
                
                console.log('');
                console.log('📱 VERIFICACIÓN DE ORIENTACIÓN:');
                console.log(`   • Orientación: ${isVertical ? 'Vertical' : 'Horizontal'}`);
                console.log(`   • Dimensiones esperadas (1080x1920): ${expectedOrientation ? '✅ SÍ' : '❌ NO'}`);
                
            } else {
                console.log('❌ No se encontraron páginas en el contenido');
            }
            
            // Mostrar estructura básica del contenido
            console.log('');
            console.log('📋 ESTRUCTURA DEL CONTENIDO:');
            console.log(`   • Páginas: ${content.pages ? content.pages.length : 0}`);
            console.log(`   • Tiene settings: ${content.settings ? 'Sí' : 'No'}`);
            
            if (content.settings) {
                console.log(`   • settings.canvasWidth: ${content.settings.canvasWidth || 'undefined'}`);
                console.log(`   • settings.canvasHeight: ${content.settings.canvasHeight || 'undefined'}`);
            }
            
        } catch (parseError) {
            console.log('❌ Error al parsear el contenido JSON:', parseError.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

checkDesign64();