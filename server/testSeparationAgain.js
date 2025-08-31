const { separateDesignFigures } = require('./utils/figuresSeparator');
const { initialize, db } = require('./config/database');
const path = require('path');

async function testSeparationAgain() {
    console.log('🔄 Probando separación del diseño "Exportacion a svg" nuevamente...');
    
    try {
        // Conectar a la base de datos usando la configuración correcta
        await initialize();
        const database = db();
        
        // Buscar el diseño "Exportacion a svg"
        const design = await database.get(
            'SELECT * FROM designs WHERE name = ? ORDER BY id DESC LIMIT 1',
            ['Exportacion a svg']
        );
        
        if (!design) {
            console.log('❌ No se encontró el diseño "Exportacion a svg"');
            return;
        }
        
        console.log(`✅ Diseño encontrado: ID ${design.id}, Nombre: "${design.name}"`);
        
        // Analizar el contenido del diseño
        const designContent = JSON.parse(design.content);
        console.log(`📊 Canvas: ${designContent.width}x${designContent.height}`);
        
        // Verificar si existe la propiedad pages (estructura de Polotno)
        if (!designContent.pages || !Array.isArray(designContent.pages) || designContent.pages.length === 0) {
            console.log('❌ El diseño no tiene páginas válidas');
            console.log('📋 Estructura del diseño:', Object.keys(designContent));
            return;
        }
        
        // Obtener los elementos de la primera página
        const firstPage = designContent.pages[0];
        if (!firstPage.children || !Array.isArray(firstPage.children)) {
            console.log('❌ La primera página no tiene elementos children válidos');
            console.log('📋 Estructura de la página:', Object.keys(firstPage));
            return;
        }
        
        console.log(`📦 Total de páginas: ${designContent.pages.length}`);
        console.log(`📦 Total de elementos en la primera página: ${firstPage.children.length}`);
        
        // Contar tipos de elementos
        let figureCount = 0;
        let maskedImageCount = 0;
        let otherCount = 0;
        
        firstPage.children.forEach(element => {
            if (element.type === 'image' && element.clipSrc) {
                maskedImageCount++;
                console.log(`🖼️ Imagen enmascarada encontrada: ID ${element.id}`);
            } else if (['rect', 'circle', 'path', 'polygon', 'ellipse', 'line'].includes(element.type)) {
                figureCount++;
                console.log(`🔷 Figura encontrada: ${element.type} (ID: ${element.id})`);
            } else {
                otherCount++;
                console.log(`📄 Otro elemento: ${element.type} (ID: ${element.id})`);
            }
        });
        
        console.log(`\n📈 Resumen:`);
        console.log(`   - Figuras geométricas: ${figureCount}`);
        console.log(`   - Imágenes enmascaradas: ${maskedImageCount}`);
        console.log(`   - Otros elementos: ${otherCount}`);
        console.log(`   - Total procesable: ${figureCount + maskedImageCount}`);
        
        // Ejecutar la separación
        console.log('\n🚀 Iniciando separación de figuras...');
        const result = await separateDesignFigures(design.id);
        
        console.log('\n✅ Separación completada exitosamente!');
        console.log(`📊 Resultado:`);
        
        // Verificar la estructura del resultado
        if (result && typeof result === 'object') {
            console.log(`   - Figuras separadas: ${result.separatedCount || 'No disponible'}`);
            console.log(`   - Nuevos diseños creados: ${result.newDesigns ? result.newDesigns.length : 'No disponible'}`);
        } else {
            console.log(`   - Resultado: ${result}`);
            console.log('   - La separación se completó pero el formato del resultado es inesperado');
            return;
        }
        
        // Mostrar detalles de los nuevos diseños
        if (result.newDesigns && Array.isArray(result.newDesigns)) {
            result.newDesigns.forEach((newDesign, index) => {
            console.log(`\n🎨 Diseño ${index + 1}:`);
            console.log(`   - ID: ${newDesign.id}`);
            console.log(`   - Nombre: "${newDesign.name}"`);
            
            const content = JSON.parse(newDesign.content);
            const element = content.children[0];
            
            if (element.type === 'image' && element.clipSrc) {
                console.log(`   - Tipo: Imagen enmascarada`);
                console.log(`   - Posición: (${element.x}, ${element.y})`);
                console.log(`   - Tamaño: ${element.width}x${element.height}`);
                console.log(`   - Tiene máscara SVG: ${element.clipSrc ? 'Sí' : 'No'}`);
            } else {
                console.log(`   - Tipo: ${element.type}`);
                console.log(`   - Posición: (${element.x}, ${element.y})`);
                console.log(`   - Tamaño: ${element.width}x${element.height}`);
                if (element.fill) {
                    console.log(`   - Color: ${element.fill}`);
                }
            }
            });
        } else {
            console.log('   - No se pudieron obtener los detalles de los nuevos diseños');
        }
        
        await database.close();
        console.log('\n🎉 Prueba completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
}

// Ejecutar la prueba
testSeparationAgain();