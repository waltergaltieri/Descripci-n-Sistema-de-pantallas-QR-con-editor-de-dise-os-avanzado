/**
 * Demostración de la funcionalidad de exportación automática SVG
 * para figuras separadas internamente
 */

const autoSvgExporter = require('./utils/autoSvgExporter');

async function demoAutoSvgExport() {
  console.log('🎨 === DEMOSTRACIÓN DE EXPORTACIÓN AUTOMÁTICA SVG ===\n');
  
  try {
    // ID del diseño original que contiene múltiples figuras
    const originalDesignId = process.argv[2] ? parseInt(process.argv[2]) : 67;
    
    console.log(`📋 Iniciando demostración con diseño ID: ${originalDesignId}`);
    console.log('🔄 Este proceso hará lo siguiente:');
    console.log('   1. Separar las figuras del diseño original internamente');
    console.log('   2. Crear nuevos diseños internos para cada figura');
    console.log('   3. Exportar automáticamente cada figura a un archivo SVG');
    console.log('   4. Guardar los archivos en el directorio server/exports/');
    console.log('');
    
    // Ejecutar la exportación automática
    const result = await autoSvgExporter.separateAndExportToSVG(originalDesignId, {
      namePrefix: 'Figura Demo',
      exportPrefix: 'demo-figura'
    });
    
    if (result.success) {
      console.log('\n🎉 ¡DEMOSTRACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('\n📊 Resumen de resultados:');
      console.log(`   📋 Diseño original: ${result.originalDesignId}`);
      console.log(`   🔄 Figuras separadas: ${result.statistics.totalSeparated}`);
      console.log(`   ✅ Exportaciones exitosas: ${result.statistics.successfulExports}`);
      console.log(`   ❌ Exportaciones fallidas: ${result.statistics.failedExports}`);
      console.log(`   🧹 Diseños internos limpiados: ${result.statistics.cleanedDesigns}`);
      console.log(`   📈 Tasa de éxito exportación: ${result.statistics.successRate}`);
      console.log(`   🗑️ Tasa de limpieza: ${result.statistics.cleanupRate}`);
      
      console.log('\n📋 Diseños internos procesados:');
      result.separatedDesignIds.forEach((id, index) => {
        const cleanupInfo = result.cleanupResults.find(c => c.designId === id);
        const status = cleanupInfo?.cleaned ? '🗑️ eliminado' : '⚠️ mantenido';
        console.log(`   ${index + 1}. Diseño ID: ${id} (${status} después de exportación)`);
      });
      
      console.log('\n📤 Archivos SVG generados:');
      result.exportResults.forEach((exportResult, index) => {
        if (exportResult.success) {
          console.log(`   ✅ ${index + 1}. ${exportResult.filename}`);
        } else {
          console.log(`   ❌ ${index + 1}. Error: ${exportResult.error}`);
        }
      });
      
      console.log('\n💡 Características de esta funcionalidad:');
      console.log('   🔒 Los diseños separados son internos (no aparecen en la lista del frontend)');
      console.log('   📁 Los archivos SVG se guardan automáticamente en server/exports/');
      console.log('   🎨 Cada figura se exporta como un archivo SVG independiente');
      console.log('   🗑️ Los diseños internos se eliminan automáticamente después de exportación exitosa');
      console.log('   🚀 Todo el proceso es automático, sin intervención del usuario');
      console.log('   🌐 Disponible también como API REST en /api/auto-svg-export/');
      console.log('   🧹 Limpieza automática de canvas individuales para optimizar espacio');
      
    } else {
      console.log('\n❌ Error en la demostración:');
      console.log(`   ${result.error}`);
    }
    
  } catch (error) {
    console.error('\n💥 Error inesperado en la demostración:', error.message);
  }
  
  console.log('\n🏁 Demostración finalizada.');
  console.log('💡 Puedes verificar los archivos generados en: server/exports/');
}

// Ejecutar la demostración
if (require.main === module) {
  demoAutoSvgExport();
}

module.exports = { demoAutoSvgExport };