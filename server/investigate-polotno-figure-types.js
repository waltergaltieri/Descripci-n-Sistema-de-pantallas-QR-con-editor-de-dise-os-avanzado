const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Script para investigar cómo Polotno identifica y diferencia las figuras geométricas
 * en el JSON, especialmente círculos, rectángulos, triángulos y otras formas
 */

async function investigatePolotnoFigureTypes() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    
    console.log('🔍 INVESTIGACIÓN: Tipos de figuras en Polotno');
    console.log('=' .repeat(50));
    
    try {
        // Buscar todos los diseños que contengan figuras
        const designs = await new Promise((resolve, reject) => {
            db.all(`
                SELECT id, name, content 
                FROM designs 
                WHERE content LIKE '%"type":"figure"%' 
                   OR content LIKE '%"type":"svg"%'
                   OR content LIKE '%"type":"rect"%'
                   OR content LIKE '%"type":"circle"%'
                ORDER BY id DESC
                LIMIT 10
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📊 Encontrados ${designs.length} diseños con figuras geométricas\n`);
        
        for (const design of designs) {
            console.log(`🎨 DISEÑO ID ${design.id}: ${design.name}`);
            console.log('-'.repeat(40));
            
            try {
                const content = JSON.parse(design.content);
                
                if (content.pages && content.pages.length > 0) {
                    const page = content.pages[0];
                    
                    if (page.children && page.children.length > 0) {
                        page.children.forEach((element, index) => {
                            if (element.type === 'figure' || element.type === 'svg' || 
                                element.type === 'rect' || element.type === 'circle') {
                                
                                console.log(`   📐 Elemento ${index + 1}:`);
                                console.log(`      • Tipo: ${element.type}`);
                                console.log(`      • ID: ${element.id}`);
                                
                                // Propiedades de forma
                                if (element.width && element.height) {
                                    console.log(`      • Dimensiones: ${element.width} x ${element.height}`);
                                    
                                    // Detectar si es cuadrado (posible círculo)
                                    if (Math.abs(element.width - element.height) < 1) {
                                        console.log(`      • ⭕ FORMA: Cuadrada (posible círculo)`);
                                    } else {
                                        console.log(`      • ⬜ FORMA: Rectangular`);
                                    }
                                }
                                
                                // Propiedades específicas de figura
                                if (element.cornerRadius !== undefined) {
                                    console.log(`      • Corner Radius: ${element.cornerRadius}`);
                                    if (element.cornerRadius > 0) {
                                        console.log(`      • 🔄 ESQUINAS: Redondeadas`);
                                    }
                                }
                                
                                // Propiedades de color
                                if (element.fill) {
                                    console.log(`      • Color de relleno: ${element.fill}`);
                                }
                                
                                if (element.stroke) {
                                    console.log(`      • Color de borde: ${element.stroke}`);
                                    console.log(`      • Grosor de borde: ${element.strokeWidth || 1}`);
                                }
                                
                                // Propiedades SVG específicas
                                if (element.src) {
                                    console.log(`      • SVG Source: ${element.src.substring(0, 100)}...`);
                                    
                                    // Analizar el contenido SVG para detectar formas
                                    if (element.src.includes('<circle')) {
                                        console.log(`      • 🎯 DETECTADO: Círculo en SVG`);
                                    } else if (element.src.includes('<rect')) {
                                        console.log(`      • 🎯 DETECTADO: Rectángulo en SVG`);
                                    } else if (element.src.includes('<polygon')) {
                                        console.log(`      • 🎯 DETECTADO: Polígono en SVG`);
                                    } else if (element.src.includes('<path')) {
                                        console.log(`      • 🎯 DETECTADO: Forma personalizada (path) en SVG`);
                                    }
                                }
                                
                                // Propiedades adicionales que podrían indicar el tipo
                                const additionalProps = Object.keys(element).filter(key => 
                                    !['type', 'id', 'x', 'y', 'width', 'height', 'rotation', 
                                      'opacity', 'visible', 'fill', 'stroke', 'strokeWidth', 
                                      'cornerRadius', 'src'].includes(key)
                                );
                                
                                if (additionalProps.length > 0) {
                                    console.log(`      • Propiedades adicionales:`);
                                    additionalProps.forEach(prop => {
                                        console.log(`        - ${prop}: ${JSON.stringify(element[prop])}`);
                                    });
                                }
                                
                                console.log('');
                            }
                        });
                    } else {
                        console.log('   ⚠️ No hay elementos en la página');
                    }
                } else {
                    console.log('   ⚠️ No hay páginas en el diseño');
                }
                
            } catch (parseError) {
                console.log('   ❌ Error parseando JSON:', parseError.message);
            }
            
            console.log('');
        }
        
        // Resumen de hallazgos
        console.log('📋 RESUMEN DE HALLAZGOS:');
        console.log('=' .repeat(50));
        console.log('1. 🎯 TIPOS DE ELEMENTOS GEOMÉTRICOS EN POLOTNO:');
        console.log('   • "figure": Figuras básicas (rectángulos, con/sin esquinas redondeadas)');
        console.log('   • "svg": Formas vectoriales complejas (círculos, polígonos, paths)');
        console.log('');
        console.log('2. 🔍 CÓMO IDENTIFICAR LA FORMA ESPECÍFICA:');
        console.log('   • Para "figure": cornerRadius determina si tiene esquinas redondeadas');
        console.log('   • Para "svg": el contenido del atributo "src" contiene la forma real');
        console.log('     - <circle>: Círculo');
        console.log('     - <rect>: Rectángulo');
        console.log('     - <polygon>: Polígono (triángulos, etc.)');
        console.log('     - <path>: Formas personalizadas');
        console.log('');
        console.log('3. 💡 CONCLUSIÓN:');
        console.log('   • Polotno usa "figure" para formas simples y "svg" para formas complejas');
        console.log('   • El círculo que agregaste probablemente es tipo "svg" con <circle> interno');
        console.log('   • Para identificar la forma exacta, hay que analizar el contenido SVG');
        
    } catch (error) {
        console.error('❌ Error en la investigación:', error.message);
    } finally {
        await db.close();
    }
}

investigatePolotnoFigureTypes();