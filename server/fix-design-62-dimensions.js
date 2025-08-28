const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function fixDesign62Dimensions() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔧 CORRIGIENDO DIMENSIONES DEL DISEÑO ID 62');
        console.log('=' .repeat(60));
        
        // 1. Obtener el diseño actual
        const design = await db.get('SELECT id, name, content FROM designs WHERE id = 62');
        
        if (!design) {
            console.log('❌ No se encontró el diseño ID 62');
            return;
        }
        
        console.log(`📋 Diseño: ${design.name} (ID: ${design.id})`);
        console.log('');
        
        // 2. Parsear el contenido actual
        const content = JSON.parse(design.content);
        
        console.log('📐 DIMENSIONES ANTES DE LA CORRECCIÓN:');
        console.log(`   • content.width: ${content.width}`);
        console.log(`   • content.height: ${content.height}`);
        
        if (content.pages && content.pages.length > 0) {
            console.log(`   • pages[0].width: ${content.pages[0].width}`);
            console.log(`   • pages[0].height: ${content.pages[0].height}`);
        }
        console.log('');
        
        // 3. Aplicar la función de sincronización
        const syncContentDimensions = (content) => {
            if (!content || typeof content !== 'object') {
                return content;
            }
            
            // Si hay páginas, usar las dimensiones de la primera página
            if (content.pages && content.pages.length > 0) {
                const firstPage = content.pages[0];
                if (firstPage.width && firstPage.height) {
                    content.width = firstPage.width;
                    content.height = firstPage.height;
                    console.log(`✅ Dimensiones sincronizadas: ${firstPage.width}x${firstPage.height}`);
                }
            }
            
            return content;
        };
        
        const correctedContent = syncContentDimensions(content);
        
        console.log('📐 DIMENSIONES DESPUÉS DE LA CORRECCIÓN:');
        console.log(`   • content.width: ${correctedContent.width}`);
        console.log(`   • content.height: ${correctedContent.height}`);
        console.log('');
        
        // 4. Actualizar en la base de datos
        console.log('💾 ACTUALIZANDO EN LA BASE DE DATOS...');
        const result = await db.run(
            'UPDATE designs SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(correctedContent), 62]
        );
        
        if (result.changes > 0) {
            console.log('✅ Diseño actualizado correctamente');
            
            // 5. Verificar la actualización
            const updatedDesign = await db.get('SELECT content FROM designs WHERE id = 62');
            const updatedContent = JSON.parse(updatedDesign.content);
            
            console.log('');
            console.log('🔍 VERIFICACIÓN FINAL:');
            console.log(`   • content.width: ${updatedContent.width}`);
            console.log(`   • content.height: ${updatedContent.height}`);
            console.log(`   • pages[0].width: ${updatedContent.pages[0].width}`);
            console.log(`   • pages[0].height: ${updatedContent.pages[0].height}`);
            
            const isFixed = updatedContent.width === updatedContent.pages[0].width && 
                           updatedContent.height === updatedContent.pages[0].height;
            
            console.log('');
            console.log(`🎯 RESULTADO: ${isFixed ? '✅ PROBLEMA SOLUCIONADO' : '❌ PROBLEMA PERSISTE'}`);
            
            if (isFixed) {
                console.log('   → Ahora konvaRenderer.js generará HTML con las dimensiones correctas');
                console.log('   → El editor seguirá funcionando correctamente');
            }
            
        } else {
            console.log('❌ No se pudo actualizar el diseño');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

fixDesign62Dimensions();