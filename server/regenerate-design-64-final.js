const { db, initialize } = require('./config/database');
const { renderWithKonva } = require('./utils/konvaRenderer');
const fs = require('fs');

async function regenerateDesign64() {
    try {
        console.log('🔄 REGENERANDO DISEÑO 64 CON CORRECCIONES FINALES...');
        console.log('=' .repeat(60));
        
        await initialize();
        const database = db();
        
        // Obtener el diseño 64
        const design = await database.get('SELECT * FROM designs WHERE id = ?', [64]);
        
        if (!design) {
            throw new Error('Diseño 64 no encontrado');
        }
        
        console.log(`📋 Diseño encontrado: "${design.name}"`);
        
        // Parsear el contenido JSON
        const designData = JSON.parse(design.content);
        
        console.log('\n🔍 ANÁLISIS DEL DISEÑO:');
        console.log('-'.repeat(40));
        console.log(`   • Dimensiones: ${designData.width}x${designData.height}px`);
        console.log(`   • Páginas: ${designData.pages.length}`);
        
        const firstPage = designData.pages[0];
        console.log(`   • Elementos en página 1: ${firstPage.children.length}`);
        
        // Buscar el elemento de texto "1"
        const textElement = firstPage.children.find(child => 
            child.type === 'text' && child.text === '1'
        );
        
        if (textElement) {
            console.log('\n📝 ELEMENTO DE TEXTO "1" ENCONTRADO:');
            console.log('-'.repeat(40));
            console.log(`   • Posición original: X=${textElement.x}, Y=${textElement.y}`);
            console.log(`   • Dimensiones: ${textElement.width}x${textElement.height}`);
            console.log(`   • Alineación: ${textElement.align}`);
            console.log(`   • Fuente: ${textElement.fontFamily}, ${textElement.fontSize}px`);
            console.log(`   • Peso: ${textElement.fontWeight}`);
        }
        
        console.log('\n🛠️  GENERANDO HTML CON CORRECCIONES:');
        console.log('-'.repeat(40));
        console.log('   ✅ Coordenadas originales (sin ajustes de alineación)');
        console.log('   ✅ Canvas directo (sin padding del contenedor)');
        console.log('   ✅ Centrado visual con CSS flexbox');
        
        // Generar HTML con las correcciones
        const htmlContent = renderWithKonva(designData, design.name);
        
        // Guardar el archivo HTML
        const timestamp = Date.now();
        const filename = `design-64-final-corrected-${timestamp}.html`;
        fs.writeFileSync(filename, htmlContent);
        
        console.log(`\n✅ HTML generado: ${filename}`);
        
        // Actualizar la base de datos
        await database.run(
            'UPDATE designs SET html_content = ? WHERE id = ?',
            [htmlContent, 64]
        );
        
        console.log('✅ Base de datos actualizada');
        
        // Extraer y mostrar las coordenadas finales del JSON de Konva
        const konvaJsonMatch = htmlContent.match(/const konvaJson = "(.*?)";/);
        if (konvaJsonMatch) {
            const konvaJsonStr = konvaJsonMatch[1].replace(/\\"/g, '"');
            const konvaData = JSON.parse(konvaJsonStr);
            
            const layer = konvaData.children[0];
            const konvaTextElement = layer.children.find(child => 
                child.className === 'Text' && child.attrs.text === '1'
            );
            
            if (konvaTextElement) {
                console.log('\n🎯 COORDENADAS FINALES EN KONVA:');
                console.log('-'.repeat(40));
                console.log(`   • X: ${konvaTextElement.attrs.x}`);
                console.log(`   • Y: ${konvaTextElement.attrs.y}`);
                console.log(`   • Alineación: ${konvaTextElement.attrs.align}`);
                console.log(`   • Fuente: ${konvaTextElement.attrs.fontFamily}`);
                console.log(`   • Tamaño: ${konvaTextElement.attrs.fontSize}px`);
            }
        }
        
        console.log('\n🎉 REGENERACIÓN COMPLETADA EXITOSAMENTE');
        console.log('=' .repeat(60));
        console.log('\n📋 RESUMEN DE CORRECCIONES APLICADAS:');
        console.log('   1. ✅ Coordenadas originales sin ajustes de alineación');
        console.log('   2. ✅ Canvas directo sin padding del contenedor');
        console.log('   3. ✅ Centrado visual con CSS flexbox');
        console.log('   4. ✅ Eliminación de desplazamientos CSS');
        console.log('\n🔍 Para verificar: Abre el archivo HTML y compara con el diseño original');
        
        return {
            success: true,
            filename,
            designName: design.name
        };
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

if (require.main === module) {
    regenerateDesign64();
}

module.exports = { regenerateDesign64 };