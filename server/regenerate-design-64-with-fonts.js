const { db, initialize } = require('./config/database');
const { renderWithKonva } = require('./utils/konvaRenderer');

async function regenerateDesign64WithFonts() {
    try {
        await initialize();
        const database = db();
        
        console.log('🔄 Regenerando diseño ID:64 con fuentes correctas...');
        
        // Obtener el diseño actual
        const design = await database.get('SELECT * FROM designs WHERE id = 64');
        
        if (!design) {
            console.log('❌ Diseño ID:64 no encontrado');
            return;
        }
        
        const designData = JSON.parse(design.content);
        
        console.log('📋 Información del diseño:');
        console.log(`   Nombre: ${design.name}`);
        console.log(`   Dimensiones: ${designData.width}x${designData.height}`);
        
        // Mostrar elementos de texto y sus fuentes
        const textElements = designData.pages[0].children.filter(el => el.type === 'text');
        console.log(`\n📝 Elementos de texto encontrados: ${textElements.length}`);
        textElements.forEach((el, i) => {
            console.log(`   ${i+1}. "${el.text}" - Fuente: ${el.fontFamily}`);
        });
        
        // Generar nuevo HTML con fuentes correctas
        console.log('\n🎨 Generando HTML con fuentes correctas...');
        const newHtml = renderWithKonva(designData, design.name);
        
        // Verificar que las fuentes están incluidas
        const includedFonts = [];
        textElements.forEach(el => {
            if (newHtml.includes(el.fontFamily.replace(' ', '+')) || newHtml.includes(el.fontFamily)) {
                includedFonts.push(el.fontFamily);
            }
        });
        
        console.log(`\n✅ Fuentes incluidas en el HTML: ${includedFonts.join(', ')}`);
        
        // Actualizar en la base de datos
        await database.run(
            'UPDATE designs SET html_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newHtml, 64]
        );
        
        console.log('\n💾 HTML actualizado en la base de datos');
        
        // Verificar la actualización
        const updatedDesign = await database.get('SELECT html_content FROM designs WHERE id = 64');
        
        console.log('\n🔍 Verificación final:');
        
        // Verificar cada fuente en el HTML actualizado
        textElements.forEach((el, i) => {
            const fontInHtml = updatedDesign.html_content.includes(el.fontFamily.replace(' ', '+')) || 
                              updatedDesign.html_content.includes(el.fontFamily);
            console.log(`   ${i+1}. "${el.text}" (${el.fontFamily}): ${fontInHtml ? '✅ INCLUIDA' : '❌ FALTANTE'}`);
        });
        
        console.log('\n🎉 ¡Regeneración completada!');
        console.log('\n💡 Ahora puedes probar el diseño en el navegador para verificar que las fuentes se muestran correctamente.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

regenerateDesign64WithFonts();