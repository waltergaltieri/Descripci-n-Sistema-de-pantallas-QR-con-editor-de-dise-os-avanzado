const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
require('dotenv').config();

async function traceDimensionFlow() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    try {
        console.log('🔍 RASTREANDO EL FLUJO DE DIMENSIONES - DISEÑO ID 62');
        console.log('=' .repeat(70));
        
        // 1. Obtener el diseño completo
        const design = await db.get('SELECT * FROM designs WHERE id = 62');
        
        if (!design) {
            console.log('❌ No se encontró el diseño ID 62');
            return;
        }
        
        console.log('📋 INFORMACIÓN BÁSICA DEL DISEÑO:');
        console.log(`   • ID: ${design.id}`);
        console.log(`   • Nombre: ${design.name}`);
        console.log(`   • Descripción: ${design.description}`);
        console.log(`   • Creado: ${design.created_at}`);
        console.log(`   • Actualizado: ${design.updated_at}`);
        console.log('');
        
        // 2. Analizar el campo 'content' (JSON de Polotno)
        console.log('📄 ANÁLISIS DEL CAMPO "content" (JSON de Polotno):');
        if (design.content) {
            try {
                const content = JSON.parse(design.content);
                console.log(`   • Tipo: ${typeof content}`);
                console.log(`   • Claves principales: ${Object.keys(content).join(', ')}`);
                
                // Dimensiones principales
                if (content.width && content.height) {
                    console.log(`   • Dimensiones del canvas: ${content.width} x ${content.height}`);
                }
                
                // Buscar en settings si existe
                if (content.settings) {
                    console.log(`   • Settings encontrados:`);
                    Object.keys(content.settings).forEach(key => {
                        if (key.toLowerCase().includes('width') || key.toLowerCase().includes('height')) {
                            console.log(`     - ${key}: ${content.settings[key]}`);
                        }
                    });
                }
                
                // Buscar en páginas
                if (content.pages && content.pages.length > 0) {
                    console.log(`   • Páginas: ${content.pages.length}`);
                    content.pages.forEach((page, index) => {
                        if (page.width && page.height) {
                            console.log(`     - Página ${index + 1}: ${page.width} x ${page.height}`);
                        }
                    });
                }
                
            } catch (error) {
                console.log(`   ❌ Error al parsear content: ${error.message}`);
            }
        } else {
            console.log('   ❌ Campo content está vacío');
        }
        console.log('');
        
        // 3. Analizar el campo 'enhanced_content'
        console.log('🔬 ANÁLISIS DEL CAMPO "enhanced_content":');
        if (design.enhanced_content) {
            try {
                const enhancedContent = JSON.parse(design.enhanced_content);
                console.log(`   • Tipo: ${typeof enhancedContent}`);
                console.log(`   • Claves principales: ${Object.keys(enhancedContent).join(', ')}`);
                
                // Mostrar estructura completa del enhanced_content
                console.log('   • Estructura completa:');
                console.log(JSON.stringify(enhancedContent, null, 4).split('\n').map(line => `     ${line}`).join('\n'));
                
            } catch (error) {
                console.log(`   ❌ Error al parsear enhanced_content: ${error.message}`);
            }
        } else {
            console.log('   ❌ Campo enhanced_content está vacío');
        }
        console.log('');
        
        // 4. Analizar el campo 'html_content'
        console.log('🌐 ANÁLISIS DEL CAMPO "html_content":');
        if (design.html_content) {
            // Buscar dimensiones en el HTML
            const htmlContent = design.html_content;
            const widthMatch = htmlContent.match(/width["']?\s*:\s*["']?(\d+)/i);
            const heightMatch = htmlContent.match(/height["']?\s*:\s*["']?(\d+)/i);
            
            console.log(`   • Longitud del HTML: ${htmlContent.length} caracteres`);
            if (widthMatch) {
                console.log(`   • Width encontrado en HTML: ${widthMatch[1]}`);
            }
            if (heightMatch) {
                console.log(`   • Height encontrado en HTML: ${heightMatch[1]}`);
            }
            
            // Buscar referencias a 1920 y 1080
            const has1920 = htmlContent.includes('1920');
            const has1080 = htmlContent.includes('1080');
            console.log(`   • Contiene '1920': ${has1920}`);
            console.log(`   • Contiene '1080': ${has1080}`);
            
        } else {
            console.log('   ❌ Campo html_content está vacío');
        }
        console.log('');
        
        // 5. Conclusiones
        console.log('🎯 CONCLUSIONES:');
        console.log('   1. CAMPO "content" (JSON de Polotno):');
        if (design.content) {
            const content = JSON.parse(design.content);
            console.log(`      - Dimensiones: ${content.width || 'N/A'} x ${content.height || 'N/A'}`);
        }
        
        console.log('   2. CAMPO "enhanced_content":');
        if (design.enhanced_content) {
            const enhanced = JSON.parse(design.enhanced_content);
            if (enhanced.enhanced && enhanced.enhanced.metadata && enhanced.enhanced.metadata.dimensions) {
                const dims = enhanced.enhanced.metadata.dimensions;
                console.log(`      - Dimensiones: ${dims.width} x ${dims.height}`);
            } else {
                console.log('      - No contiene metadata.dimensions');
            }
        }
        
        console.log('   3. CAMPO "html_content":');
        if (design.html_content) {
            const has1920 = design.html_content.includes('1920');
            const has1080 = design.html_content.includes('1080');
            console.log(`      - Contiene dimensiones 1920x1080: ${has1920 && has1080}`);
        }
        
        console.log('');
        console.log('💡 EXPLICACIÓN DEL PROBLEMA:');
        console.log('   • El EDITOR lee desde: enhanced_content.enhanced.metadata.dimensions (1920x1080)');
        console.log('   • El RENDERIZADOR lee desde: content.width/height (1080x1080)');
        console.log('   • Por eso el editor muestra las dimensiones correctas pero el HTML se genera mal');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await db.close();
    }
}

traceDimensionFlow();