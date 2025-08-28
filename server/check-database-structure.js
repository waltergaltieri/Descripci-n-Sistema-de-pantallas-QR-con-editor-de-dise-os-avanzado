const { db, initialize } = require('./config/database');

async function checkDatabaseStructure() {
    try {
        await initialize();
        const database = db();
        
        console.log('📋 TABLAS EN LA BASE DE DATOS:');
        console.log('=' .repeat(50));
        
        const tables = await database.all(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        );
        
        tables.forEach(table => {
            console.log(`  • ${table.name}`);
        });
        
        console.log('\n🏗️ ESTRUCTURA DE LA TABLA UPLOADS:');
        console.log('=' .repeat(50));
        
        const uploadsSchema = await database.all('PRAGMA table_info(uploads)');
        uploadsSchema.forEach(col => {
            console.log(`  • ${col.name} (${col.type}) - ${col.notnull ? 'NOT NULL' : 'NULL'}`);
        });
        
        console.log('\n📁 CONTENIDO DE LA TABLA UPLOADS:');
        console.log('=' .repeat(50));
        
        const allUploads = await database.all('SELECT * FROM uploads LIMIT 10');
        console.log(`Total de uploads: ${allUploads.length}`);
        
        if (allUploads.length > 0) {
            console.log('\nPrimeros 10 uploads:');
            allUploads.forEach((upload, i) => {
                console.log(`   ${i+1}. ${upload.original_name} (${upload.mimetype})`);
                console.log(`      • Archivo: ${upload.filename}`);
                console.log(`      • Tamaño: ${upload.size} bytes`);
                console.log(`      • Creado: ${upload.created_at}`);
                console.log('');
            });
        } else {
            console.log('❌ No hay uploads en la base de datos');
        }
        
        // Buscar específicamente fuentes
        console.log('\n🔍 BÚSQUEDA DE FUENTES:');
        console.log('=' .repeat(50));
        
        const fontUploads = await database.all(`
            SELECT * FROM uploads 
            WHERE mimetype LIKE 'font/%' 
               OR original_name LIKE '%.ttf' 
               OR original_name LIKE '%.woff' 
               OR original_name LIKE '%.woff2' 
               OR original_name LIKE '%.otf'
               OR original_name LIKE '%Super Sunkissed%'
               OR original_name LIKE '%sunkissed%'
        `);
        
        console.log(`Fuentes encontradas: ${fontUploads.length}`);
        
        if (fontUploads.length > 0) {
            fontUploads.forEach((font, i) => {
                console.log(`   ${i+1}. ${font.original_name}`);
                console.log(`      • Tipo: ${font.mimetype}`);
                console.log(`      • Archivo: ${font.filename}`);
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

checkDatabaseStructure();