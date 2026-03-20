const { renderWithKonva } = require('./utils/konvaRenderer');
const { db, initialize } = require('./config/database');
const fs = require('fs');

async function debugKonvaJson() {
  try {
    await initialize();
    const database = db();
    
    // Obtener el diseño 67
    const design = await database.get('SELECT * FROM designs WHERE id = 67');
    
    if (!design) {
      console.log('❌ Diseño 67 no encontrado');
      return;
    }
    
    console.log('🎨 Diseño encontrado:', design.name);
    
    const jsonData = JSON.parse(design.content);
    console.log('📄 Contenido del diseño:');
    console.log('- Páginas:', jsonData.pages?.length || 0);
    
    if (jsonData.pages && jsonData.pages[0]) {
      const firstPage = jsonData.pages[0];
      console.log('- Elementos en primera página:', firstPage.children?.length || 0);
      
      // Analizar tipos de elementos
      firstPage.children?.forEach((child, index) => {
        console.log(`  ${index}: ${child.type} - ${child.src ? 'con src' : 'sin src'}`);
        if (child.type === 'image' && child.src) {
          const isSvg = child.src.includes('data:image/svg+xml');
          console.log(`    -> ${isSvg ? 'SVG embebido' : 'imagen normal'}`);
        }
      });
    }
    
    // Generar HTML y examinar el JSON de Konva
    console.log('\n🔧 Generando HTML...');
    const html = await renderWithKonva(jsonData, 'debug-container', 67);
    
    // Extraer el JSON de Konva del HTML
    const jsonMatch = html.match(/const konvaJson = (.+?);/);
    if (jsonMatch) {
        const konvaJsonStr = jsonMatch[1];
        console.log('\n🔍 JSON extraído (primeros 500 caracteres):');
        console.log(konvaJsonStr.substring(0, 500));
        console.log('\n🔍 JSON extraído (últimos 500 caracteres):');
        console.log(konvaJsonStr.substring(konvaJsonStr.length - 500));
        
        const konvaJson = JSON.parse(konvaJsonStr);
      
      console.log('\n📊 JSON de Konva generado:');
      console.log('- Ancho:', konvaJson.attrs.width);
      console.log('- Alto:', konvaJson.attrs.height);
      
      if (konvaJson.children && konvaJson.children[0]) {
        const layer = konvaJson.children[0];
        console.log('- Elementos en layer:', layer.children?.length || 0);
        
        layer.children?.forEach((child, index) => {
          console.log(`  ${index}: ${child.className}`);
          if (child.className === 'Group' && child.attrs.isSvgElement) {
            console.log(`    -> ✅ SVG Element detectado con svgData: ${child.attrs.svgData ? 'SÍ' : 'NO'}`);
          }
        });
      }
      
      // Guardar JSON para inspección
      fs.writeFileSync('./debug-konva-output.json', JSON.stringify(konvaJson, null, 2));
      console.log('\n💾 JSON guardado en debug-konva-output.json');
    } else {
      console.log('❌ No se pudo extraer JSON de Konva del HTML');
    }
    
    // Guardar HTML para inspección
    fs.writeFileSync('./debug-konva-output.html', html);
    console.log('💾 HTML guardado en debug-konva-output.html');
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

debugKonvaJson();