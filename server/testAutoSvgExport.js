const autoSvgExporter = require('./utils/autoSvgExporter');
const axios = require('axios');

/**
 * Script de prueba para la funcionalidad de exportación automática SVG
 * Demuestra cómo separar figuras internamente y exportar cada una automáticamente a SVG
 */

async function testAutoSvgExportProgrammatic() {
  console.log('🧪 === PRUEBA PROGRAMÁTICA DE EXPORTACIÓN AUTOMÁTICA SVG ===\n');
  
  try {
    // Usar el diseño 67 que sabemos que tiene figuras
    const designId = 67;
    
    console.log(`🎯 Probando exportación automática SVG para diseño ${designId}...\n`);
    
    // Llamar directamente a la función
    const result = await autoSvgExporter.autoSeparateAndExport(designId);
    
    if (result.success) {
      console.log('✅ ÉXITO: Exportación automática completada');
      console.log(`📊 Estadísticas:`);
      console.log(`   - Diseño original: ${result.originalDesignId}`);
      console.log(`   - Figuras separadas: ${result.statistics.totalSeparated}`);
      console.log(`   - SVGs exportados exitosamente: ${result.statistics.successfulExports}`);
      console.log(`   - Exportaciones fallidas: ${result.statistics.failedExports}`);
      console.log(`   - Tasa de éxito: ${result.statistics.successRate}`);
      
      console.log(`\n📋 Diseños separados creados:`);
      result.separatedDesignIds.forEach((id, index) => {
        console.log(`   ${index + 1}. Diseño ID: ${id}`);
      });
      
      console.log(`\n📤 Archivos SVG generados:`);
      result.exportResults.forEach((exportResult, index) => {
        if (exportResult.success) {
          console.log(`   ✅ ${index + 1}. ${exportResult.filename}`);
        } else {
          console.log(`   ❌ ${index + 1}. Error: ${exportResult.error}`);
        }
      });
      
    } else {
      console.log('❌ ERROR en exportación automática:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error en prueba programática:', error.message);
  }
}

async function testAutoSvgExportAPI() {
  console.log('\n🧪 === PRUEBA API DE EXPORTACIÓN AUTOMÁTICA SVG ===\n');
  
  try {
    const designId = 67;
    const apiUrl = 'http://localhost:5000/api/auto-svg-export/quick/' + designId;
    
    console.log(`🌐 Probando API: POST ${apiUrl}...\n`);
    
    const response = await axios.post(apiUrl, {}, {
      timeout: 60000 // 60 segundos de timeout
    });
    
    if (response.data.success) {
      console.log('✅ ÉXITO: API de exportación automática completada');
      console.log(`📊 Mensaje: ${response.data.message}`);
      console.log(`📋 Datos:`);
      console.log(`   - Diseño original: ${response.data.data.originalDesignId}`);
      console.log(`   - Figuras separadas: ${response.data.data.statistics.totalSeparated}`);
      console.log(`   - SVGs exportados: ${response.data.data.statistics.successfulExports}`);
      console.log(`   - Tasa de éxito: ${response.data.data.statistics.successRate}`);
      
      console.log(`\n📤 Archivos SVG generados:`);
      response.data.data.exportedFiles.forEach((filename, index) => {
        console.log(`   ${index + 1}. ${filename}`);
      });
      
    } else {
      console.log('❌ ERROR en API:', response.data.error);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Error en API:', error.response.data.error || error.response.statusText);
    } else {
      console.error('❌ Error de conexión:', error.message);
    }
  }
}

async function testInfoEndpoint() {
  console.log('\n🧪 === PRUEBA ENDPOINT DE INFORMACIÓN ===\n');
  
  try {
    const response = await axios.get('http://localhost:5000/api/auto-svg-export/info');
    
    console.log('📋 Información de la API:');
    console.log(`   Descripción: ${response.data.info.description}`);
    console.log(`   Directorio de salida: ${response.data.info.outputDirectory}`);
    console.log(`   Patrón de nombres: ${response.data.info.fileNaming}`);
    
    console.log(`\n🔧 Endpoints disponibles:`);
    Object.keys(response.data.info.endpoints).forEach(endpoint => {
      console.log(`   - ${endpoint}: ${response.data.info.endpoints[endpoint].description}`);
    });
    
    console.log(`\n✨ Características:`);
    response.data.info.features.forEach((feature, index) => {
      console.log(`   ${index + 1}. ${feature}`);
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo información:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 INICIANDO PRUEBAS DE EXPORTACIÓN AUTOMÁTICA SVG\n');
  console.log('=' .repeat(60));
  
  // Prueba 1: Información de la API
  await testInfoEndpoint();
  
  // Prueba 2: Función programática
  await testAutoSvgExportProgrammatic();
  
  // Prueba 3: API REST
  await testAutoSvgExportAPI();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 PRUEBAS COMPLETADAS');
  console.log('\n💡 Los archivos SVG se guardan en: server/exports/');
  console.log('💡 Puedes verificar los archivos generados en ese directorio');
}

// Ejecutar todas las pruebas
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAutoSvgExportProgrammatic,
  testAutoSvgExportAPI,
  testInfoEndpoint,
  runAllTests
};