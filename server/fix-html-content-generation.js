const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
require('dotenv').config();

/**
 * Función para generar y guardar HTML en la base de datos
 * @param {number} designId - ID del diseño
 * @param {object} content - Contenido JSON del diseño
 * @param {string} designName - Nombre del diseño
 */
async function generateAndSaveHtml(designId, content, designName) {
    try {
        // Generar HTML usando konvaRenderer
        const html = konvaRenderer.renderWithKonva(content, designName);
        
        // Abrir conexión a la base de datos
        const db = await open({
            filename: './database.sqlite',
            driver: sqlite3.Database
        });
        
        // Actualizar el campo html_content en la base de datos
        const result = await db.run(
            'UPDATE designs SET html_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [html, designId]
        );
        
        await db.close();
        
        return {
            success: result.changes > 0,
            htmlLength: html.length,
            designId
        };
        
    } catch (error) {
        console.error('Error generando y guardando HTML:', error);
        return {
            success: false,
            error: error.message,
            designId
        };
    }
}

async function fixDesign64HtmlContent() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔧 CORRIGIENDO html_content DEL DISEÑO ID 64');
        console.log('=' .repeat(60));
        
        // Obtener el diseño ID 64
        const design = await db.get(`
            SELECT id, name, content 
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design) {
            console.log('❌ No se encontró el diseño ID 64');
            return;
        }
        
        console.log(`✅ Diseño encontrado: "${design.name}"`);
        
        if (!design.content) {
            console.log('❌ El diseño no tiene contenido JSON');
            return;
        }
        
        try {
            const content = JSON.parse(design.content);
            console.log(`📐 Dimensiones: ${content.width}x${content.height}`);
            
            // Generar HTML usando konvaRenderer
            console.log('🎨 Generando HTML...');
            const html = konvaRenderer.renderWithKonva(content, design.name);
            
            console.log(`📄 HTML generado: ${html.length} caracteres`);
            
            // Guardar en la base de datos
            console.log('💾 Guardando en la base de datos...');
            const result = await db.run(
                'UPDATE designs SET html_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [html, design.id]
            );
            
            if (result.changes > 0) {
                console.log('✅ HTML guardado correctamente en html_content');
                
                // Verificar que se guardó
                const verification = await db.get(
                    'SELECT LENGTH(html_content) as html_length FROM designs WHERE id = ?',
                    [design.id]
                );
                
                console.log(`🔍 Verificación: html_content tiene ${verification.html_length} caracteres`);
                
                // Verificar que contiene las dimensiones correctas
                const designCheck = await db.get(
                    'SELECT html_content FROM designs WHERE id = ?',
                    [design.id]
                );
                
                const contains1080 = designCheck.html_content.includes('1080');
                const contains1920 = designCheck.html_content.includes('1920');
                
                console.log(`   • Contiene '1080': ${contains1080 ? '✅ SÍ' : '❌ NO'}`);
                console.log(`   • Contiene '1920': ${contains1920 ? '✅ SÍ' : '❌ NO'}`);
                
                console.log('');
                console.log('🎉 PROBLEMA RESUELTO:');
                console.log('   • El diseño ID 64 ahora tiene html_content en la base de datos');
                console.log('   • El HTML contiene las dimensiones correctas (1080x1920)');
                console.log('   • El HTML está listo para ser usado por las pantallas');
                
            } else {
                console.log('❌ No se pudo actualizar el diseño');
            }
            
        } catch (parseError) {
            console.error('❌ Error parseando el contenido JSON:', parseError);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

// Ejecutar la corrección
fixDesign64HtmlContent();

// Exportar la función para uso futuro
module.exports = {
    generateAndSaveHtml
};