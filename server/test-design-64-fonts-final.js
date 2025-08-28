const { db, initialize } = require('./config/database');
const { renderWithKonva } = require('./utils/konvaRenderer');
const fs = require('fs');
const path = require('path');

async function testDesign64Fonts() {
    try {
        await initialize();
        const database = db();
        
        console.log('🎯 PROBANDO DISEÑO 64 CON FUENTES MEJORADAS');
        console.log('=' .repeat(60));
        
        // Obtener el diseño 64
        const design = await database.get('SELECT * FROM designs WHERE id = ?', [64]);
        
        if (!design) {
            console.log('❌ Diseño 64 no encontrado');
            return;
        }
        
        console.log(`✅ Diseño encontrado: ${design.name}`);
        
        // Parsear el contenido JSON
        const designData = JSON.parse(design.content);
        
        // Generar HTML con Konva
        console.log('\n🔧 Generando HTML con renderizador Konva...');
        const html = await renderWithKonva(designData, design.name);
        
        // Guardar el archivo HTML
        const outputPath = path.join(__dirname, 'output', `design-64-fonts-test.html`);
        
        // Crear directorio output si no existe
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        fs.writeFileSync(outputPath, html);
        
        console.log(`\n✅ HTML generado exitosamente: ${outputPath}`);
        console.log(`📏 Tamaño del archivo: ${(html.length / 1024).toFixed(2)} KB`);
        
        // Analizar las fuentes incluidas en el HTML
        console.log('\n🔍 ANÁLISIS DE FUENTES EN EL HTML GENERADO:');
        console.log('-'.repeat(50));
        
        // Buscar Google Fonts
        const googleFontsMatch = html.match(/fonts\.googleapis\.com\/css2\?family=([^"]+)/g);
        if (googleFontsMatch) {
            console.log('📡 Google Fonts incluidas:');
            googleFontsMatch.forEach(match => {
                const fonts = match.replace('fonts.googleapis.com/css2?family=', '').split('&family=');
                fonts.forEach(font => {
                    console.log(`   • ${decodeURIComponent(font)}`);
                });
            });
        } else {
            console.log('❌ No se encontraron Google Fonts');
        }
        
        // Buscar fuentes personalizadas
        const customFontMatches = html.match(/@font-face[^}]+}/g);
        if (customFontMatches) {
            console.log('\n🎨 Fuentes personalizadas incluidas:');
            customFontMatches.forEach(fontFace => {
                const familyMatch = fontFace.match(/font-family:\s*['"]([^'"]+)['"]/);
                if (familyMatch) {
                    console.log(`   • ${familyMatch[1]}`);
                }
            });
        } else {
            console.log('\n❌ No se encontraron fuentes personalizadas');
        }
        
        // Buscar clases de fallback
        const fallbackClasses = html.match(/\.font-[a-z-]+\s*{[^}]+}/g);
        if (fallbackClasses) {
            console.log('\n🔄 Clases de fallback incluidas:');
            fallbackClasses.forEach(cls => {
                const classMatch = cls.match(/\.font-([a-z-]+)/);
                if (classMatch) {
                    console.log(`   • .font-${classMatch[1]}`);
                }
            });
        }
        
        // Verificar elementos de texto específicos
        console.log('\n📝 VERIFICANDO ELEMENTOS DE TEXTO:');
        console.log('-'.repeat(50));
        
        designData.pages.forEach((page, pageIndex) => {
            page.children.forEach((child, childIndex) => {
                if (child.type === 'text') {
                    console.log(`${pageIndex + 1}.${childIndex + 1}. "${child.text}" - Fuente: ${child.fontFamily}`);
                    
                    // Verificar si la fuente está en Google Fonts o es personalizada
                    const isGoogleFont = ['Roboto', 'Anton', 'Montserrat Subrayada', 'Ewert'].includes(child.fontFamily);
                    const isCustomFont = ['Super Sunkissed'].includes(child.fontFamily);
                    
                    if (isGoogleFont) {
                        console.log(`     ✅ Google Font - debería renderizarse correctamente`);
                    } else if (isCustomFont) {
                        console.log(`     🎨 Fuente personalizada - usando fallback mejorado`);
                    } else {
                        console.log(`     ⚠️ Fuente desconocida - verificar mapeo`);
                    }
                }
            });
        });
        
        console.log('\n🎉 PRUEBA COMPLETADA');
        console.log(`📂 Archivo HTML disponible en: ${outputPath}`);
        console.log('💡 Abre el archivo en un navegador para verificar el renderizado');
        
    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    }
}

// Ejecutar la prueba
testDesign64Fonts();