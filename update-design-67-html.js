const { db, initialize } = require('./server/config/database');
const konvaRenderer = require('./server/utils/konvaRenderer');

async function updateDesignHtml() {
    try {
        await initialize();
        const database = db();
        
        // Obtener el diseño
        const design = await database.get('SELECT * FROM designs WHERE id = ?', [67]);
        
        if (!design) {
            console.log('❌ Diseño 67 no encontrado');
            return;
        }
        
        console.log('✅ Diseño encontrado:', design.name);
        
        // Parsear el contenido
        const designData = JSON.parse(design.content);
        
        // Generar nuevo HTML
        console.log('🔄 Generando nuevo HTML...');
        const newHtml = await konvaRenderer.renderWithKonva(designData, design.name, 67);
        
        // Actualizar en la base de datos
        await database.run(
            'UPDATE designs SET html_content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newHtml, 67]
        );
        
        console.log('✅ HTML actualizado en la base de datos');
        console.log('📏 Nueva longitud:', newHtml.length);
        console.log('🔍 Contiene Google Fonts:', newHtml.includes('fonts.googleapis.com'));
        console.log('🔍 Contiene @font-face:', newHtml.includes('@font-face'));
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        process.exit(0);
    }
}

updateDesignHtml();