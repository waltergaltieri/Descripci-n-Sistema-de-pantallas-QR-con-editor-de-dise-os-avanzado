const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function showHtmlContent() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('📄 MOSTRANDO CONTENIDO HTML DEL DISEÑO ID 64');
        console.log('=' .repeat(60));
        
        // Obtener el HTML del diseño 64
        const design64 = await db.get(`
            SELECT html_content, updated_at
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design64 || !design64.html_content) {
            console.log('❌ No se encontró HTML para el diseño ID 64');
            return;
        }
        
        console.log(`📅 Última actualización: ${design64.updated_at}`);
        console.log(`📊 Longitud del HTML: ${design64.html_content.length} caracteres`);
        console.log('');
        
        // Mostrar el HTML completo
        console.log('🌐 CONTENIDO HTML COMPLETO:');
        console.log('=' .repeat(40));
        console.log(design64.html_content);
        console.log('');
        console.log('=' .repeat(40));
        
        // Buscar líneas específicas
        const lines = design64.html_content.split('\n');
        console.log('');
        console.log('🔍 LÍNEAS QUE CONTIENEN "konvaJson":');
        lines.forEach((line, index) => {
            if (line.includes('konvaJson')) {
                console.log(`   ${index + 1}: ${line.trim()}`);
            }
        });
        
        console.log('');
        console.log('🔍 LÍNEAS QUE CONTIENEN "Konva.Node.create":');
        lines.forEach((line, index) => {
            if (line.includes('Konva.Node.create')) {
                console.log(`   ${index + 1}: ${line.trim()}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

showHtmlContent();