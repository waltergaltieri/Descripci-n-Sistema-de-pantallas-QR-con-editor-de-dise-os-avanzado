const express = require('express');
const router = express.Router();
const autoSvgExporter = require('../utils/autoSvgExporter');

/**
 * POST /api/auto-svg-export/separate-and-export/:designId
 * Separa figuras internamente y exporta cada una automáticamente a SVG
 */
router.post('/separate-and-export/:designId', async (req, res) => {
  try {
    const designId = parseInt(req.params.designId);
    
    if (isNaN(designId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de diseño inválido'
      });
    }

    console.log(`🚀 API: Iniciando separación y exportación automática SVG para diseño ${designId}`);
    
    const options = {
      namePrefix: req.body.namePrefix || 'Figura (Auto-Exportada)',
      exportPrefix: req.body.exportPrefix || 'auto-export'
    };
    
    const result = await autoSvgExporter.separateAndExportToSVG(designId, options);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Se separaron ${result.statistics.totalSeparated} figuras y se exportaron ${result.statistics.successfulExports} SVGs exitosamente`,
        data: {
          originalDesignId: result.originalDesignId,
          separatedDesignIds: result.separatedDesignIds,
          exportResults: result.exportResults,
          statistics: result.statistics
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error en API de exportación automática SVG:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-svg-export/quick/:designId
 * Función rápida con configuración predeterminada
 */
router.post('/quick/:designId', async (req, res) => {
  try {
    const designId = parseInt(req.params.designId);
    
    if (isNaN(designId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de diseño inválido'
      });
    }

    console.log(`⚡ API: Exportación rápida SVG para diseño ${designId}`);
    
    const result = await autoSvgExporter.autoSeparateAndExport(designId);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Exportación rápida completada: ${result.statistics.successfulExports}/${result.statistics.totalSeparated} SVGs generados`,
        data: {
          originalDesignId: result.originalDesignId,
          separatedDesignIds: result.separatedDesignIds,
          statistics: result.statistics,
          exportedFiles: result.exportResults.filter(r => r.success).map(r => r.filename)
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('Error en API de exportación rápida SVG:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auto-svg-export/info
 * Información sobre la funcionalidad de exportación automática SVG
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    info: {
      description: 'API para separar figuras internamente y exportar automáticamente a SVG',
      endpoints: {
        'POST /separate-and-export/:designId': {
          description: 'Separa figuras y exporta cada una a SVG con opciones personalizadas',
          body: {
            namePrefix: 'string (opcional) - Prefijo para nombres de diseños separados',
            exportPrefix: 'string (opcional) - Prefijo para nombres de archivos SVG'
          }
        },
        'POST /quick/:designId': {
          description: 'Separación y exportación rápida con configuración predeterminada',
          body: 'No requiere body'
        }
      },
      features: [
        'Separación automática de figuras usando editor interno (sin interfaz visible)',
        'Exportación automática de cada figura separada a archivo SVG',
        'Optimización de canvas para cada figura',
        'Exportación con fondo transparente',
        'Estadísticas detalladas del proceso',
        'Manejo de errores por figura individual',
        'Archivos guardados en directorio server/exports/'
      ],
      workflow: [
        '1. Separar figuras del diseño original usando editor interno',
        '2. Para cada figura separada:',
        '   - Cargar diseño en editor interno invisible',
        '   - Exportar como SVG con fondo transparente',
        '   - Guardar archivo en directorio exports',
        '3. Retornar estadísticas y resultados completos'
      ],
      outputDirectory: 'server/exports/',
      fileNaming: 'auto-export-{originalDesignId}-figura-{number}-{timestamp}.svg'
    }
  });
});

module.exports = router;