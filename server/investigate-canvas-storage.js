const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function investigateCanvasStorage() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔍 INVESTIGACIÓN COMPLETA DE ALMACENAMIENTO DE DIMENSIONES');
        console.log('=' .repeat(70));
        
        // 1. Mostrar todas las tablas de la base de datos
        console.log('\n📋 1. TABLAS EN LA BASE DE DATOS:');
        const tables = await db.all(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        );
        
        tables.forEach(table => {
            console.log(`   • ${table.name}`);
        });
        
        // 2. Analizar estructura de la tabla designs
        console.log('\n🏗️ 2. ESTRUCTURA DE LA TABLA DESIGNS:');
        const designsSchema = await db.all("PRAGMA table_info(designs)");
        designsSchema.forEach(column => {
            console.log(`   • ${column.name} (${column.type}) - ${column.notnull ? 'NOT NULL' : 'NULL'} - ${column.dflt_value ? 'Default: ' + column.dflt_value : 'No default'}`);
        });
        
        // 3. Verificar si hay tabla de configuraciones o settings
        const settingsTables = tables.filter(t => 
            t.name.toLowerCase().includes('setting') || 
            t.name.toLowerCase().includes('config') ||
            t.name.toLowerCase().includes('screen') ||
            t.name.toLowerCase().includes('canvas') ||
            t.name.toLowerCase().includes('workspace')
        );
        
        if (settingsTables.length > 0) {
            console.log('\n⚙️ 3. TABLAS DE CONFIGURACIÓN ENCONTRADAS:');
            for (const table of settingsTables) {
                console.log(`\n   📋 Tabla: ${table.name}`);
                const schema = await db.all(`PRAGMA table_info(${table.name})`);
                schema.forEach(column => {
                    console.log(`      • ${column.name} (${column.type})`);
                });
                
                // Mostrar algunos registros de ejemplo
                const sampleData = await db.all(`SELECT * FROM ${table.name} LIMIT 5`);
                if (sampleData.length > 0) {
                    console.log('      Datos de ejemplo:');
                    sampleData.forEach((row, index) => {
                        console.log(`        ${index + 1}:`, JSON.stringify(row, null, 2).substring(0, 200) + '...');
                    });
                }
            }
        } else {
            console.log('\n⚙️ 3. NO SE ENCONTRARON TABLAS DE CONFIGURACIÓN ESPECÍFICAS');
        }
        
        // 4. Buscar en la tabla designs todos los campos que podrían contener dimensiones
        console.log('\n🔍 4. ANÁLISIS DETALLADO DEL DISEÑO ID 62:');
        const design62 = await db.get('SELECT * FROM designs WHERE id = 62');
        
        if (design62) {
            console.log('\n   📄 TODOS LOS CAMPOS DEL DISEÑO 62:');
            Object.keys(design62).forEach(key => {
                const value = design62[key];
                if (typeof value === 'string' && value.length > 100) {
                    console.log(`   • ${key}: [STRING LARGO - ${value.length} caracteres]`);
                    // Buscar menciones de dimensiones en el contenido
                    if (value.includes('1920') || value.includes('1080') || value.includes('width') || value.includes('height')) {
                        console.log(`     ⚠️ Contiene referencias a dimensiones!`);
                        // Mostrar fragmentos relevantes
                        const lines = value.split('\n');
                        const relevantLines = lines.filter(line => 
                            line.includes('1920') || line.includes('1080') || 
                            line.includes('width') || line.includes('height')
                        );
                        if (relevantLines.length > 0) {
                            console.log(`     Fragmentos relevantes:`);
                            relevantLines.slice(0, 5).forEach(line => {
                                console.log(`       - ${line.trim().substring(0, 100)}...`);
                            });
                        }
                    }
                } else {
                    console.log(`   • ${key}: ${value}`);
                }
            });
            
            // 5. Analizar el contenido JSON en detalle
            console.log('\n🔬 5. ANÁLISIS PROFUNDO DEL CONTENIDO JSON:');
            try {
                const content = JSON.parse(design62.content);
                console.log(`   • Dimensiones en content: ${content.width} x ${content.height}`);
                
                // Buscar otras propiedades que podrían contener dimensiones
                const searchForDimensions = (obj, path = '') => {
                    for (const [key, value] of Object.entries(obj)) {
                        const currentPath = path ? `${path}.${key}` : key;
                        
                        if (key.toLowerCase().includes('width') || key.toLowerCase().includes('height') || 
                            key.toLowerCase().includes('dimension') || key.toLowerCase().includes('size')) {
                            console.log(`   • ${currentPath}: ${value}`);
                        }
                        
                        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                            searchForDimensions(value, currentPath);
                        }
                    }
                };
                
                searchForDimensions(content);
                
            } catch (error) {
                console.log('   ❌ Error al parsear content como JSON:', error.message);
            }
            
            // 6. Analizar enhanced_content si existe
            if (design62.enhanced_content) {
                console.log('\n🔬 6. ANÁLISIS DEL ENHANCED_CONTENT:');
                try {
                    const enhancedContent = JSON.parse(design62.enhanced_content);
                    console.log(`   • Tipo de enhanced_content: ${typeof enhancedContent}`);
                    console.log(`   • Claves principales:`, Object.keys(enhancedContent));
                    
                    // Buscar dimensiones en enhanced_content
                    const searchForDimensions = (obj, path = '') => {
                        for (const [key, value] of Object.entries(obj)) {
                            const currentPath = path ? `${path}.${key}` : key;
                            
                            if (key.toLowerCase().includes('width') || key.toLowerCase().includes('height') || 
                                key.toLowerCase().includes('dimension') || key.toLowerCase().includes('size')) {
                                console.log(`   • ${currentPath}: ${value}`);
                            }
                            
                            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                                searchForDimensions(value, currentPath);
                            }
                        }
                    };
                    
                    searchForDimensions(enhancedContent);
                    
                } catch (error) {
                    console.log('   ❌ Error al parsear enhanced_content como JSON:', error.message);
                }
            }
        } else {
            console.log('   ❌ No se encontró el diseño ID 62');
        }
        
        // 7. Buscar en todas las tablas por referencias a 1920x1080
        console.log('\n🔍 7. BÚSQUEDA GLOBAL DE DIMENSIONES 1920x1080:');
        for (const table of tables) {
            try {
                const columns = await db.all(`PRAGMA table_info(${table.name})`);
                const textColumns = columns.filter(col => 
                    col.type.toLowerCase().includes('text') || 
                    col.type.toLowerCase().includes('varchar') ||
                    col.type.toLowerCase().includes('json')
                );
                
                for (const column of textColumns) {
                    const results = await db.all(
                        `SELECT id, ${column.name} FROM ${table.name} WHERE ${column.name} LIKE '%1920%' OR ${column.name} LIKE '%1080%' LIMIT 3`
                    );
                    
                    if (results.length > 0) {
                        console.log(`   ✅ Encontrado en ${table.name}.${column.name}:`);
                        results.forEach(row => {
                            const value = row[column.name];
                            if (typeof value === 'string' && value.length > 100) {
                                console.log(`      ID ${row.id}: [TEXTO LARGO - contiene 1920/1080]`);
                            } else {
                                console.log(`      ID ${row.id}: ${value}`);
                            }
                        });
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Error al buscar en tabla ${table.name}:`, error.message);
            }
        }
        
        console.log('\n' + '='.repeat(70));
        console.log('✅ INVESTIGACIÓN COMPLETADA');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

investigateCanvasStorage();