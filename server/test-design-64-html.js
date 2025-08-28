const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
require('dotenv').config();

async function testDesign64HTML() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🎨 PROBANDO GENERACIÓN DE HTML PARA DISEÑO ID 64');
        console.log('=' .repeat(60));
        
        // Obtener el diseño ID 64
        const design = await db.get(`
            SELECT id, name, content 
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design) {
            console.log('❌ No se encontró el diseño ID 64');
            return;
        }
        
        console.log(`✅ Diseño encontrado: "${design.name}"`);
        
        // Parsear el contenido
        const content = JSON.parse(design.content);
        
        console.log('');
        console.log('📐 DIMENSIONES DEL DISEÑO:');
        console.log(`   • content.width: ${content.width}`);
        console.log(`   • content.height: ${content.height}`);
        console.log(`   • pages[0].width: ${content.pages[0].width}`);
        console.log(`   • pages[0].height: ${content.pages[0].height}`);
        
        // Verificar sincronización
        const isSynced = content.width === content.pages[0].width && content.height === content.pages[0].height;
        console.log(`   • Sincronizado: ${isSynced ? '✅ SÍ' : '❌ NO'}`);
        
        console.log('');
        console.log('🔧 GENERANDO HTML...');
        
        try {
            // Generar HTML usando konvaRenderer
            const html = await konvaRenderer.renderWithKonva(content, design.name);
            
            // Guardar el HTML generado
            const timestamp = Date.now();
            const filename = `design-64-test-${timestamp}.html`;
            fs.writeFileSync(filename, html);
            
            console.log(`✅ HTML generado exitosamente: ${filename}`);
            
            // Analizar el HTML generado
            console.log('');
            console.log('🔍 ANÁLISIS DEL HTML GENERADO:');
            
            // Verificar dimensiones en el HTML
            const hasWidth1080 = html.includes('1080');
            const hasHeight1920 = html.includes('1920');
            
            console.log(`   • Contiene ancho (1080): ${hasWidth1080 ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   • Contiene alto (1920): ${hasHeight1920 ? '✅ SÍ' : '❌ NO'}`);
            
            // Buscar el JSON de Konva en el HTML
            const konvaJsonMatch = html.match(/const konvaJson = ({[\s\S]*?});/);
            if (konvaJsonMatch) {
                try {
                    const konvaJsonStr = konvaJsonMatch[1];
                    console.log(`   • JSON Konva encontrado: ✅ SÍ`);
                    
                    // Verificar dimensiones en el JSON
                    const hasKonvaWidth = konvaJsonStr.includes('width:1080') || konvaJsonStr.includes('"width":1080');
                    const hasKonvaHeight = konvaJsonStr.includes('height:1920') || konvaJsonStr.includes('"height":1920');
                    
                    console.log(`   • JSON contiene width 1080: ${hasKonvaWidth ? '✅ SÍ' : '❌ NO'}`);
                    console.log(`   • JSON contiene height 1920: ${hasKonvaHeight ? '✅ SÍ' : '❌ NO'}`);
                    
                } catch (jsonError) {
                    console.log(`   • Error al analizar JSON Konva: ${jsonError.message}`);
                }
            } else {
                console.log(`   • JSON Konva encontrado: ❌ NO`);
            }
            
            // Contar elementos renderizados
            const textElements = (html.match(/new Konva\.Text\(/g) || []).length;
            const imageElements = (html.match(/new Konva\.Image\(/g) || []).length;
            const totalElements = textElements + imageElements;
            
            console.log(`   • Elementos de texto: ${textElements}`);
            console.log(`   • Elementos de imagen: ${imageElements}`);
            console.log(`   • Total elementos: ${totalElements}`);
            
            // Verificar información de dimensiones en el HTML
            const dimensionInfoMatch = html.match(/Dimensiones: (\d+)x(\d+)px/);
            if (dimensionInfoMatch) {
                const [, width, height] = dimensionInfoMatch;
                console.log(`   • Info de dimensiones: ${width}x${height}px`);
                const correctDimensions = width === '1080' && height === '1920';
                console.log(`   • Dimensiones correctas en info: ${correctDimensions ? '✅ SÍ' : '❌ NO'}`);
            }
            
            console.log('');
            console.log('🎯 RESULTADO FINAL:');
            
            if (hasWidth1080 && hasHeight1920) {
                console.log('✅ ¡ÉXITO! El HTML se generó con las dimensiones correctas.');
                console.log('   → La sincronización de dimensiones funciona perfectamente.');
                console.log('   → El renderizado HTML lee las dimensiones correctas del content.');
                console.log(`   → Archivo generado: ${filename}`);
            } else {
                console.log('❌ PROBLEMA: El HTML no contiene las dimensiones esperadas.');
                console.log('   → Puede haber un problema en el renderizado.');
            }
            
        } catch (renderError) {
            console.log('❌ Error al generar HTML:', renderError.message);
            console.log('   → Stack:', renderError.stack);
        }
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
    } finally {
        await db.close();
    }
}

testDesign64HTML();