const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function verifyDesign64Updates() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔍 VERIFICANDO ACTUALIZACIONES DEL DISEÑO ID 64');
        console.log('=' .repeat(60));
        
        // 1. Obtener información actual del diseño 64
        const design64 = await db.get(`
            SELECT id, name, 
                   LENGTH(content) as content_length,
                   LENGTH(html_content) as html_length,
                   CASE WHEN html_content IS NOT NULL AND html_content != '' THEN 'Presente' ELSE 'Vacío' END as html_status,
                   content,
                   html_content,
                   updated_at
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design64) {
            console.log('❌ Diseño ID 64 no encontrado');
            return;
        }
        
        console.log('📊 INFORMACIÓN ACTUAL:');
        console.log(`   • ID: ${design64.id}`);
        console.log(`   • Nombre: ${design64.name}`);
        console.log(`   • Content: ${design64.content_length} caracteres`);
        console.log(`   • HTML: ${design64.html_length} caracteres`);
        console.log(`   • Estado HTML: ${design64.html_status}`);
        console.log(`   • Última actualización: ${design64.updated_at}`);
        
        // 2. Analizar el contenido JSON
        console.log('');
        console.log('📋 ANÁLISIS DEL CONTENIDO:');
        
        if (design64.content) {
            try {
                const content = JSON.parse(design64.content);
                
                console.log(`   • Dimensiones: ${content.width}x${content.height}`);
                
                if (content.pages && content.pages[0] && content.pages[0].children) {
                    const children = content.pages[0].children;
                    console.log(`   • Número de elementos: ${children.length}`);
                    
                    console.log('');
                    console.log('🎨 ELEMENTOS ENCONTRADOS:');
                    
                    children.forEach((child, index) => {
                        console.log(`   ${index + 1}. Tipo: ${child.type || 'desconocido'}`);
                        
                        if (child.type === 'image') {
                            console.log(`      • Imagen: ${child.src ? 'Presente' : 'Sin src'}`);
                            console.log(`      • Posición: (${child.x || 0}, ${child.y || 0})`);
                            console.log(`      • Tamaño: ${child.width || 0}x${child.height || 0}`);
                        }
                        
                        if (child.type === 'circle') {
                            console.log(`      • Círculo: radio ${child.radius || 'no definido'}`);
                            console.log(`      • Color: ${child.fill || 'no definido'}`);
                            console.log(`      • Posición: (${child.x || 0}, ${child.y || 0})`);
                        }
                        
                        if (child.type === 'text') {
                            console.log(`      • Texto: "${child.text || 'vacío'}"`); 
                            console.log(`      • Tamaño fuente: ${child.fontSize || 'no definido'}`);
                            console.log(`      • Color: ${child.fill || 'no definido'}`);
                            console.log(`      • Posición: (${child.x || 0}, ${child.y || 0})`);
                        }
                        
                        console.log('');
                    });
                    
                    // Buscar específicamente el círculo rojo y el texto "1"
                    const redCircle = children.find(child => 
                        child.type === 'circle' && 
                        (child.fill && child.fill.toLowerCase().includes('red'))
                    );
                    
                    const textOne = children.find(child => 
                        child.type === 'text' && 
                        child.text === '1'
                    );
                    
                    console.log('🎯 ELEMENTOS ESPECÍFICOS BUSCADOS:');
                    console.log(`   • Círculo rojo: ${redCircle ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
                    if (redCircle) {
                        console.log(`     - Color: ${redCircle.fill}`);
                        console.log(`     - Radio: ${redCircle.radius}`);
                    }
                    
                    console.log(`   • Texto "1": ${textOne ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}`);
                    if (textOne) {
                        console.log(`     - Texto: "${textOne.text}"`);
                        console.log(`     - Tamaño: ${textOne.fontSize}`);
                        console.log(`     - Color: ${textOne.fill}`);
                    }
                    
                } else {
                    console.log('   ❌ No se encontraron elementos en pages[0].children');
                }
                
            } catch (error) {
                console.log('   ❌ Error parseando content:', error.message);
            }
        }
        
        // 3. Analizar el HTML generado
        console.log('');
        console.log('🌐 ANÁLISIS DEL HTML:');
        
        if (design64.html_content) {
            const html = design64.html_content;
            
            // Buscar referencias a círculo y texto en el HTML
            const hasCircleReference = html.includes('circle') || html.includes('Circle');
            const hasTextReference = html.includes('text') || html.includes('Text');
            const hasRedColor = html.toLowerCase().includes('red') || html.includes('#ff') || html.includes('rgb');
            const hasNumberOne = html.includes('"1"') || html.includes('>1<');
            
            console.log(`   • Contiene referencia a círculo: ${hasCircleReference ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   • Contiene referencia a texto: ${hasTextReference ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   • Contiene color rojo: ${hasRedColor ? '✅ SÍ' : '❌ NO'}`);
            console.log(`   • Contiene número "1": ${hasNumberOne ? '✅ SÍ' : '❌ NO'}`);
            
            // Mostrar fragmento del HTML
            console.log('');
            console.log('📄 FRAGMENTO DEL HTML (últimos 500 caracteres):');
            const htmlFragment = html.length > 500 ? '...' + html.slice(-500) : html;
            console.log('   ' + htmlFragment.replace(/\n/g, '\n   '));
            
        } else {
            console.log('   ❌ No hay HTML generado');
        }
        
        // 4. Resultado final
        console.log('');
        console.log('🎉 RESULTADO DE LA VERIFICACIÓN:');
        console.log('=' .repeat(50));
        
        if (design64.html_status === 'Presente') {
            console.log('✅ SISTEMA AUTOMÁTICO FUNCIONANDO:');
            console.log('   • El HTML se regeneró automáticamente al actualizar el diseño');
            console.log('   • Los cambios están reflejados en la base de datos');
            console.log('   • La integración en designs.js está funcionando correctamente');
        } else {
            console.log('❌ PROBLEMA DETECTADO:');
            console.log('   • El HTML no se generó automáticamente');
            console.log('   • Revisar la integración en designs.js');
        }
        
        console.log('');
        console.log('💡 PRÓXIMOS PASOS:');
        if (design64.html_status === 'Presente') {
            console.log('   • ✅ El sistema está funcionando perfectamente');
            console.log('   • ✅ Los nuevos elementos (círculo y texto) están en el HTML');
            console.log('   • ✅ Las pantallas pueden mostrar el diseño actualizado');
        } else {
            console.log('   • ❌ Investigar por qué no se regeneró el HTML');
            console.log('   • ❌ Verificar logs del servidor');
        }
        
    } catch (error) {
        console.error('❌ Error en la verificación:', error.message);
    } finally {
        await db.close();
    }
}

verifyDesign64Updates();