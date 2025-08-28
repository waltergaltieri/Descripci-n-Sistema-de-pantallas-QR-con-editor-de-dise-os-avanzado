const { db, initialize } = require('./config/database');

async function analyzeCornerSquares() {
    try {
        console.log('🔍 ANALIZANDO CUADRADOS DE ESQUINAS EN DISEÑO 64...');
        console.log('=' .repeat(60));
        
        await initialize();
        const database = db();
        
        // Obtener el diseño 64
        const design = await database.get('SELECT * FROM designs WHERE id = ?', [64]);
        
        if (!design) {
            throw new Error('Diseño 64 no encontrado');
        }
        
        const content = JSON.parse(design.content);
        const firstPage = content.pages[0];
        
        console.log(`📋 Diseño: "${design.name}"`);
        console.log(`📐 Dimensiones del lienzo: ${content.width}x${content.height}px`);
        console.log(`🎯 Total de elementos: ${firstPage.children.length}`);
        
        console.log('\n🎨 TODOS LOS ELEMENTOS:');
        console.log('-'.repeat(60));
        
        firstPage.children.forEach((child, index) => {
            console.log(`${index + 1}. 📦 Tipo: ${child.type}`);
            console.log(`   • Posición: X=${child.x?.toFixed(2) || 'N/A'}, Y=${child.y?.toFixed(2) || 'N/A'}`);
            console.log(`   • Tamaño: ${child.width?.toFixed(2) || 'N/A'}x${child.height?.toFixed(2) || 'N/A'}`);
            console.log(`   • Color fill: ${child.fill || 'N/A'}`);
            console.log(`   • Color stroke: ${child.stroke || 'N/A'}`);
            
            if (child.type === 'text') {
                console.log(`   • Texto: "${child.text}"`);
                console.log(`   • Fuente: ${child.fontFamily}, ${child.fontSize}px`);
                console.log(`   • Alineación: ${child.align}`);
            }
            
            if (child.type === 'figure') {
                console.log(`   • Subtipo: ${child.name || 'N/A'}`);
                if (child.radius) console.log(`   • Radio: ${child.radius}`);
                if (child.cornerRadius) console.log(`   • Corner radius: ${child.cornerRadius}`);
            }
            
            console.log('');
        });
        
        // Identificar cuadrados de esquinas por posición y color
        console.log('🎯 IDENTIFICANDO CUADRADOS DE ESQUINAS:');
        console.log('-'.repeat(60));
        
        const canvasWidth = content.width;
        const canvasHeight = content.height;
        
        // Buscar elementos que podrían ser cuadrados de esquinas
        const cornerElements = firstPage.children.filter(child => {
            const x = child.x || 0;
            const y = child.y || 0;
            const width = child.width || 0;
            const height = child.height || 0;
            
            // Verificar si está cerca de alguna esquina
            const nearTopLeft = x < canvasWidth * 0.2 && y < canvasHeight * 0.2;
            const nearTopRight = x > canvasWidth * 0.8 && y < canvasHeight * 0.2;
            const nearBottomLeft = x < canvasWidth * 0.2 && y > canvasHeight * 0.8;
            const nearBottomRight = x > canvasWidth * 0.8 && y > canvasHeight * 0.8;
            
            return nearTopLeft || nearTopRight || nearBottomLeft || nearBottomRight;
        });
        
        if (cornerElements.length > 0) {
            console.log(`✅ Encontrados ${cornerElements.length} elementos cerca de las esquinas:`);
            
            cornerElements.forEach((element, index) => {
                const x = element.x || 0;
                const y = element.y || 0;
                
                // Determinar qué esquina
                let corner = '';
                if (x < canvasWidth * 0.2 && y < canvasHeight * 0.2) corner = 'Superior Izquierda';
                else if (x > canvasWidth * 0.8 && y < canvasHeight * 0.2) corner = 'Superior Derecha';
                else if (x < canvasWidth * 0.2 && y > canvasHeight * 0.8) corner = 'Inferior Izquierda';
                else if (x > canvasWidth * 0.8 && y > canvasHeight * 0.8) corner = 'Inferior Derecha';
                
                console.log(`\n   ${index + 1}. 📍 Esquina: ${corner}`);
                console.log(`      • Tipo: ${element.type}`);
                console.log(`      • Posición: X=${x.toFixed(2)}, Y=${y.toFixed(2)}`);
                console.log(`      • Tamaño: ${(element.width || 0).toFixed(2)}x${(element.height || 0).toFixed(2)}`);
                console.log(`      • Color: ${element.fill || 'N/A'}`);
                
                // Calcular distancia desde la esquina exacta
                let cornerX = 0, cornerY = 0;
                if (corner.includes('Derecha')) cornerX = canvasWidth;
                if (corner.includes('Inferior')) cornerY = canvasHeight;
                
                const distanceX = Math.abs(x - cornerX);
                const distanceY = Math.abs(y - cornerY);
                
                console.log(`      • Distancia de esquina: X=${distanceX.toFixed(2)}px, Y=${distanceY.toFixed(2)}px`);
            });
        } else {
            console.log('❌ No se encontraron elementos cerca de las esquinas');
        }
        
        // Crear mapa de coordenadas de referencia
        console.log('\n📊 MAPA DE COORDENADAS DE REFERENCIA:');
        console.log('-'.repeat(60));
        console.log(`🎯 Lienzo: ${canvasWidth}x${canvasHeight}px`);
        console.log(`📍 Esquinas teóricas:`);
        console.log(`   • Superior Izquierda: (0, 0)`);
        console.log(`   • Superior Derecha: (${canvasWidth}, 0)`);
        console.log(`   • Inferior Izquierda: (0, ${canvasHeight})`);
        console.log(`   • Inferior Derecha: (${canvasWidth}, ${canvasHeight})`);
        
        // Analizar el texto "1" como referencia central
        const textElement = firstPage.children.find(child => 
            child.type === 'text' && child.text === '1'
        );
        
        if (textElement) {
            console.log('\n📝 ELEMENTO DE TEXTO "1" (REFERENCIA CENTRAL):');
            console.log('-'.repeat(60));
            console.log(`   • Posición actual: X=${textElement.x.toFixed(2)}, Y=${textElement.y.toFixed(2)}`);
            console.log(`   • Tamaño: ${textElement.width.toFixed(2)}x${textElement.height.toFixed(2)}`);
            console.log(`   • Centro calculado: X=${(textElement.x + textElement.width/2).toFixed(2)}, Y=${(textElement.y + textElement.height/2).toFixed(2)}`);
            console.log(`   • Centro del lienzo: X=${(canvasWidth/2).toFixed(2)}, Y=${(canvasHeight/2).toFixed(2)}`);
            
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const textCenterX = textElement.x + textElement.width / 2;
            const textCenterY = textElement.y + textElement.height / 2;
            
            const offsetX = textCenterX - centerX;
            const offsetY = textCenterY - centerY;
            
            console.log(`   • Desplazamiento del centro: X=${offsetX.toFixed(2)}px, Y=${offsetY.toFixed(2)}px`);
        }
        
        console.log('\n🎉 ANÁLISIS COMPLETADO');
        console.log('=' .repeat(60));
        
        return {
            success: true,
            canvasWidth,
            canvasHeight,
            cornerElements,
            textElement
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
    analyzeCornerSquares();
}

module.exports = { analyzeCornerSquares };