const { renderWithKonva } = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');

/**
 * Script de prueba para verificar el funcionamiento de fuentes personalizadas
 * Este script crea un diseño de prueba con diferentes tipos de fuentes:
 * - Google Fonts (Montserrat, Anton)
 * - Fuentes del sistema (Arial, Times New Roman)
 * - Fuentes personalizadas (si están disponibles)
 */

async function testCustomFonts() {
    console.log('🧪 Iniciando prueba de fuentes personalizadas...');
    
    // Diseño de prueba con diferentes tipos de fuentes
    const testDesign = {
        width: 800,
        height: 600,
        pages: [{
            children: [
                {
                    type: 'text',
                    x: 50,
                    y: 50,
                    width: 300,
                    height: 50,
                    text: 'Google Font: Montserrat',
                    fontFamily: 'Montserrat',
                    fontSize: 24,
                    fill: '#333333'
                },
                {
                    type: 'text',
                    x: 50,
                    y: 120,
                    width: 300,
                    height: 50,
                    text: 'Google Font: Anton',
                    fontFamily: 'Anton',
                    fontSize: 24,
                    fill: '#666666'
                },
                {
                    type: 'text',
                    x: 50,
                    y: 190,
                    width: 300,
                    height: 50,
                    text: 'Sistema: Arial',
                    fontFamily: 'Arial',
                    fontSize: 24,
                    fill: '#999999'
                },
                {
                    type: 'text',
                    x: 50,
                    y: 260,
                    width: 300,
                    height: 50,
                    text: 'Sistema: Times New Roman',
                    fontFamily: 'Times New Roman',
                    fontSize: 24,
                    fill: '#CCCCCC'
                },
                {
                    type: 'text',
                    x: 50,
                    y: 330,
                    width: 400,
                    height: 50,
                    text: 'Fuente Personalizada (si disponible)',
                    fontFamily: 'CustomFont-Bold',
                    fontSize: 24,
                    fill: '#FF6B6B'
                },
                {
                    type: 'rect',
                    x: 500,
                    y: 50,
                    width: 200,
                    height: 300,
                    fill: '#E8F4FD',
                    stroke: '#2196F3',
                    strokeWidth: 2
                }
            ]
        }]
    };
    
    try {
        console.log('📝 Generando HTML con fuentes mixtas...');
        
        // Generar el HTML con el sistema de fuentes mejorado
        const html = await renderWithKonva(testDesign, 'Prueba-Fuentes-Personalizadas');
        
        // Guardar el archivo de prueba
        const outputPath = path.join(__dirname, 'test-output', 'custom-fonts-test.html');
        
        // Crear directorio si no existe
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, html);
        
        console.log('✅ Archivo de prueba generado exitosamente:');
        console.log(`   📁 Ruta: ${outputPath}`);
        console.log(`   📊 Tamaño: ${(html.length / 1024).toFixed(2)} KB`);
        
        // Analizar el contenido generado
        console.log('\n🔍 Análisis del HTML generado:');
        
        // Verificar Google Fonts
        const googleFontsMatch = html.match(/<link[^>]*fonts\.googleapis\.com[^>]*>/g);
        if (googleFontsMatch) {
            console.log(`   🌐 Google Fonts detectadas: ${googleFontsMatch.length} enlaces`);
            googleFontsMatch.forEach((link, index) => {
                const fontMatch = link.match(/family=([^&"']+)/);
                if (fontMatch) {
                    console.log(`      ${index + 1}. ${decodeURIComponent(fontMatch[1])}`);
                }
            });
        } else {
            console.log('   ⚠️  No se encontraron enlaces de Google Fonts');
        }
        
        // Verificar fuentes personalizadas
        const customFontMatch = html.match(/@font-face\s*{[^}]+}/g);
        if (customFontMatch) {
            console.log(`   🎨 Fuentes personalizadas detectadas: ${customFontMatch.length} reglas @font-face`);
            customFontMatch.forEach((rule, index) => {
                const familyMatch = rule.match(/font-family:\s*['"]([^'"]+)['"]/);
                if (familyMatch) {
                    console.log(`      ${index + 1}. ${familyMatch[1]}`);
                }
            });
        } else {
            console.log('   ℹ️  No se encontraron fuentes personalizadas (normal si no hay archivos subidos)');
        }
        
        console.log('\n🎯 Prueba completada. Abre el archivo HTML en un navegador para verificar la renderización.');
        
        return {
            success: true,
            outputPath,
            fileSize: html.length,
            googleFonts: googleFontsMatch ? googleFontsMatch.length : 0,
            customFonts: customFontMatch ? customFontMatch.length : 0
        };
        
    } catch (error) {
        console.error('❌ Error durante la prueba:', error.message);
        console.error('   Stack:', error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Ejecutar la prueba si el script se ejecuta directamente
if (require.main === module) {
    testCustomFonts()
        .then(result => {
            if (result.success) {
                console.log('\n🎉 ¡Prueba exitosa!');
                process.exit(0);
            } else {
                console.log('\n💥 Prueba falló');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Error inesperado:', error);
            process.exit(1);
        });
}

module.exports = { testCustomFonts };