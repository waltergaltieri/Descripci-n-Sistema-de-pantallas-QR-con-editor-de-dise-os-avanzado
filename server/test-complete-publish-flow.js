const axios = require('axios');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

async function testCompletePublishFlow() {
  try {
    console.log('🧪 Probando flujo COMPLETO de publicación desde API (simulando botón publicar)...');
    
    const designId = 67;
    const serverUrl = 'http://localhost:5000';
    
    // Paso 1: Verificar estado inicial
    console.log('\n📋 Paso 1: Verificando estado inicial del diseño 67...');
    const db = await open({
      filename: path.join(__dirname, 'database.sqlite'),
      driver: sqlite3.Database
    });
    
    const initialDesign = await db.get('SELECT html_content, separated_svgs FROM designs WHERE id = ?', [designId]);
    const initialSvgs = initialDesign.separated_svgs ? JSON.parse(initialDesign.separated_svgs) : [];
    
    console.log(`   📏 HTML inicial: ${initialDesign.html_content ? initialDesign.html_content.length : 0} caracteres`);
    console.log(`   📁 SVGs iniciales: ${initialSvgs.length}`);
    
    // Paso 2: Obtener token de autenticación (simulando login)
    console.log('\n🔐 Paso 2: Obteniendo token de autenticación...');
    let authToken;
    try {
      const loginResponse = await axios.post(`${serverUrl}/api/auth/login`, {
        username: 'admin',
        password: 'admin123'
      });
      authToken = loginResponse.data.token;
      console.log('   ✅ Token obtenido exitosamente');
    } catch (loginError) {
      console.log('   ⚠️ Error obteniendo token, continuando sin autenticación...');
      authToken = null;
    }
    
    // Paso 3: Ejecutar publicación (simulando exactamente el botón publicar)
    console.log('\n🚀 Paso 3: Ejecutando publicación via API POST /api/designs/67/publish...');
    
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const startTime = Date.now();
    
    try {
      const publishResponse = await axios.post(
        `${serverUrl}/api/designs/${designId}/publish`,
        {},
        { headers, timeout: 60000 }
      );
      
      const endTime = Date.now();
      console.log(`   ✅ Publicación completada en ${endTime - startTime}ms`);
      console.log(`   📊 Respuesta: ${JSON.stringify(publishResponse.data, null, 2)}`);
      
    } catch (publishError) {
      console.error(`   ❌ Error en publicación:`, publishError.response?.data || publishError.message);
      throw publishError;
    }
    
    // Paso 4: Verificar estado después de publicación
    console.log('\n🔍 Paso 4: Verificando estado después de publicación...');
    
    const finalDesign = await db.get('SELECT html_content, separated_svgs FROM designs WHERE id = ?', [designId]);
    const finalSvgs = finalDesign.separated_svgs ? JSON.parse(finalDesign.separated_svgs) : [];
    
    console.log(`   📏 HTML final: ${finalDesign.html_content ? finalDesign.html_content.length : 0} caracteres`);
    console.log(`   📁 SVGs finales: ${finalSvgs.length}`);
    
    // Paso 5: Analizar HTML generado
    console.log('\n📊 Paso 5: Analizando HTML generado por la publicación...');
    
    if (finalDesign.html_content) {
      const svgCount = (finalDesign.html_content.match(/<svg[^>]*>/g) || []).length;
      console.log(`   🎨 Elementos SVG en HTML: ${svgCount}`);
      
      const ignoredMatch = finalDesign.html_content.match(/Ignored elements: (\d+)/);
      const ignoredCount = ignoredMatch ? parseInt(ignoredMatch[1]) : 0;
      console.log(`   ⚠️ Elementos ignorados: ${ignoredCount}`);
      
      const replacedMatch = finalDesign.html_content.match(/Replaced elements with SVGs: (\d+)\/(\d+)/);
      if (replacedMatch) {
        console.log(`   ✅ Elementos reemplazados: ${replacedMatch[1]}/${replacedMatch[2]}`);
      }
      
      // Verificar éxito
      const success = svgCount > 0 && ignoredCount === 0;
      console.log(`\n🎯 Resultado del flujo completo:`);
      console.log(`   ${success ? '✅ ÉXITO' : '❌ FALLO'}: ${success ? 'SVGs integrados correctamente en publicación' : 'SVGs NO integrados en publicación'}`);
      
      if (!success) {
        console.log('\n❌ PROBLEMAS DETECTADOS:');
        if (svgCount === 0) console.log('   - No se encontraron SVGs en el HTML publicado');
        if (ignoredCount > 0) console.log(`   - ${ignoredCount} elementos fueron ignorados durante la publicación`);
        
        console.log('\n🔍 Información de debug:');
        console.log(`   - SVGs disponibles en BD: ${finalSvgs.length}`);
        console.log(`   - Tamaño HTML: ${finalDesign.html_content.length} caracteres`);
        
        // Mostrar una muestra del HTML para debug
        const htmlSample = finalDesign.html_content.substring(0, 500);
        console.log(`   - Muestra HTML: ${htmlSample}...`);
      }
      
    } else {
      console.log('   ❌ No se generó HTML durante la publicación');
    }
    
    // Paso 6: Verificar pantallas asignadas
    console.log('\n📺 Paso 6: Verificando pantallas asignadas...');
    const assignedScreens = await db.all(
      'SELECT id, name, design_html FROM screens WHERE design_id = ?',
      [designId]
    );
    
    console.log(`   📱 Pantallas asignadas: ${assignedScreens.length}`);
    
    for (const screen of assignedScreens) {
      const screenSvgCount = screen.design_html ? (screen.design_html.match(/<svg[^>]*>/g) || []).length : 0;
      console.log(`   📱 Pantalla ${screen.id} (${screen.name}): ${screen.design_html ? screen.design_html.length : 0} chars, ${screenSvgCount} SVGs`);
    }
    
    await db.close();
    
  } catch (error) {
    console.error('❌ Error en test de flujo completo:', error);
  }
}

testCompletePublishFlow();