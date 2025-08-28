const fs = require('fs');

/**
 * Calcula la corrección vertical necesaria para alinear texto de Polotno con Konva
 * @param {number} fontSize - Tamaño de fuente en píxeles
 * @param {string} fontFamily - Familia de fuente
 * @returns {number} Corrección en píxeles para aplicar a la coordenada Y
 */
function calculateUniversalVerticalCorrection(fontSize, fontFamily = 'Arial') {
    // Métricas tipográficas estándar (basadas en OpenType)
    const fontMetrics = {
        'Arial': { ascent: 0.905, descent: 0.212 },
        'Helvetica': { ascent: 0.932, descent: 0.213 },
        'Times': { ascent: 0.898, descent: 0.218 },
        'Courier': { ascent: 0.829, descent: 0.171 },
        'default': { ascent: 0.9, descent: 0.2 }
    };
    
    const metrics = fontMetrics[fontFamily] || fontMetrics['default'];
    const totalHeight = (metrics.ascent + metrics.descent) * fontSize;
    const baselineOffset = metrics.ascent * fontSize;
    const geometricCenter = totalHeight / 2;
    
    // Corrección ajustada: mover el texto hacia abajo para alineación perfecta
    // Aplicamos una corrección negativa del 50% para bajar el texto al máximo
    const correction = -(geometricCenter - baselineOffset) * 0.55;
    return correction;
}

/**
 * Renderiza un diseño JSON usando la funcionalidad nativa de Konva
 * @param {Object} designData - El JSON del diseño de Polotno
 * @param {string} designName - Nombre del diseño
 * @returns {string} HTML completo con Konva integrado
 */
