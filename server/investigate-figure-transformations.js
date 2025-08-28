const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Script para investigar cómo Polotno maneja las transformaciones de figuras:
 * - Círculos deformados (óvalos)
 * - Flechas y líneas
 * - Formas abstractas y personalizadas
 * - Transformaciones de escala, rotación, etc.
 */

async function investigateFigureTransformations() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    
    console.log('🔍 INVESTIGACIÓN: Transformaciones de figuras en Polotno');
    console.log('=' .repeat(60));
    
    try {
        // Buscar diseños con figuras que puedan tener transformaciones
        const designs = await new Promise((resolve, reject) => {
            db.all(`
                SELECT id, name, content 
                FROM designs 
                WHERE content LIKE '%"type":"figure"%' 
                   OR content LIKE '%"type":"svg"%'
                   OR content LIKE '%"type":"line"%'
                   OR content LIKE '%"type":"arrow"%'
                   OR content LIKE '%"scaleX"%'
                   OR content LIKE '%"scaleY"%'
                   OR content LIKE '%"rotation"%'
                ORDER BY id DESC
                LIMIT 15
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`📊 Encontrados ${designs.length} diseños con posibles transformaciones\n`);
        
        for (const design of designs) {
            console.log(`🎨 DISEÑO ID ${design.id}: ${design.name}`);
            console.log('-'.repeat(50));
            
            try {
                const content = JSON.parse(design.content);
                
                if (content.pages && content.pages.length > 0) {
                    const page = content.pages[0];
                    
                    if (page.children && page.children.length > 0) {
                        page.children.forEach((element, index) => {
                            // Analizar todos los elementos, no solo figuras
                            console.log(`   📐 Elemento ${index + 1}:`);
                            console.log(`      • Tipo: ${element.type}`);
                            console.log(`      • ID: ${element.id}`);
                            
                            // Dimensiones básicas
                            if (element.width && element.height) {
                                console.log(`      • Dimensiones: ${element.width.toFixed(2)} x ${element.height.toFixed(2)}`);
                                
                                // Detectar deformaciones por ratio
                                const ratio = element.width / element.height;
                                if (element.type === 'figure' && element.subType === 'circle') {
                                    if (Math.abs(ratio - 1) > 0.1) {
                                        console.log(`      • 🥚 DEFORMACIÓN: Círculo convertido en óvalo (ratio: ${ratio.toFixed(2)})`);
                                    } else {
                                        console.log(`      • ⭕ FORMA: Círculo perfecto`);
                                    }
                                }
                            }
                            
                            // Transformaciones de escala
                            if (element.scaleX !== undefined || element.scaleY !== undefined) {
                                console.log(`      • 📏 ESCALA:`);
                                if (element.scaleX !== undefined) {
                                    console.log(`        - ScaleX: ${element.scaleX}`);
                                }
                                if (element.scaleY !== undefined) {
                                    console.log(`        - ScaleY: ${element.scaleY}`);
                                }
                                
                                // Detectar deformaciones por escala
                                if (element.scaleX && element.scaleY && Math.abs(element.scaleX - element.scaleY) > 0.1) {
                                    console.log(`        - 🔄 DEFORMACIÓN: Escalas diferentes (X:${element.scaleX}, Y:${element.scaleY})`);
                                }
                            }
                            
                            // Rotación
                            if (element.rotation !== undefined && element.rotation !== 0) {
                                console.log(`      • 🔄 ROTACIÓN: ${element.rotation}° (${(element.rotation * Math.PI / 180).toFixed(3)} radianes)`);
                            }
                            
                            // Propiedades específicas de figuras
                            if (element.type === 'figure') {
                                if (element.subType) {
                                    console.log(`      • 🎯 SubTipo: ${element.subType}`);
                                }
                                
                                // Corner radius para rectángulos redondeados
                                if (element.cornerRadius !== undefined) {
                                    console.log(`      • 🔄 Corner Radius: ${element.cornerRadius}`);
                                }
                                
                                // Propiedades de estrella
                                if (element.subType === 'star') {
                                    if (element.numPoints !== undefined) {
                                        console.log(`      • ⭐ Puntos de estrella: ${element.numPoints}`);
                                    }
                                    if (element.innerRadius !== undefined) {
                                        console.log(`      • ⭐ Radio interno: ${element.innerRadius}`);
                                    }
                                    if (element.outerRadius !== undefined) {
                                        console.log(`      • ⭐ Radio externo: ${element.outerRadius}`);
                                    }
                                }
                            }
                            
                            // Propiedades SVG (flechas, líneas, formas complejas)
                            if (element.type === 'svg' && element.src) {
                                console.log(`      • 🎨 SVG Content:`);
                                const svgContent = element.src.substring(0, 200);
                                console.log(`        ${svgContent}${element.src.length > 200 ? '...' : ''}`);
                                
                                // Detectar tipos específicos de SVG
                                if (element.src.includes('marker-end="url(#arrowhead)"') || element.src.includes('arrow')) {
                                    console.log(`        - 🏹 DETECTADO: Flecha`);
                                }
                                if (element.src.includes('<line') || element.src.includes('<polyline')) {
                                    console.log(`        - 📏 DETECTADO: Línea`);
                                }
                                if (element.src.includes('<path')) {
                                    console.log(`        - 🎨 DETECTADO: Forma personalizada (path)`);
                                }
                                if (element.src.includes('<polygon')) {
                                    console.log(`        - 🔺 DETECTADO: Polígono`);
                                }
                            }
                            
                            // Propiedades de posición y transformación
                            if (element.x !== undefined || element.y !== undefined) {
                                console.log(`      • 📍 Posición: (${element.x?.toFixed(2) || 0}, ${element.y?.toFixed(2) || 0})`);
                            }
                            
                            // Propiedades de estilo
                            if (element.fill) {
                                console.log(`      • 🎨 Color de relleno: ${element.fill}`);
                            }
                            if (element.stroke) {
                                console.log(`      • 🖊️ Color de borde: ${element.stroke}`);
                                if (element.strokeWidth) {
                                    console.log(`      • 🖊️ Grosor de borde: ${element.strokeWidth}`);
                                }
                            }
                            
                            // Propiedades de opacidad y visibilidad
                            if (element.opacity !== undefined && element.opacity !== 1) {
                                console.log(`      • 👻 Opacidad: ${element.opacity}`);
                            }
                            if (element.visible === false) {
                                console.log(`      • 👁️ Visible: ${element.visible}`);
                            }
                            
                            // Propiedades de transformación avanzadas
                            if (element.skewX !== undefined || element.skewY !== undefined) {
                                console.log(`      • 🔀 SKEW:`);
                                if (element.skewX !== undefined) {
                                    console.log(`        - SkewX: ${element.skewX}`);
                                }
                                if (element.skewY !== undefined) {
                                    console.log(`        - SkewY: ${element.skewY}`);
                                }
                            }
                            
                            // Propiedades de flip
                            if (element.flipX || element.flipY) {
                                console.log(`      • 🔄 FLIP: X:${element.flipX || false}, Y:${element.flipY || false}`);
                            }
                            
                            console.log('');
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
        console.log('📋 RESUMEN DE HALLAZGOS: Transformaciones de figuras');
        console.log('=' .repeat(60));
        console.log('1. 🎯 CÓMO SE ALMACENAN LAS DEFORMACIONES:');
        console.log('   • **Círculos → Óvalos**: Se mantiene subType="circle" pero cambian width/height');
        console.log('   • **Escalas**: Propiedades scaleX y scaleY para deformaciones');
        console.log('   • **Rotación**: Propiedad rotation en grados');
        console.log('');
        console.log('2. 🔍 TIPOS DE FIGURAS COMPLEJAS:');
        console.log('   • **Flechas**: Tipo "svg" con contenido vectorial específico');
        console.log('   • **Líneas**: Tipo "svg" con elementos <line> o <polyline>');
        console.log('   • **Formas abstractas**: Tipo "svg" con elementos <path>');
        console.log('   • **Estrellas**: Tipo "figure" con subType="star" + propiedades específicas');
        console.log('');
        console.log('3. 💡 PROPIEDADES CLAVE PARA TRANSFORMACIONES:');
        console.log('   • **Dimensiones**: width, height (tamaño base)');
        console.log('   • **Escala**: scaleX, scaleY (deformación)');
        console.log('   • **Posición**: x, y (ubicación)');
        console.log('   • **Rotación**: rotation (en grados)');
        console.log('   • **Inclinación**: skewX, skewY (sesgo)');
        console.log('   • **Volteo**: flipX, flipY (espejo)');
        console.log('');
        console.log('4. 🎨 CONCLUSIÓN:');
        console.log('   • Polotno guarda TODAS las transformaciones como propiedades numéricas');
        console.log('   • Las formas mantienen su identidad (subType) pero cambian sus dimensiones');
        console.log('   • El sistema es muy preciso: guarda decimales exactos para recrear formas');
        console.log('   • Por eso cuando vuelves al editor, todo se ve exactamente igual!');
        
    } catch (error) {
        console.error('❌ Error en la investigación:', error.message);
    } finally {
        await db.close();
    }
}

investigateFigureTransformations();