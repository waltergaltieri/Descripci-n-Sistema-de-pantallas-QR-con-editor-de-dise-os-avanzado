const { renderWithKonva } = require('./server/utils/konvaRenderer');
const { db, initialize } = require('./server/config/database');

async function testFonts() {
    try {
        await initialize();
        const database = db();
        
        const design = await database.get('SELECT * FROM designs WHERE id = ?', [67]);
        
        if (!design) {
            console.log('❌ Diseño 67 no encontrado');
            return;
        }
        
        console.log('✅ Diseño encontrado:', design.name);
        console.log('📊 Campos del diseño:', Object.keys(design));
        
        // Mostrar solo los primeros caracteres de cada campo
        const designSummary = {};
        for (const [key, value] of Object.entries(design)) {
            if (typeof value === 'string' && value.length > 100) {
                designSummary[key] = value.substring(0, 100) + '... (' + value.length + ' caracteres)';
            } else {
                designSummary[key] = value;
            }
        }
        console.log('📄 Resumen del diseño:', designSummary);
        
        // Verificar qué campo contiene los datos JSON
        let designData;
        if (design.content) {
            designData = JSON.parse(design.content);
        } else if (design.data) {
            designData = JSON.parse(design.data);
        } else if (design.json_data) {
            designData = JSON.parse(design.json_data);
        } else {
            console.log('❌ No se encontró campo de datos JSON válido');
            return;
        }
        console.log('📊 Datos del diseño cargados');
        
        // Primero, vamos a ver qué fuentes están en el diseño
        console.log('\n🔍 Analizando fuentes en el diseño:');
        console.log('📋 Fuentes definidas en el diseño:', designData.fonts || []);
        
        // Buscar elementos de texto para ver qué fuentes usan
        const textElements = [];
        function findTextElements(obj) {
            if (obj && typeof obj === 'object') {
                if (obj.type === 'text' || obj.type === 'textbox') {
                    textElements.push({
                        id: obj.id,
                        text: obj.text,
                        fontFamily: obj.fontFamily,
                        fontWeight: obj.fontWeight,
                        fontStyle: obj.fontStyle
                    });
                }
                if (obj.children && Array.isArray(obj.children)) {
                    obj.children.forEach(findTextElements);
                }
                if (obj.pages && Array.isArray(obj.pages)) {
                    obj.pages.forEach(findTextElements);
                }
            }
        }
        
        findTextElements(designData);
        console.log('📝 Elementos de texto encontrados:', textElements);
        
        // Probar la función renderWithKonva
        const html = await renderWithKonva(designData, design.name, design.id);
        
        console.log('📝 HTML generado, longitud:', html.length);
        
        // Verificar si contiene fuentes
        const hasGoogleFonts = html.includes('fonts.googleapis.com');
        const hasFontFace = html.includes('@font-face');
        
        console.log('🔍 Contiene Google Fonts:', hasGoogleFonts);
        console.log('🔍 Contiene @font-face:', hasFontFace);
        
        // Verificar el HTML guardado en la base de datos
        const savedDesign = await database.get('SELECT html_content FROM designs WHERE id = ?', [67]);
        if (savedDesign && savedDesign.html_content) {
            const savedHtml = savedDesign.html_content;
            const savedContainsGoogleFonts = savedHtml.includes('fonts.googleapis.com');
            const savedContainsFontFace = savedHtml.includes('@font-face');
            
            console.log('\n📊 HTML guardado en base de datos:');
            console.log('🔍 Contiene Google Fonts:', savedContainsGoogleFonts);
            console.log('🔍 Contiene @font-face:', savedContainsFontFace);
            console.log('📏 Longitud del HTML:', savedHtml.length);
            
            if (!savedContainsGoogleFonts && !savedContainsFontFace) {
                console.log('⚠️ No se encontraron fuentes en el HTML guardado');
                console.log('📄 Muestra del HTML guardado (primeros 1000 caracteres):');
                console.log(savedHtml.substring(0, 1000));
            }
        } else {
            console.log('❌ No se encontró HTML guardado en la base de datos');
        }
        
        if (!hasGoogleFonts && !hasFontFace) {
            console.log('⚠️ No se encontraron fuentes en el HTML generado');
            
            // Mostrar una muestra del HTML
            console.log('📄 Muestra del HTML (primeros 1000 caracteres):');
            console.log(html.substring(0, 1000));
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testFonts();