function renderWithKonva(designData, designName) {
    // Convertir el JSON de Polotno al formato que espera Konva.Node.create()
    const firstPage = designData.pages[0];
    const konvaStage = {
        attrs: {
            width: designData.width,
            height: designData.height
        },
        className: 'Stage',
        children: [{
            attrs: {},
            className: 'Layer',
            children: firstPage.children.map(child => {
                // Convertir cada elemento de Polotno a formato Konva
                const konvaChild = {
                    attrs: {
                        x: child.x || 0,
                        y: child.y || 0,
                        width: child.width || 100,
                        height: child.height || 100,
                        rotation: (child.rotation || 0) * Math.PI / 180, // Convertir a radianes
                        opacity: child.opacity !== undefined ? child.opacity : 1,
                        visible: child.visible !== undefined ? child.visible : true,
                        // Transformaciones de escala
                        scaleX: child.scaleX !== undefined ? child.scaleX : 1,
                        scaleY: child.scaleY !== undefined ? child.scaleY : 1,
                        // Transformaciones de sesgo (skew)
                        skewX: child.skewX !== undefined ? child.skewX : 0,
                        skewY: child.skewY !== undefined ? child.skewY : 0,
                        // Transformaciones de volteo (flip)
                        // En Konva, el flip se maneja con escalas negativas
                        ...(child.flipX && { scaleX: (child.scaleX !== undefined ? child.scaleX : 1) * -1 }),
                        ...(child.flipY && { scaleY: (child.scaleY !== undefined ? child.scaleY : 1) * -1 })
                    }
                };
                
                // Solo aplicar stroke si strokeWidth > 0
                if (child.strokeWidth && child.strokeWidth > 0) {
                    konvaChild.attrs.stroke = child.stroke || '#000000';
                    konvaChild.attrs.strokeWidth = child.strokeWidth;
                }
                
                // Determinar el tipo de elemento Konva basado en el tipo de Polotno
                switch (child.type) {
                    case 'text':
                        konvaChild.className = 'Text';
                        konvaChild.attrs.text = child.text || '';
                        konvaChild.attrs.fontSize = child.fontSize || 16;
                        konvaChild.attrs.fontFamily = child.fontFamily || 'Arial';
                        konvaChild.attrs.fill = child.fill || '#000000';
                        konvaChild.attrs.align = child.align || 'left';
                        
                        // APLICAR CORRECCIÓN VERTICAL AQUÍ
                        konvaChild.attrs.y = (child.y || 0) + calculateUniversalVerticalCorrection(
                            child.fontSize || 16, 
                            child.fontFamily || 'Arial'
                        );
                        
                        // Mapear fontWeight='bold' a fontStyle='bold' para Konva
                        if (child.fontWeight === 'bold') {
                            konvaChild.attrs.fontStyle = 'bold';
                        }
                        
                        // POSICIONAMIENTO CORRECTO: Usar coordenadas originales de Polotno
                        // Konva maneja automáticamente el centrado cuando align="center"
                        // NO se debe modificar la posición X para texto centrado
                        break;
                        
                    case 'image':
                        konvaChild.className = 'Image';
                        // Nota: Las imágenes necesitan ser cargadas por separado
                        if (child.src) {
                            konvaChild.attrs.src = child.src;
                        }
                        break;
                        
                    case 'figure':
                        // Determinar el tipo de figura basado en subType
                        switch (child.subType) {
                            case 'circle':
                                konvaChild.className = 'Ellipse';
                                // Para círculos/óvalos, usar radiusX y radiusY
                                konvaChild.attrs.radiusX = (child.width || 100) / 2;
                                konvaChild.attrs.radiusY = (child.height || 100) / 2;
                                // Ajustar posición al centro
                                konvaChild.attrs.x = (child.x || 0) + (child.width || 100) / 2;
                                konvaChild.attrs.y = (child.y || 0) + (child.height || 100) / 2;
                                delete konvaChild.attrs.width;
                                delete konvaChild.attrs.height;
                                break;
                            case 'star':
                                konvaChild.className = 'Star';
                                konvaChild.attrs.numPoints = child.numPoints || 5;
                                konvaChild.attrs.innerRadius = ((child.width || 100) / 2) * (child.innerRadius || 0.5);
                                konvaChild.attrs.outerRadius = (child.width || 100) / 2;
                                // Ajustar posición al centro
                                konvaChild.attrs.x = (child.x || 0) + (child.width || 100) / 2;
                                konvaChild.attrs.y = (child.y || 0) + (child.height || 100) / 2;
                                delete konvaChild.attrs.width;
                                delete konvaChild.attrs.height;
                                break;
                            case 'rect':
                                konvaChild.className = 'Rect';
                                if (child.cornerRadius && child.cornerRadius > 0) {
                                    konvaChild.attrs.cornerRadius = child.cornerRadius;
                                }
                                break;
                            default:
                                // Para subtipos como 'blob14' y otras formas abstractas
                                if (child.subType && child.subType.startsWith('blob')) {
                                    konvaChild.className = 'Rect';
                                    // Crear una forma más orgánica usando cornerRadius asimétrico
                                    const width = child.width || 100;
                                    const height = child.height || 100;
                                    const minDimension = Math.min(width, height);
                                    // Usar un radio más pequeño para que se vea menos como cuadrado redondeado
                                    konvaChild.attrs.cornerRadius = minDimension * 0.15; // 15% del lado menor
                                    
                                    // Agregar una ligera deformación para hacerlo más orgánico
                                    konvaChild.attrs.scaleX = 0.95 + Math.random() * 0.1; // 0.95 - 1.05
                                    konvaChild.attrs.scaleY = 0.95 + Math.random() * 0.1; // 0.95 - 1.05
                                } else {
                                    // Fallback para cualquier otro subtipo
                                    konvaChild.className = 'Rect';
                                    if (child.cornerRadius && child.cornerRadius > 0) {
                                        konvaChild.attrs.cornerRadius = child.cornerRadius;
                                    }
                                }
                                break;
                        }
                        // Procesar color fill y extraer opacidad si es RGBA
                        if (child.fill) {
                            // Buscar tanto valores enteros como decimales en RGBA
                            const rgbaMatch = child.fill.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                            if (rgbaMatch) {
                                // Extraer valores RGBA
                                const r = parseInt(rgbaMatch[1]);
                                const g = parseInt(rgbaMatch[2]);
                                const b = parseInt(rgbaMatch[3]);
                                const alpha = parseFloat(rgbaMatch[4]);
                                
                                // Convertir a RGB sin alpha
                                konvaChild.attrs.fill = `rgb(${r}, ${g}, ${b})`;
                                
                                // Detectar si alpha está en escala 0-1 o 0-255
                                if (alpha <= 1) {
                                    // Ya está en escala 0-1, usar directamente
                                    konvaChild.attrs.opacity = alpha;
                                } else {
                                    // Está en escala 0-255, convertir a 0-1
                                    konvaChild.attrs.opacity = alpha / 255;
                                }
                            } else {
                                konvaChild.attrs.fill = child.fill;
                            }
                        } else {
                            konvaChild.attrs.fill = '#cccccc';
                        }
                        // No aplicar stroke aquí ya que se maneja arriba
                        break;
                        
                    case 'svg':
                        // Para elementos SVG, usar un grupo con el contenido SVG
                        konvaChild.className = 'Group';
                        // Nota: En una implementación real, necesitarías parsear el SVG
                        // Por ahora, creamos un rectángulo como placeholder
                        konvaChild.children = [{
                            className: 'Rect',
                            attrs: {
                                x: 0,
                                y: 0,
                                width: child.width || 100,
                                height: child.height || 100,
                                fill: child.fill || '#cccccc',
                                stroke: child.stroke || '#000000',
                                strokeWidth: child.strokeWidth || 1
                            }
                        }];
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
    <title>Diseño ${designName} - Konva</title>
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
        <h2>Diseño ${designName} - Konva Native</h2>
        <p>Dimensiones: ${designData.width}x${designData.height}px</p>
    </div>
    
    <div id="canvas-container"></div>
    
    <script>
        // JSON del diseño en formato Konva
        const konvaJson = ${JSON.stringify(JSON.stringify(konvaStage))};
        
        console.log('Creando stage con JSON:', konvaJson);
        
        try {
            // Crear el stage usando Konva.Node.create()
            const stage = Konva.Node.create(konvaJson, 'canvas-container');
            console.log('Stage creado exitosamente:', stage);
            
            // Manejar la carga de imágenes si es necesario
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
    
    return html;
}

/**
 * Genera un archivo HTML usando Konva nativo para un diseño específico
 * @param {number} designId - ID del diseño en la base de datos
 * @param {string} outputPath - Ruta donde guardar el archivo HTML
 */
async function generateKonvaHtml(designId, outputPath) {
  const { db, initialize } = require('../config/database');
  
  try {
    await initialize();
    const database = db();
    
    const design = await database.get('SELECT * FROM designs WHERE id = ?', [designId]);
    
    if (!design) {
      throw new Error(`Diseño con ID ${designId} no encontrado`);
    }
    
    const jsonData = JSON.parse(design.content);
    const html = renderWithKonva(jsonData, `design-${designId}-container`);
    
    fs.writeFileSync(outputPath, html);
    
    return {
      success: true,
      designName: design.name,
      outputPath,
      fileSize: html.length
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  renderWithKonva,
  generateKonvaHtml
};