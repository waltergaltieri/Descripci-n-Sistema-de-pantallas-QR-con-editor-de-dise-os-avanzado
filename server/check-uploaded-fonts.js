const { db, initialize } = require('./config/database');

async function checkUploadedFonts() {
    try {
        await initialize();
        const database = db();
        
        console.log('🔍 VERIFICANDO FUENTES SUBIDAS EN LA BASE DE DATOS');
        console.log('=' .repeat(60));
        
        // Buscar todos los uploads de fuentes
        const fontUploads = await database.all(`
            SELECT * FROM uploads 
            WHERE mimetype LIKE 'font/%' 
               OR original_name LIKE '%.ttf' 
               OR original_name LIKE '%.woff' 
               OR original_name LIKE '%.woff2' 
               OR original_name LIKE '%.otf'
        `);
        
        console.log(`📁 Total de fuentes encontradas: ${fontUploads.length}`);
        console.log('');
        
        if (fontUploads.length === 0) {
            console.log('❌ No se encontraron fuentes subidas en la base de datos');
            
            // Verificar si hay algún upload
            const allUploads = await database.all('SELECT * FROM uploads LIMIT 10');
            console.log(`\n📋 Total de uploads en la base de datos: ${allUploads.length}`);
            
            if (allUploads.length > 0) {
                console.log('\n🔍 Primeros 10 uploads encontrados:');
                allUploads.forEach((upload, i) => {
                    console.log(`   ${i+1}. ${upload.original_name} (${upload.mimetype})`);
                });
            }
        } else {
            console.log('✅ Fuentes encontradas:');
            fontUploads.forEach((font, i) => {
                console.log(`   ${i+1}. ${font.original_name}`);
                console.log(`      • Tipo MIME: ${font.mimetype}`);
                console.log(`      • Archivo: ${font.filename}`);
                console.log(`      • Tamaño: ${font.size} bytes`);
                console.log(`      • Subido: ${font.created_at}`);
                console.log('');
            });
        }
        
        // Buscar específicamente las fuentes del diseño 64
        console.log('🎯 BUSCANDO FUENTES ESPECÍFICAS DEL DISEÑO 64:');
        console.log('-'.repeat(50));
        
        const targetFonts = ['Ewert', 'Super Sunkissed'];
        
        for (const fontName of targetFonts) {
            const found = await database.all(`
                SELECT * FROM uploads 
                WHERE original_name LIKE '%${fontName}%'
            `);
            
            console.log(`• ${fontName}: ${found.length > 0 ? '✅ ENCONTRADA' : '❌ NO ENCONTRADA'}`);
            
            if (found.length > 0) {
                found.forEach(f => {
                    console.log(`  └─ ${f.original_name} (${f.filename})`);
                });
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkUploadedFonts();