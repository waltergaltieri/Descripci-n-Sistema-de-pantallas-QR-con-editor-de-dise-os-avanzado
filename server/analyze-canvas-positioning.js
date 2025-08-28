const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para analizar el problema de posicionamiento del canvas y proponer soluciones
 */

async function analyzeCanvasPositioning() {
    console.log('🎯 ANÁLISIS: Posicionamiento del Canvas y Coordenadas');
    console.log('=' .repeat(70));
    
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
    
    try {
        const design = await db.get(`
            SELECT id, name, content 
            FROM designs 
            WHERE id = 64
        `);
        
        if (!design) {
            console.log('❌ Diseño ID 64 no encontrado');
            return;
        }
        
        const content = JSON.parse(design.content);
        const textElement = content.pages[0].children.find(el => el.type === 'text');
        
        console.log('📐 DIMENSIONES DEL DISEÑO:');
        console.log(`   • Canvas: ${content.width} x ${content.height}px`);
        console.log(`   • Texto posición original: (${textElement.x}, ${textElement.y})`);
        console.log(`   • Texto dimensiones: ${textElement.width} x ${textElement.height}px`);
        
        console.log('\n🔍 PROBLEMA IDENTIFICADO:');
        console.log('-'.repeat(50));
        console.log('📦 ESTRUCTURA HTML ACTUAL:');
        console.log('   body { padding: 20px; }');
        console.log('   #design-container { padding: 20px; margin: 0 auto; }');
        console.log('   └── Konva Stage (1080x1920)');
        console.log('');
        console.log('❌ PROBLEMAS:');
        console.log('   1. El canvas está desplazado por el padding del body (20px)');
        console.log('   2. El canvas está desplazado por el padding del contenedor (20px)');
        console.log('   3. Las coordenadas de Konva son absolutas dentro del stage');
        console.log('   4. Pero el stage está posicionado con desplazamientos CSS');
        
        console.log('\n💡 SOLUCIONES PROPUESTAS:');
        console.log('-'.repeat(50));
        console.log('🎯 OPCIÓN 1: Eliminar padding del contenedor');
        console.log('   • Mantener solo el padding del body para espaciado visual');
        console.log('   • El canvas se posiciona exactamente donde debe estar');
        
        console.log('\n🎯 OPCIÓN 2: Coordenadas relativas al contenedor');
        console.log('   • Ajustar todas las coordenadas restando el offset del contenedor');
        console.log('   • Más complejo pero mantiene el diseño visual');
        
        console.log('\n🎯 OPCIÓN 3: Canvas sin contenedor (recomendada)');
        console.log('   • Crear el stage directamente en el body');
        console.log('   • Centrar el canvas usando CSS transform');
        console.log('   • Coordenadas exactas sin desplazamientos');
        
        // Crear versión con la Opción 1 (sin padding en contenedor)
        console.log('\n🛠️  IMPLEMENTANDO OPCIÓN 1:');
        console.log('-'.repeat(50));
        
        const htmlOption1 = createHtmlWithoutContainerPadding(content, design.name);
        const filenameOption1 = `canvas-positioning-option1-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filenameOption1), htmlOption1);
        console.log(`✅ Opción 1 creada: ${filenameOption1}`);
        
        // Crear versión con la Opción 3 (canvas directo en body)
        console.log('\n🛠️  IMPLEMENTANDO OPCIÓN 3:');
        console.log('-'.repeat(50));
        
        const htmlOption3 = createHtmlWithDirectCanvas(content, design.name);
        const filenameOption3 = `canvas-positioning-option3-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, filenameOption3), htmlOption3);
        console.log(`✅ Opción 3 creada: ${filenameOption3}`);
        
        console.log('\n📊 COMPARACIÓN DE RESULTADOS:');
        console.log('=' .repeat(70));
        console.log('📄 Archivos generados para comparar:');
        console.log(`   1. ${filenameOption1} - Sin padding en contenedor`);
        console.log(`   2. ${filenameOption3} - Canvas directo centrado`);
        console.log('');
        console.log('🔍 Instrucciones de prueba:');
        console.log('   • Abre ambos archivos en el navegador');
        console.log('   • Compara la posición del texto "1"');
        console.log('   • Verifica cuál se ve más similar al diseño original');
        
        console.log('\n🎯 RECOMENDACIÓN:');
        console.log('-'.repeat(50));
        console.log('✅ La Opción 3 (canvas directo) es la más precisa porque:');
        console.log('   • Elimina todos los desplazamientos CSS');
        console.log('   • Las coordenadas de Konva son exactas');
        console.log('   • El centrado se hace solo visualmente con CSS');
        console.log('   • Mantiene la compatibilidad con las pantallas');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.close();
    }
}

/**
 * Crear HTML sin padding en el contenedor (Opción 1)
 */
function createHtmlWithoutContainerPadding(content, designName) {
    const firstPage = content.pages[0];
    const konvaStage = createKonvaStage(content, firstPage);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diseño ${designName} - Opción 1</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/konva@9/konva.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
        }
        #design-container {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 0; /* SIN PADDING */
            margin: 0 auto;
            width: fit-content;
        }
        .info {
            text-align: center;
            margin-bottom: 20px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="info">
        <h2>Opción 1: Sin padding en contenedor</h2>
        <p>Dimensiones: ${content.width}x${content.height}px</p>
    </div>
    
    <div id="design-container"></div>
    
    <script>
        const konvaJson = ${JSON.stringify(JSON.stringify(konvaStage))};
        
        try {
            const stage = Konva.Node.create(konvaJson, 'design-container');
            
            const images = stage.find('Image');
            images.forEach(imageNode => {
                const src = imageNode.getAttr('src');
                if (src) {
                    const img = new Image();
                    img.onload = () => {
                        imageNode.image(img);
                        stage.batchDraw();
                    };
                    img.src = src;
                }
            });
            
        } catch (error) {
            console.error('Error al crear el stage:', error);
            document.getElementById('design-container').innerHTML = 
                '<p style="color: red;">Error: ' + error.message + '</p>';
        }
    </script>
</body>
</html>`;
}

/**
 * Crear HTML con canvas directo en body (Opción 3)
 */
function createHtmlWithDirectCanvas(content, designName) {
    const firstPage = content.pages[0];
    const konvaStage = createKonvaStage(content, firstPage);
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diseño ${designName} - Opción 3</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
    <script src="https://unpkg.com/konva@9/konva.min.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-height: 100vh;
        }
        .info {
            text-align: center;
            margin: 20px 0;
            color: #666;
            background: white;
            padding: 10px 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        #canvas-container {
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="info">
        <h2>Opción 3: Canvas directo centrado</h2>
        <p>Dimensiones: ${content.width}x${content.height}px</p>
    </div>
    
    <div id="canvas-container"></div>
    
    <script>
        const konvaJson = ${JSON.stringify(JSON.stringify(konvaStage))};
        
        try {
            const stage = Konva.Node.create(konvaJson, 'canvas-container');
            
            const images = stage.find('Image');
            images.forEach(imageNode => {
                const src = imageNode.getAttr('src');
                if (src) {
                    const img = new Image();
                    img.onload = () => {
                        imageNode.image(img);
                        stage.batchDraw();
                    };
                    img.src = src;
                }
            });
            
        } catch (error) {
            console.error('Error al crear el stage:', error);
            document.getElementById('canvas-container').innerHTML = 
                '<p style="color: red;">Error: ' + error.message + '</p>';
        }
    </script>
</body>
</html>`;
}

/**
 * Crear el stage de Konva con las coordenadas originales (sin ajustes)
 */
function createKonvaStage(content, firstPage) {
    return {
        attrs: {
            width: content.width,
            height: content.height
        },
        className: 'Stage',
        children: [{
            attrs: {},
            className: 'Layer',
            children: firstPage.children.map(child => {
                const konvaChild = {
                    attrs: {
                        x: child.x || 0,
                        y: child.y || 0,
                        width: child.width || 100,
                        height: child.height || 100,
                        rotation: (child.rotation || 0) * Math.PI / 180,
                        opacity: child.opacity !== undefined ? child.opacity : 1,
                        visible: child.visible !== undefined ? child.visible : true,
                        scaleX: child.scaleX !== undefined ? child.scaleX : 1,
                        scaleY: child.scaleY !== undefined ? child.scaleY : 1,
                        skewX: child.skewX !== undefined ? child.skewX : 0,
                        skewY: child.skewY !== undefined ? child.skewY : 0
                    }
                };
                
                // Manejar colores RGBA
                if (child.fill && child.fill.startsWith('rgba(')) {
                    const rgbaMatch = child.fill.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                    if (rgbaMatch) {
                        const [, r, g, b, alpha] = rgbaMatch;
                        konvaChild.attrs.fill = `rgb(${r}, ${g}, ${b})`;
                        const alphaValue = parseFloat(alpha);
                        konvaChild.attrs.opacity = alphaValue > 1 ? alphaValue / 255 : alphaValue;
                    }
                } else if (child.fill) {
                    konvaChild.attrs.fill = child.fill;
                }
                
                switch (child.type) {
                    case 'text':
                        konvaChild.className = 'Text';
                        konvaChild.attrs.text = child.text || '';
                        konvaChild.attrs.fontSize = child.fontSize || 16;
                        konvaChild.attrs.fontFamily = child.fontFamily || 'Arial';
                        konvaChild.attrs.fill = child.fill || '#000000';
                        
                        // USAR COORDENADAS ORIGINALES SIN AJUSTES
                        konvaChild.attrs.align = child.align || 'left';
                        
                        if (child.fontWeight === 'bold') {
                            konvaChild.attrs.fontStyle = 'bold';
                        }
                        break;
                        
                    case 'image':
                        konvaChild.className = 'Image';
                        if (child.src) {
                            konvaChild.attrs.src = child.src;
                        }
                        break;
                        
                    case 'figure':
                        switch (child.subType) {
                            case 'circle':
                                konvaChild.className = 'Ellipse';
                                konvaChild.attrs.radiusX = (child.width || 100) / 2;
                                konvaChild.attrs.radiusY = (child.height || 100) / 2;
                                konvaChild.attrs.x = (child.x || 0) + (child.width || 100) / 2;
                                konvaChild.attrs.y = (child.y || 0) + (child.height || 100) / 2;
                                delete konvaChild.attrs.width;
                                delete konvaChild.attrs.height;
                                break;
                            default:
                                konvaChild.className = 'Rect';
                                if (child.subType && child.subType.startsWith('blob')) {
                                    const width = child.width || 100;
                                    const height = child.height || 100;
                                    const minDimension = Math.min(width, height);
                                    konvaChild.attrs.cornerRadius = minDimension * 0.15;
                                    konvaChild.attrs.scaleX = 0.95 + Math.random() * 0.1;
                                    konvaChild.attrs.scaleY = 0.95 + Math.random() * 0.1;
                                } else {
                                    konvaChild.attrs.cornerRadius = 10;
                                }
                                break;
                        }
                        break;
                        
                    default:
                        konvaChild.className = 'Rect';
                        konvaChild.attrs.fill = '#cccccc';
                }
                
                return konvaChild;
            })
        }]
    };
}

analyzeCanvasPositioning();