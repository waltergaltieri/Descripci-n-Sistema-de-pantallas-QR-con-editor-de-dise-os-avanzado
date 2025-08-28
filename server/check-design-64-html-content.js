const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function checkDesign64HtmlContent() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔍 VERIFICANDO html_content DEL DISEÑO ID 64');
        console.log('=' .repeat(60));
        
        // Obtener el diseño ID 64 con todos los campos
        const design = await db.get(`
            SELECT id, name, content, enhanced_content, html_content, created_at, updated_at 
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design) {
            console.log('❌ No se encontró el diseño ID 64');
            return;
        }
        
        console.log(`✅ Diseño encontrado: "${design.name}"`);
        console.log(`📅 Creado: ${design.created_at}`);
        console.log(`📅 Actualizado: ${design.updated_at}`);
        console.log('');
        
        // Verificar cada campo
        console.log('📋 ANÁLISIS DE CAMPOS:');
        
        // 1. Campo content
        if (design.content) {
            try {
                const content = JSON.parse(design.content);
                console.log(`   • content: ✅ Presente (${content.width}x${content.height})`);
            } catch (e) {
                console.log(`   • content: ❌ Error al parsear`);
            }
        } else {
            console.log(`   • content: ❌ Vacío o null`);
        }
        
        // 2. Campo enhanced_content
        if (design.enhanced_content) {
            try {
                const enhanced = JSON.parse(design.enhanced_content);
                console.log(`   • enhanced_content: ✅ Presente`);
            } catch (e) {
                console.log(`   • enhanced_content: ❌ Error al parsear`);
            }
        } else {
            console.log(`   • enhanced_content: ❌ Vacío o null`);
        }
        
        // 3. Campo html_content (el que nos interesa)
        console.log('');
        console.log('🎯 ANÁLISIS DEL CAMPO html_content:');
        
        if (design.html_content) {
            const htmlLength = design.html_content.length;
            console.log(`   • Estado: ✅ PRESENTE`);
            console.log(`   • Tamaño: ${htmlLength} caracteres`);
            
            // Verificar si contiene las dimensiones correctas
            const contains1080 = design.html_content.includes('1080');
            const contains1920 = design.html_content.includes('1920');
            
            console.log(`   • Contiene '1080': ${contains1080 ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   • Contiene '1920': ${contains1920 ? '✅ SÍ' : '❌ NO'}`);
            
            // Verificar si es HTML válido
            const isHTML = design.html_content.includes('<html>') && design.html_content.includes('</html>');
            console.log(`   • Es HTML válido: ${isHTML ? '✅ SÍ' : '❌ NO'}`);
            
            // Mostrar una muestra del contenido
            console.log('');
            console.log('📄 MUESTRA DEL CONTENIDO (primeros 200 caracteres):');
            console.log('   ' + design.html_content.substring(0, 200) + '...');
            
        } else {
            console.log(`   • Estado: ❌ VACÍO O NULL`);
            console.log('');
            console.log('🤔 POSIBLES RAZONES:');
            console.log('   1. El HTML no se genera automáticamente al crear el diseño');
            console.log('   2. Se requiere una acción específica para generar el HTML');
            console.log('   3. El HTML se genera solo cuando se solicita explícitamente');
            console.log('   4. Hay un proceso separado que actualiza este campo');
        }
        
        console.log('');
        console.log('🔍 COMPARACIÓN CON OTROS DISEÑOS:');
        
        // Verificar otros diseños para comparar
        const otherDesigns = await db.all(`
            SELECT id, name, 
                   CASE WHEN html_content IS NOT NULL AND html_content != '' THEN 'Presente' ELSE 'Vacío' END as html_status
            FROM designs 
            WHERE id != 64
            ORDER BY id DESC 
            LIMIT 5
        `);
        
        for (const other of otherDesigns) {
            console.log(`   • ID ${other.id} (${other.name}): html_content ${other.html_status}`);
        }
        
        console.log('');
        console.log('💡 CONCLUSIÓN:');
        
        if (design.html_content) {
            console.log('✅ El diseño ID 64 SÍ tiene html_content generado.');
            console.log('   → El HTML se guardó correctamente en la base de datos.');
        } else {
            console.log('❌ El diseño ID 64 NO tiene html_content en la base de datos.');
            console.log('   → El HTML que generamos fue solo un archivo temporal.');
            console.log('   → Se necesita investigar cómo se guarda el HTML en la BD.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

checkDesign64HtmlContent();