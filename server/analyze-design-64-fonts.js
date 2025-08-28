const { db, initialize } = require('./config/database');

async function analyzeDesign64Fonts() {
    try {
        await initialize();
        const database = db();
        
        const design = await database.get('SELECT * FROM designs WHERE id = 64');
        
        if (!design) {
            console.log('❌ Diseño ID:64 no encontrado');
            return;
        }
        
        const content = JSON.parse(design.content);
        
        console.log('=== ANÁLISIS DISEÑO ID:64 ===');
        console.log(`Nombre: ${design.name}`);
        console.log(`Dimensiones: ${content.width}x${content.height}`);
        console.log('');
        
        const textElements = content.pages[0].children.filter(el => el.type === 'text');
        
        console.log(`📝 ELEMENTOS DE TEXTO ENCONTRADOS: ${textElements.length}`);
        console.log('-'.repeat(50));
        
        textElements.forEach((el, i) => {
            console.log(`${i+1}. Texto: "${el.text}"`);
            console.log(`   • FontFamily: ${el.fontFamily || 'no definida'}`);
            console.log(`   • FontSize: ${el.fontSize || 'no definido'}`);
            console.log(`   • FontWeight: ${el.fontWeight || 'no definido'}`);
            console.log(`   • Fill (color): ${el.fill || 'no definido'}`);
            console.log(`   • Posición: x=${el.x}, y=${el.y}`);
            console.log(`   • Dimensiones: ${el.width}x${el.height}`);
            console.log('');
        });
        
        console.log('\n🔍 VERIFICANDO HTML GENERADO ACTUAL:');
        console.log('-'.repeat(50));
        
        if (design.html_content) {
            // Buscar fuentes en el HTML
            const fontFamilyMatches = design.html_content.match(/fontFamily["']?\s*:\s*["']([^"']+)["']/g);
            
            if (fontFamilyMatches) {
                console.log('Fuentes encontradas en HTML:');
                fontFamilyMatches.forEach((match, i) => {
                    console.log(`   ${i+1}. ${match}`);
                });
            } else {
                console.log('❌ No se encontraron fuentes en el HTML generado');
            }
            
            // Verificar si hay enlaces a Google Fonts
            const hasGoogleFonts = design.html_content.includes('fonts.googleapis.com');
            console.log(`\nGoogle Fonts incluido: ${hasGoogleFonts ? '✅ SÍ' : '❌ NO'}`);
            
        } else {
            console.log('❌ No hay HTML generado para este diseño');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit(0);
    }
}

analyzeDesign64Fonts();