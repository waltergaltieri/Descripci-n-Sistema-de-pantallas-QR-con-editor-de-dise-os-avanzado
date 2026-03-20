const express = require('express');
const router = express.Router();
const polotnoExporter = require('../utils/polotnoExporter');
const path = require('path');
const fs = require('fs');

/**
 * POST /api/export/svg
 * Exporta una forma como SVG usando Polotno nativo a través de Puppeteer
 */
router.post('/svg', async (req, res) => {
  try {
    const { shapeConfig, filename } = req.body;
    
    // Validar configuración de forma
    if (!shapeConfig || !shapeConfig.type) {
      return res.status(400).json({
        success: false,
        error: 'Configuración de forma requerida con tipo especificado'
      });
    }

    // Tipos de forma soportados
    const supportedTypes = ['rect', 'circle', 'triangle'];
    if (!supportedTypes.includes(shapeConfig.type)) {
      return res.status(400).json({
        success: false,
        error: `Tipo de forma no soportado. Tipos válidos: ${supportedTypes.join(', ')}`
      });
    }

    console.log(`🎨 Iniciando exportación SVG para forma: ${shapeConfig.type}`);
    
    // Exportar usando Polotno nativo
    const result = await polotnoExporter.exportShape(shapeConfig, filename);
    
    if (result.success) {
      console.log(`✅ Exportación exitosa: ${result.filename}`);
      
      res.json({
        success: true,
        message: 'SVG exportado exitosamente',
        filename: result.filename,
        filepath: result.filepath,
        svgData: result.svgData
      });
    } else {
      console.error(`❌ Error en exportación: ${result.error}`);
      
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Error en endpoint de exportación:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor durante la exportación'
    });
  }
});

/**
 * GET /api/export/svg/:filename
 * Descarga un archivo SVG exportado
 */
router.get('/svg/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../exports', filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo SVG no encontrado'
      });
    }
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Enviar archivo
    res.sendFile(filepath);
    
  } catch (error) {
    console.error('❌ Error al descargar SVG:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor durante la descarga'
    });
  }
});

/**
 * GET /api/export/list
 * Lista todos los archivos SVG exportados
 */
router.get('/list', (req, res) => {
  try {
    const exportsDir = path.join(__dirname, '../exports');
    
    // Crear directorio si no existe
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
      return res.json({
        success: true,
        files: []
      });
    }
    
    // Leer archivos SVG
    const files = fs.readdirSync(exportsDir)
      .filter(file => file.endsWith('.svg'))
      .map(file => {
        const filepath = path.join(exportsDir, file);
        const stats = fs.statSync(filepath);
        
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created); // Más recientes primero
    
    res.json({
      success: true,
      files
    });
    
  } catch (error) {
    console.error('❌ Error al listar archivos:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al listar archivos'
    });
  }
});

/**
 * DELETE /api/export/svg/:filename
 * Elimina un archivo SVG exportado
 */
router.delete('/svg/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(__dirname, '../exports', filename);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        error: 'Archivo SVG no encontrado'
      });
    }
    
    // Eliminar archivo
    fs.unlinkSync(filepath);
    
    res.json({
      success: true,
      message: `Archivo ${filename} eliminado exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error al eliminar SVG:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor durante la eliminación'
    });
  }
});

/**
 * POST /api/export/test
 * Endpoint de prueba para verificar la funcionalidad
 */
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Iniciando prueba de exportación...');
    
    // Configuraciones de prueba
    const testShapes = [
      {
        type: 'rect',
        properties: {
          fill: '#3B82F6',
          stroke: '#1E40AF',
          strokeWidth: 2
        }
      },
      {
        type: 'circle',
        properties: {
          fill: '#EF4444',
          stroke: '#DC2626',
          strokeWidth: 2
        }
      },
      {
        type: 'triangle',
        properties: {
          fill: '#10B981',
          stroke: '#059669',
          strokeWidth: 2
        }
      }
    ];
    
    const results = [];
    
    // Exportar cada forma de prueba
    for (const shapeConfig of testShapes) {
      const result = await polotnoExporter.exportShape(
        shapeConfig, 
        `test-${shapeConfig.type}-${Date.now()}.svg`
      );
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Prueba completada: ${successCount}/${results.length} exportaciones exitosas`,
      results
    });
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error durante la prueba de exportación'
    });
  }
});

module.exports = router;