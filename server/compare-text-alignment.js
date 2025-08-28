const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const konvaRenderer = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Script para comparar cómo diferentes alineaciones afectan la posición del texto
 */

async function compareTextAlignment() {
    console.log('🎯 COMPARACIÓN: Alineación de texto en Polotno vs Konva');
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
        
        if (!textElement) {
            console.log('❌ No se encontró elemento de texto');
            return;
        }
        
        console.log('📝 ELEMENTO DE TEXTO ORIGINAL:');
        console.log(`   • Texto: "${textElement.text}"`);
        console.log(`   • Posición: (${textElement.x}, ${textElement.y})`);
        console.log(`   • Dimensiones: ${textElement.width} x ${textElement.height}`);
        console.log(`   • Alineación: ${textElement.align}`);
        console.log(`   • FontSize: ${textElement.fontSize}`);
        
        // Crear versiones con diferentes alineaciones para comparar
        const alignments = ['left', 'center', 'right'];
        
        console.log('\n🔍 PROBANDO DIFERENTES ALINEACIONES:');
        console.log('-'.repeat(50));
        
        for (const align of alignments) {
            console.log(`\n📐 ALINEACIÓN: ${align.toUpperCase()}`);
            
            // Crear una copia del contenido con la alineación modificada
            const modifiedContent = JSON.parse(JSON.stringify(content));
            const modifiedTextElement = modifiedContent.pages[0].children.find(el => el.type === 'text');
            modifiedTextElement.align = align;
            
            // Generar HTML con esta alineación
            const html = konvaRenderer.renderWithKonva(modifiedContent, `${design.name}-${align}`);
            const filename = `text-alignment-${align}-${Date.now()}.html`;
            fs.writeFileSync(path.join(__dirname, filename), html);
            
            // Extraer coordenadas del JSON de Konva
            const konvaJsonMatch = html.match(/const konvaJson = \"(.*?)\";/);
            if (konvaJsonMatch) {
                const konvaJsonString = konvaJsonMatch[1].replace(/\\\"/g, '\"');
                const konvaJson = JSON.parse(konvaJsonString);
                
                const layer = konvaJson.children[0];
                const konvaTextElement = layer.children.find(el => el.className === 'Text');
                
                if (konvaTextElement) {
                    console.log(`   • Archivo: ${filename}`);
                    console.log(`   • Posición Konva: (${konvaTextElement.attrs.x}, ${konvaTextElement.attrs.y})`);
                    console.log(`   • Align Konva: ${konvaTextElement.attrs.align}`);
                    
                    // Calcular diferencias
                    const deltaX = konvaTextElement.attrs.x - textElement.x;
                    const deltaY = konvaTextElement.attrs.y - textElement.y;
                    console.log(`   • Diferencia: (${deltaX.toFixed(1)}, ${deltaY.toFixed(1)})`);
                    
                    if (align === textElement.align) {
                        console.log(`   ✅ ALINEACIÓN ORIGINAL`);
                    }
                }
            }
        }
        
        console.log('\n\n🔍 ANÁLISIS DE SISTEMAS DE COORDENADAS:');
        console.log('-'.repeat(50));
        
        console.log('📚 TEORÍA:');
        console.log('• Polotno: Podría usar el punto superior-izquierdo del contenedor de texto');
        console.log('• Konva Text: Usa el punto de inicio del texto (baseline)');
        console.log('• La alineación afecta dónde se dibuja el texto dentro del contenedor');
        
        console.log('\n🎯 POSIBLES SOLUCIONES:');
        console.log('1. Ajustar las coordenadas según la alineación');
        console.log('2. Usar offsetX y offsetY en Konva para centrar correctamente');
        console.log('3. Calcular la posición basada en el ancho del texto y la alineación');
        
        // Crear un HTML de prueba con ajustes de posición
        console.log('\n🛠️  CREANDO VERSIÓN CON AJUSTE DE POSICIÓN:');
        console.log('-'.repeat(50));
        
        const adjustedContent = JSON.parse(JSON.stringify(content));
        const adjustedHtml = createAdjustedPositionHtml(adjustedContent, design.name);
        const adjustedFilename = `text-position-adjusted-${Date.now()}.html`;
        fs.writeFileSync(path.join(__dirname, adjustedFilename), adjustedHtml);
        
        console.log(`✅ Archivo con ajuste creado: ${adjustedFilename}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await db.close();
    }
}

/**
 * Crea HTML con ajustes de posición para texto centrado
 */
function createAdjustedPositionHtml(content, designName) {
    const firstPage = content.pages[0];
    const konvaStage = {
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
                        
                        // AJUSTE ESPECIAL PARA ALINEACIÓN
                        if (child.align === 'center') {
                            // Para texto centrado, ajustar la posición X
                            konvaChild.attrs.x = child.x + (child.width / 2);
                            konvaChild.attrs.offsetX = 0; // Konva centrará automáticamente
                            konvaChild.attrs.align = 'center';
                        } else {
                            konvaChild.attrs.align = child.align || 'left';
                        }
                        
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
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diseño ${designName} - Posición Ajustada</title>
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
            padding: 20px;
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
        <h2>Diseño ${designName} - Posición Ajustada</h2>
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

compareTextAlignment();