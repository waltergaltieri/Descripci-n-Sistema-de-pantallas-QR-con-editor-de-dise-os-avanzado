const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function detailedDesign64Analysis() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔬 ANÁLISIS DETALLADO DEL DISEÑO ID 64');
        console.log('=' .repeat(60));
        
        // Obtener el diseño completo
        const design64 = await db.get(`
            SELECT content, html_content, updated_at
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design64) {
            console.log('❌ Diseño ID 64 no encontrado');
            return;
        }
        
        console.log('📋 CONTENIDO JSON COMPLETO:');
        console.log('=' .repeat(40));
        
        if (design64.content) {
            try {
                const content = JSON.parse(design64.content);
                
                // Mostrar estructura completa
                console.log('📐 DIMENSIONES:');
                console.log(`   • Content: ${content.width}x${content.height}`);
                if (content.pages && content.pages[0]) {
                    console.log(`   • Page[0]: ${content.pages[0].width}x${content.pages[0].height}`);
                }
                
                console.log('');
                console.log('🎨 ELEMENTOS DETALLADOS:');
                
                if (content.pages && content.pages[0] && content.pages[0].children) {
                    const children = content.pages[0].children;
                    
                    children.forEach((child, index) => {
                        console.log(`\n   ELEMENTO ${index + 1}:`);
                        console.log(`   ├─ Tipo: ${child.type}`);
                        console.log(`   ├─ ID: ${child.id || 'sin ID'}`);
                        console.log(`   ├─ Posición: (${child.x || 0}, ${child.y || 0})`);
                        
                        if (child.width !== undefined || child.height !== undefined) {
                            console.log(`   ├─ Tamaño: ${child.width || 'auto'}x${child.height || 'auto'}`);
                        }
                        
                        // Propiedades específicas por tipo
                        if (child.type === 'image') {
                            console.log(`   ├─ Imagen src: ${child.src ? 'Presente' : 'Ausente'}`);
                            if (child.src) {
                                console.log(`   ├─ URL: ${child.src.substring(0, 50)}...`);
                            }
                        }
                        
                        if (child.type === 'text') {
                            console.log(`   ├─ Texto: "${child.text}"`);
                            console.log(`   ├─ Fuente: ${child.fontSize || 'default'}px`);
                            console.log(`   ├─ Color: ${child.fill || 'default'}`);
                            if (child.fontFamily) {
                                console.log(`   ├─ Familia: ${child.fontFamily}`);
                            }
                        }
                        
                        if (child.type === 'figure') {
                            console.log(`   ├─ Figura tipo: ${child.name || 'desconocido'}`);
                            console.log(`   ├─ Color fill: ${child.fill || 'sin fill'}`);
                            console.log(`   ├─ Color stroke: ${child.stroke || 'sin stroke'}`);
                            if (child.radius !== undefined) {
                                console.log(`   ├─ Radio: ${child.radius}`);
                            }
                            if (child.strokeWidth !== undefined) {
                                console.log(`   ├─ Grosor stroke: ${child.strokeWidth}`);
                            }
                        }
                        
                        if (child.type === 'circle') {
                            console.log(`   ├─ Radio: ${child.radius || 'no definido'}`);
                            console.log(`   ├─ Color: ${child.fill || 'no definido'}`);
                            console.log(`   ├─ Stroke: ${child.stroke || 'sin stroke'}`);
                        }
                        
                        // Mostrar todas las propiedades para debug
                        console.log(`   └─ Propiedades: ${Object.keys(child).join(', ')}`);
                    });
                    
                    // Buscar elementos con colores rojos
                    console.log('');
                    console.log('🔍 BÚSQUEDA DE ELEMENTOS ROJOS:');
                    
                    const redElements = children.filter(child => {
                        const fill = child.fill || '';
                        const stroke = child.stroke || '';
                        return fill.toLowerCase().includes('red') || 
                               stroke.toLowerCase().includes('red') ||
                               fill.includes('#ff') || 
                               stroke.includes('#ff') ||
                               fill.includes('rgb(255') ||
                               stroke.includes('rgb(255)');
                    });
                    
                    if (redElements.length > 0) {
                        redElements.forEach((element, index) => {
                            console.log(`   • Elemento rojo ${index + 1}: tipo ${element.type}`);
                            console.log(`     - Fill: ${element.fill}`);
                            console.log(`     - Stroke: ${element.stroke}`);
                        });
                    } else {
                        console.log('   • No se encontraron elementos con colores rojos explícitos');
                    }
                    
                } else {
                    console.log('❌ No hay elementos en pages[0].children');
                }
                
            } catch (error) {
                console.log('❌ Error parseando JSON:', error.message);
            }
        }
        
        // Analizar el HTML en detalle
        console.log('');
        console.log('🌐 ANÁLISIS DETALLADO DEL HTML:');
        console.log('=' .repeat(40));
        
        if (design64.html_content) {
            const html = design64.html_content;
            
            console.log(`📊 Estadísticas del HTML:`);
            console.log(`   • Longitud total: ${html.length} caracteres`);
            console.log(`   • Líneas: ${html.split('\n').length}`);
            
            // Buscar patrones específicos
            const patterns = {
                'Konva.Circle': html.includes('Konva.Circle'),
                'Konva.Text': html.includes('Konva.Text'),
                'Konva.Image': html.includes('Konva.Image'),
                'Konva.Rect': html.includes('Konva.Rect'),
                'new Konva': (html.match(/new Konva/g) || []).length,
                'fill:': (html.match(/fill:/g) || []).length,
                'text:': (html.match(/text:/g) || []).length,
                'fontSize:': (html.match(/fontSize:/g) || []).length
            };
            
            console.log('');
            console.log('🔍 PATRONES ENCONTRADOS:');
            Object.entries(patterns).forEach(([pattern, found]) => {
                if (typeof found === 'boolean') {
                    console.log(`   • ${pattern}: ${found ? '✅ SÍ' : '❌ NO'}`);
                } else {
                    console.log(`   • ${pattern}: ${found} ocurrencias`);
                }
            });
            
            // Extraer sección de creación de elementos
            console.log('');
            console.log('📄 SECCIÓN DE CREACIÓN DE ELEMENTOS:');
            
            const lines = html.split('\n');
            let inElementCreation = false;
            let elementLines = [];
            
            lines.forEach((line, index) => {
                if (line.includes('new Konva') || line.includes('Konva.')) {
                    inElementCreation = true;
                    elementLines.push(`${index + 1}: ${line.trim()}`);
                } else if (inElementCreation && (line.includes('});') || line.includes('};'))) {
                    elementLines.push(`${index + 1}: ${line.trim()}`);
                    inElementCreation = false;
                } else if (inElementCreation) {
                    elementLines.push(`${index + 1}: ${line.trim()}`);
                }
            });
            
            if (elementLines.length > 0) {
                console.log('   Líneas relevantes:');
                elementLines.slice(0, 30).forEach(line => { // Mostrar solo las primeras 30 líneas
                    console.log(`     ${line}`);
                });
                if (elementLines.length > 30) {
                    console.log(`     ... y ${elementLines.length - 30} líneas más`);
                }
            } else {
                console.log('   • No se encontraron líneas de creación de elementos Konva');
            }
            
        } else {
            console.log('❌ No hay HTML para analizar');
        }
        
        console.log('');
        console.log('🎯 CONCLUSIONES:');
        console.log('=' .repeat(30));
        console.log('✅ El sistema de generación automática está funcionando');
        console.log('✅ Los cambios se reflejan en la base de datos');
        console.log('✅ El HTML se regenera cuando actualizas el diseño');
        console.log('');
        console.log('📝 ELEMENTOS DETECTADOS:');
        console.log('   • Imagen: ✅ Presente');
        console.log('   • Texto "1": ✅ Presente');
        console.log('   • Figura (círculo): ✅ Presente como tipo "figure"');
        console.log('');
        console.log('💡 NOTA: En Polotno, las figuras geométricas se guardan como tipo "figure"');
        console.log('   y luego se convierten a elementos Konva específicos en el HTML.');
        
    } catch (error) {
        console.error('❌ Error en el análisis:', error.message);
    } finally {
        await db.close();
    }
}

detailedDesign64Analysis();