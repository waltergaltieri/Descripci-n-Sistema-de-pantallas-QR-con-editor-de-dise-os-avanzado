const express = require('express');
const { separateDesignFigures, separateFiguresFromDesign } = require('../utils/figuresSeparator');
const router = express.Router();

/**
 * POST /api/figures-separation/separate/:designId
 * Separa todas las figuras de un diseño en canvas individuales
 */
router.post('/separate/:designId', async (req, res) => {
  try {
    const designId = parseInt(req.params.designId);
    
    if (isNaN(designId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de diseño inválido'
      });
    }

    const options = {
      namePrefix: req.body.namePrefix || 'Figura',
      optimizeCanvas: req.body.optimizeCanvas !== false // true por defecto
    };

    console.log(`🔄 API: Separando figuras del diseño ${designId}`);
    
    const createdDesignIds = await separateDesignFigures(designId, options);
    
    res.json({
      success: true,
      message: `Se separaron ${createdDesignIds.length} figuras exitosamente`,
      data: {
        originalDesignId: designId,
        createdDesignIds: createdDesignIds,
        count: createdDesignIds.length
      }
    });
    
  } catch (error) {
    console.error('Error en API de separación:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/figures-separation/separate-simple/:designId
 * Versión simplificada para separar figuras con configuración predeterminada
 */
router.post('/separate-simple/:designId', async (req, res) => {
  try {
    const designId = parseInt(req.params.designId);
    
    if (isNaN(designId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de diseño inválido'
      });
    }

    console.log(`🔄 API Simple: Separando figuras del diseño ${designId}`);
    
    const createdDesignIds = await separateFiguresFromDesign(designId);
    
    res.json({
      success: true,
      message: `Se separaron ${createdDesignIds.length} figuras exitosamente`,
      data: {
        originalDesignId: designId,
        createdDesignIds: createdDesignIds,
        count: createdDesignIds.length
      }
    });
    
  } catch (error) {
    console.error('Error en API simple de separación:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/figures-separation/info
 * Información sobre la funcionalidad de separación
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    info: {
      description: 'API para separar figuras de diseños en canvas individuales',
      endpoints: {
        'POST /separate/:designId': {
          description: 'Separa figuras con opciones personalizadas',
          body: {
            namePrefix: 'string (opcional) - Prefijo para nombres de diseños',
            optimizeCanvas: 'boolean (opcional) - Si optimizar canvas al tamaño de figura'
          }
        },
        'POST /separate-simple/:designId': {
          description: 'Separa figuras con configuración predeterminada',
          body: 'No requiere body'
        }
      },
      features: [
        'Separación automática de todas las figuras de un diseño',
        'Optimización ultra-ajustada del canvas (2px padding)',
        'Centrado automático de figuras',
        'Registro automático en base de datos',
        'Nombres descriptivos automáticos'
      ]
    }
  });
});

module.exports = router;