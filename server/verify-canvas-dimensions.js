const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function verifyCanvasDimensions() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        const rows = await db.all(
            'SELECT id, content FROM designs WHERE id = 62'
        );

        if (rows.length === 0) {
            console.log('❌ No se encontró el diseño ID 62');
            return;
        }

        const design = rows[0];
        const polotnoJson = JSON.parse(design.content);

        console.log('🔍 ANÁLISIS DE DIMENSIONES Y POSICIONES - DISEÑO ID 62');
        console.log('=' .repeat(60));
        
        // Verificar dimensiones del canvas
        console.log('📐 DIMENSIONES DEL CANVAS:');
        console.log(`   Ancho: ${polotnoJson.width}px`);
        console.log(`   Alto: ${polotnoJson.height}px`);
        console.log(`   Formato: ${polotnoJson.width === polotnoJson.height ? 'CUADRADO' : 'RECTANGULAR'}`);
        console.log('');
        
        // Verificar si hay páginas
        if (!polotnoJson.pages || polotnoJson.pages.length === 0) {
            console.log('❌ No se encontraron páginas en el diseño');
            return;
        }
        
        const page = polotnoJson.pages[0];
        console.log('📄 INFORMACIÓN DE LA PÁGINA:');
        console.log(`   ID de página: ${page.id}`);
        console.log(`   Elementos en la página: ${page.children ? page.children.length : 0}`);
        console.log('');
        
        // Analizar posiciones exactas de cada elemento
        console.log('📍 POSICIONES EXACTAS DE ELEMENTOS:');
        console.log('-'.repeat(50));
        
        if (page.children && page.children.length > 0) {
            page.children.forEach((element, index) => {
                console.log(`\n🔸 ELEMENTO ${index + 1}:`);
                console.log(`   ID: ${element.id}`);
                console.log(`   Tipo: ${element.type}`);
                
                // Posición y dimensiones
                console.log(`   📐 POSICIÓN Y TAMAÑO:`);
                console.log(`      X: ${element.x}px`);
                console.log(`      Y: ${element.y}px`);
                console.log(`      Ancho: ${element.width}px`);
                console.log(`      Alto: ${element.height}px`);
                console.log(`      Rotación: ${element.rotation || 0}°`);
                console.log(`      Opacidad: ${element.opacity || 1}`);
                
                // Información específica por tipo
                if (element.type === 'text') {
                    console.log(`   📝 TEXTO:`);
                    console.log(`      Contenido: "${element.text}"`);
                    console.log(`      Fuente: ${element.fontFamily}`);
                    console.log(`      Tamaño: ${element.fontSize}px`);
                    console.log(`      Color: ${element.fill}`);
                } else if (element.type === 'image') {
                    console.log(`   🖼️ IMAGEN:`);
                    console.log(`      URL: ${element.src ? element.src.substring(0, 50) + '...' : 'No definida'}`);
                    if (element.cropX !== undefined) {
                        console.log(`      🎭 RECORTE/MÁSCARA:`);
                        console.log(`         Crop X: ${element.cropX}`);
                        console.log(`         Crop Y: ${element.cropY}`);
                        console.log(`         Crop Ancho: ${element.cropWidth}`);
                        console.log(`         Crop Alto: ${element.cropHeight}`);
                    }
                } else if (element.type === 'figure') {
                    console.log(`   🔺 FIGURA:`);
                    console.log(`      Subtipo: ${element.subType}`);
                    console.log(`      Color relleno: ${element.fill}`);
                    if (element.stroke) {
                        console.log(`      Color borde: ${element.stroke}`);
                        console.log(`      Grosor borde: ${element.strokeWidth}px`);
                    }
                }
            });
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ RESUMEN:');
        console.log(`   • Canvas: ${polotnoJson.width} x ${polotnoJson.height}px (${polotnoJson.width === polotnoJson.height ? 'Cuadrado' : 'Rectangular'})`);
        console.log(`   • Total elementos: ${page.children ? page.children.length : 0}`);
        console.log(`   • Posiciones exactas: SÍ guardadas (x, y, width, height, rotation)`);
        
        // Verificar si las dimensiones son las esperadas
        if (polotnoJson.width === 1920 && polotnoJson.height === 1080) {
            console.log('   • ✅ Las dimensiones coinciden con 1920x1080 (rectangular)');
        } else if (polotnoJson.width === 1080 && polotnoJson.height === 1080) {
            console.log('   • ⚠️ Las dimensiones son 1080x1080 (cuadrado) - NO coinciden con 1920x1080');
        } else {
            console.log(`   • ⚠️ Las dimensiones ${polotnoJson.width}x${polotnoJson.height} no coinciden con ninguna esperada`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

verifyCanvasDimensions();