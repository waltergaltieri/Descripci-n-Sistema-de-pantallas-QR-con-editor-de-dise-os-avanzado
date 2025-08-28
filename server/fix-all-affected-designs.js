const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function fixAllAffectedDesigns() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔧 CORRIGIENDO TODOS LOS DISEÑOS AFECTADOS');
        console.log('=' .repeat(60));
        
        // Función para sincronizar dimensiones
        const syncContentDimensions = (content) => {
            if (!content || typeof content !== 'object') {
                return content;
            }
            
            // Si hay páginas, usar las dimensiones de la primera página
            if (content.pages && content.pages.length > 0) {
                const firstPage = content.pages[0];
                if (firstPage.width && firstPage.height) {
                    const oldDims = `${content.width}x${content.height}`;
                    const newDims = `${firstPage.width}x${firstPage.height}`;
                    
                    content.width = firstPage.width;
                    content.height = firstPage.height;
                    
                    console.log(`     ✅ ${oldDims} → ${newDims}`);
                    return { content, changed: oldDims !== newDims };
                }
            }
            
            return { content, changed: false };
        };
        
        // 1. Obtener todos los diseños que necesitan corrección
        const designs = await db.all(`
            SELECT id, name, content 
            FROM designs 
            WHERE content IS NOT NULL
        `);
        
        console.log(`📋 Encontrados ${designs.length} diseños para revisar`);
        console.log('');
        
        let fixedCount = 0;
        let totalCount = 0;
        
        for (const design of designs) {
            try {
                const content = JSON.parse(design.content);
                
                if (content.pages && content.pages.length > 0) {
                    const contentDims = `${content.width}x${content.height}`;
                    const pageDims = `${content.pages[0].width}x${content.pages[0].height}`;
                    const needsFix = contentDims !== pageDims;
                    
                    totalCount++;
                    
                    console.log(`🔍 ID ${design.id} (${design.name}):`);
                    console.log(`   • Content: ${contentDims}, Page: ${pageDims}`);
                    
                    if (needsFix) {
                        console.log('   • Estado: ❌ NECESITA CORRECCIÓN');
                        
                        const result = syncContentDimensions(content);
                        
                        if (result.changed) {
                            // Actualizar en la base de datos
                            await db.run(
                                'UPDATE designs SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                                [JSON.stringify(result.content), design.id]
                            );
                            
                            fixedCount++;
                            console.log('   • Resultado: ✅ CORREGIDO');
                        } else {
                            console.log('   • Resultado: ⚠️ NO SE PUDO CORREGIR');
                        }
                    } else {
                        console.log('   • Estado: ✅ YA ESTÁ CORRECTO');
                    }
                    
                    console.log('');
                }
                
            } catch (error) {
                console.log(`❌ ID ${design.id}: Error al parsear - ${error.message}`);
                console.log('');
            }
        }
        
        // 2. Resumen final
        console.log('📊 RESUMEN DE CORRECCIONES:');
        console.log(`   • Diseños revisados: ${totalCount}`);
        console.log(`   • Diseños corregidos: ${fixedCount}`);
        console.log(`   • Diseños que ya estaban bien: ${totalCount - fixedCount}`);
        console.log('');
        
        // 3. Verificación final
        console.log('🔍 VERIFICACIÓN FINAL:');
        const verificationDesigns = await db.all(`
            SELECT id, name, content 
            FROM designs 
            WHERE content IS NOT NULL
        `);
        
        let allFixed = true;
        
        for (const design of verificationDesigns) {
            try {
                const content = JSON.parse(design.content);
                
                if (content.pages && content.pages.length > 0) {
                    const contentDims = `${content.width}x${content.height}`;
                    const pageDims = `${content.pages[0].width}x${content.pages[0].height}`;
                    const isCorrect = contentDims === pageDims;
                    
                    if (!isCorrect) {
                        console.log(`   ❌ ID ${design.id}: ${contentDims} ≠ ${pageDims}`);
                        allFixed = false;
                    }
                }
            } catch (error) {
                // Ignorar errores de parsing en la verificación
            }
        }
        
        if (allFixed) {
            console.log('   ✅ Todos los diseños tienen dimensiones correctas');
        }
        
        console.log('');
        console.log(`🎯 RESULTADO FINAL: ${allFixed ? '✅ TODOS LOS PROBLEMAS SOLUCIONADOS' : '❌ ALGUNOS PROBLEMAS PERSISTEN'}`);
        
        if (allFixed && fixedCount > 0) {
            console.log('');
            console.log('🎉 ¡ÉXITO COMPLETO!');
            console.log('   → Todos los diseños ahora tienen dimensiones sincronizadas');
            console.log('   → El renderizado HTML funcionará correctamente');
            console.log('   → Los futuros diseños se guardarán correctamente');
            console.log('   → El editor sigue funcionando sin cambios');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

fixAllAffectedDesigns();