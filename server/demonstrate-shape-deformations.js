const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Script para demostrar específicamente cómo Polotno maneja las deformaciones:
 * - Círculos → Óvalos (cambio de dimensiones)
 * - Escalas y transformaciones
 * - Formas complejas como flechas y líneas
 */

async function demonstrateShapeDeformations() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    const db = new sqlite3.Database(dbPath);
    
    console.log('🔬 DEMOSTRACIÓN: Cómo Polotno maneja las deformaciones de figuras');
    console.log('=' .repeat(70));
    
    try {
        // Crear un diseño de ejemplo con diferentes tipos de deformaciones
        const demoDesign = {
            "pages": [{
                "id": "demo-page",
                "children": [
                    // 1. Círculo perfecto
                    {
                        "id": "perfect-circle",
                        "type": "figure",
                        "subType": "circle",
                        "x": 100,
                        "y": 100,
                        "width": 200,
                        "height": 200,
                        "fill": "rgba(255,0,0,1)",
                        "stroke": "#000000",
                        "strokeWidth": 2
                    },
                    // 2. Círculo deformado → Óvalo horizontal
                    {
                        "id": "oval-horizontal",
                        "type": "figure",
                        "subType": "circle",
                        "x": 350,
                        "y": 100,
                        "width": 300,
                        "height": 150,
                        "fill": "rgba(0,255,0,1)",
                        "stroke": "#000000",
                        "strokeWidth": 2
                    },
                    // 3. Círculo deformado → Óvalo vertical
                    {
                        "id": "oval-vertical",
                        "type": "figure",
                        "subType": "circle",
                        "x": 700,
                        "y": 100,
                        "width": 120,
                        "height": 250,
                        "fill": "rgba(0,0,255,1)",
                        "stroke": "#000000",
                        "strokeWidth": 2
                    },
                    // 4. Círculo con escala diferente
                    {
                        "id": "scaled-circle",
                        "type": "figure",
                        "subType": "circle",
                        "x": 100,
                        "y": 400,
                        "width": 200,
                        "height": 200,
                        "scaleX": 2.5,
                        "scaleY": 0.8,
                        "fill": "rgba(255,255,0,1)",
                        "stroke": "#000000",
                        "strokeWidth": 2
                    },
                    // 5. Rectángulo con esquinas redondeadas
                    {
                        "id": "rounded-rect",
                        "type": "figure",
                        "subType": "rect",
                        "x": 400,
                        "y": 400,
                        "width": 250,
                        "height": 150,
                        "cornerRadius": 50,
                        "fill": "rgba(255,0,255,1)",
                        "stroke": "#000000",
                        "strokeWidth": 2
                    },
                    // 6. Estrella con propiedades específicas
                    {
                        "id": "custom-star",
                        "type": "figure",
                        "subType": "star",
                        "x": 700,
                        "y": 400,
                        "width": 200,
                        "height": 200,
                        "numPoints": 8,
                        "innerRadius": 0.4,
                        "outerRadius": 1,
                        "fill": "rgba(0,255,255,1)",
                        "stroke": "#000000",
                        "strokeWidth": 2
                    },
                    // 7. Flecha SVG
                    {
                        "id": "arrow-svg",
                        "type": "svg",
                        "x": 100,
                        "y": 650,
                        "width": 300,
                        "height": 100,
                        "src": "<svg viewBox='0 0 300 100'><defs><marker id='arrowhead' markerWidth='10' markerHeight='7' refX='9' refY='3.5' orient='auto'><polygon points='0 0, 10 3.5, 0 7' fill='black'/></marker></defs><line x1='10' y1='50' x2='290' y2='50' stroke='black' stroke-width='4' marker-end='url(#arrowhead)'/></svg>",
                        "fill": "rgba(0,0,0,1)"
                    },
                    // 8. Línea curva (path)
                    {
                        "id": "curved-line",
                        "type": "svg",
                        "x": 500,
                        "y": 650,
                        "width": 300,
                        "height": 100,
                        "src": "<svg viewBox='0 0 300 100'><path d='M 10 50 Q 150 10 290 50' stroke='purple' stroke-width='6' fill='none'/></svg>",
                        "fill": "rgba(128,0,128,1)"
                    },
                    // 9. Figura rotada
                    {
                        "id": "rotated-rect",
                        "type": "figure",
                        "subType": "rect",
                        "x": 100,
                        "y": 800,
                        "width": 200,
                        "height": 100,
                        "rotation": 45,
                        "fill": "rgba(255,165,0,1)",
                        "stroke": "#000000",
                        "strokeWidth": 2
                    },
                    // 10. Figura con skew (sesgo)
                    {
                        "id": "skewed-rect",
                        "type": "figure",
                        "subType": "rect",
                        "x": 400,
                        "y": 800,
                        "width": 200,
                        "height": 100,
                        "skewX": 0.5,
                        "skewY": 0.2,
                        "fill": "rgba(144,238,144,1)",
                        "stroke": "#000000",
                        "strokeWidth": 2
                    }
                ]
            }]
        };
        
        console.log('📝 ANÁLISIS DE CADA TIPO DE DEFORMACIÓN:\n');
        
        demoDesign.pages[0].children.forEach((element, index) => {
            console.log(`${index + 1}. 🎯 ${element.id.toUpperCase().replace(/-/g, ' ')}`);
            console.log(`   • Tipo: ${element.type} ${element.subType ? `(${element.subType})` : ''}`);
            
            if (element.width && element.height) {
                const ratio = element.width / element.height;
                console.log(`   • Dimensiones: ${element.width} x ${element.height} (ratio: ${ratio.toFixed(2)})`);
                
                // Análisis específico para círculos
                if (element.subType === 'circle') {
                    if (Math.abs(ratio - 1) < 0.01) {
                        console.log(`   • 🟢 FORMA: Círculo perfecto`);
                    } else if (ratio > 1) {
                        console.log(`   • 🔵 DEFORMACIÓN: Óvalo horizontal (${((ratio - 1) * 100).toFixed(1)}% más ancho)`);
                    } else {
                        console.log(`   • 🔵 DEFORMACIÓN: Óvalo vertical (${((1 - ratio) * 100).toFixed(1)}% más alto)`);
                    }
                }
            }
            
            // Análisis de escalas
            if (element.scaleX !== undefined || element.scaleY !== undefined) {
                console.log(`   • 📏 ESCALA: X=${element.scaleX || 1}, Y=${element.scaleY || 1}`);
                const scaleRatio = (element.scaleX || 1) / (element.scaleY || 1);
                if (Math.abs(scaleRatio - 1) > 0.1) {
                    console.log(`   • 🔄 EFECTO: Deformación por escala (ratio: ${scaleRatio.toFixed(2)})`);
                }
            }
            
            // Análisis de rotación
            if (element.rotation !== undefined && element.rotation !== 0) {
                console.log(`   • 🔄 ROTACIÓN: ${element.rotation}°`);
            }
            
            // Análisis de sesgo (skew)
            if (element.skewX !== undefined || element.skewY !== undefined) {
                console.log(`   • 🔀 SESGO: X=${element.skewX || 0}, Y=${element.skewY || 0}`);
            }
            
            // Análisis de propiedades especiales
            if (element.cornerRadius !== undefined) {
                console.log(`   • 🔄 ESQUINAS: Radio ${element.cornerRadius}px`);
            }
            
            if (element.numPoints !== undefined) {
                console.log(`   • ⭐ ESTRELLA: ${element.numPoints} puntas`);
            }
            
            // Análisis de SVG
            if (element.type === 'svg' && element.src) {
                if (element.src.includes('marker-end')) {
                    console.log(`   • 🏹 TIPO SVG: Flecha con punta`);
                } else if (element.src.includes('<path')) {
                    console.log(`   • 🎨 TIPO SVG: Forma personalizada (path)`);
                } else if (element.src.includes('<line')) {
                    console.log(`   • 📏 TIPO SVG: Línea`);
                }
            }
            
            console.log(`   • 🎨 Color: ${element.fill}`);
            console.log('');
        });
        
        console.log('\n🔍 CONCLUSIONES CLAVE SOBRE DEFORMACIONES:');
        console.log('=' .repeat(70));
        
        console.log('\n1. 🎯 CÍRCULOS → ÓVALOS:');
        console.log('   • Polotno mantiene subType="circle" siempre');
        console.log('   • La deformación se logra cambiando width y height');
        console.log('   • Ratio width/height determina la forma:');
        console.log('     - Ratio = 1.0: Círculo perfecto');
        console.log('     - Ratio > 1.0: Óvalo horizontal');
        console.log('     - Ratio < 1.0: Óvalo vertical');
        
        console.log('\n2. 📏 ESCALAS (scaleX, scaleY):');
        console.log('   • Se aplican DESPUÉS de las dimensiones base');
        console.log('   • Permiten deformaciones adicionales sin cambiar width/height');
        console.log('   • Útiles para transformaciones dinámicas');
        
        console.log('\n3. 🔄 TRANSFORMACIONES AVANZADAS:');
        console.log('   • rotation: Gira la figura (en grados)');
        console.log('   • skewX/skewY: Sesga la figura (efecto inclinación)');
        console.log('   • cornerRadius: Redondea esquinas (solo rectángulos)');
        
        console.log('\n4. 🎨 FORMAS COMPLEJAS (SVG):');
        console.log('   • Flechas: SVG con markers y líneas');
        console.log('   • Líneas curvas: SVG con elementos <path>');
        console.log('   • Formas libres: SVG con paths personalizados');
        
        console.log('\n5. 💡 CÓMO FUNCIONA EL SISTEMA:');
        console.log('   • Polotno guarda TODAS las propiedades numéricas exactas');
        console.log('   • Al cargar, reconstruye las formas usando esos valores');
        console.log('   • Por eso las deformaciones se mantienen perfectamente');
        console.log('   • El editor puede modificar cualquier propiedad en tiempo real');
        
        console.log('\n6. 🎯 RESPUESTA A TU PREGUNTA:');
        console.log('   • "¿Cómo hace cuando el círculo está deformado?"');
        console.log('   • RESPUESTA: Cambia width/height pero mantiene subType="circle"');
        console.log('   • El renderizador (Konva) dibuja un óvalo usando esas dimensiones');
        console.log('   • ¡Es súper inteligente! 🧠');
        
    } catch (error) {
        console.error('❌ Error en la demostración:', error.message);
    } finally {
        await db.close();
    }
}

demonstrateShapeDeformations();