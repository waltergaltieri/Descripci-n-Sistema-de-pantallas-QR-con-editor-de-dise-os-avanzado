const { db, initialize } = require('./config/database');

async function verifyDesign64Fonts() {
    try {
        await initialize();
        const database = db();
        
        console.log('🔍 Verificando fuentes en el diseño ID:64...');
        
        const design = await database.get('SELECT * FROM designs WHERE id = 64');
        
        if (!design) {
            console.log('❌ Diseño ID:64 no encontrado');
            return;
        }
        
        const designData = JSON.parse(design.content);
        const textElements = designData.pages[0].children.filter(el => el.type === 'text');
        
        console.log('\n📝 ELEMENTOS DE TEXTO EN EL DISEÑO:');
        console.log('=' .repeat(50));
        textElements.forEach((el, i) => {
            console.log(`${i+1}. Texto: "${el.text}"`);
            console.log(`   Fuente: ${el.fontFamily}`);
            console.log(`   Tamaño: ${el.fontSize}px`);
            console.log(`   Peso: ${el.fontWeight}`);
            console.log('');
        });
        
        if (!design.html_content) {
            console.log('❌ No hay HTML generado para este diseño');
            return;
        }
        
        console.log('\n🔍 ANÁLISIS DEL HTML GENERADO:');
        console.log('=' .repeat(50));
        
        // Verificar enlaces de Google Fonts
        const googleFontsRegex = /fonts\.googleapis\.com\/css2\?family=([^"']+)/;
        const googleFontsMatch = design.html_content.match(googleFontsRegex);
        
        if (googleFontsMatch) {
            console.log('✅ Enlace de Google Fonts encontrado:');
            console.log(`   ${googleFontsMatch[0]}`);
            
            // Decodificar las fuentes del enlace
            const fontQuery = googleFontsMatch[1];
            const decodedQuery = decodeURIComponent(fontQuery);
            console.log(`\n📋 Fuentes incluidas en el enlace:`);
            
            const fontFamilies = decodedQuery.split('&family=');
            fontFamilies.forEach((font, i) => {
                if (font) {
                    const fontName = font.split(':')[0].replace(/\+/g, ' ');
                    console.log(`   ${i+1}. ${fontName}`);
                }
            });
        } else {
            console.log('❌ No se encontró enlace de Google Fonts');
        }
        
        console.log('\n🎯 VERIFICACIÓN POR ELEMENTO:');
        console.log('=' .repeat(50));
        
        textElements.forEach((el, i) => {
            const fontName = el.fontFamily;
            const fontInUrl = design.html_content.includes(fontName.replace(' ', '+')) || 
                             design.html_content.includes(fontName);
            
            console.log(`${i+1}. "${el.text}"`);
            console.log(`   Fuente requerida: ${fontName}`);
            console.log(`   Estado: ${fontInUrl ? '✅ INCLUIDA en HTML' : '❌ FALTANTE en HTML'}`);
            
            // Verificar también en el JSON de Konva
            const konvaJsonMatch = design.html_content.match(/const konvaJson = (.+);/);
            if (konvaJsonMatch) {
                const konvaData = JSON.parse(konvaJsonMatch[1]);
                const konvaObj = JSON.parse(konvaData);
                
                // Buscar el elemento de texto en el JSON de Konva
                const textNodes = [];
                if (konvaObj.children && konvaObj.children[0] && konvaObj.children[0].children) {
                    konvaObj.children[0].children.forEach(child => {
                        if (child.className === 'Text') {
                            textNodes.push(child);
                        }
                    });
                }
                
                const matchingNode = textNodes.find(node => node.attrs.text === el.text);
                if (matchingNode) {
                    console.log(`   Fuente en Konva: ${matchingNode.attrs.fontFamily}`);
                    console.log(`   Coincide: ${matchingNode.attrs.fontFamily === fontName ? '✅ SÍ' : '❌ NO'}`);
                }
            }
            console.log('');
        });
        
        console.log('\n🌐 PRUEBA EN NAVEGADOR:');
        console.log('=' .repeat(50));
        console.log('Para verificar que las fuentes se cargan correctamente:');
        console.log('1. Abre http://localhost:3000');
        console.log('2. Ve a la sección "Diseños"');
        console.log('3. Busca el diseño "Veamos las dimenciones" (ID:64)');
        console.log('4. Haz clic en "Ver HTML" para ver el resultado');
        console.log('5. Verifica que cada texto se muestra con su fuente correcta:');
        textElements.forEach((el, i) => {
            console.log(`   - "${el.text}" debe verse en fuente ${el.fontFamily}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        process.exit(0);
    }
}

verifyDesign64Fonts();