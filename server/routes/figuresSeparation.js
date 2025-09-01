const express = require('express');
const { 
  separateDesignFigures, 
  separateFiguresFromDesign,
  separateDesignFiguresInternal,
  separateFiguresFromDesignInternal
} = require('../utils/figuresSeparator');
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
 * POST /api/figures-separation/separate-internal/:designId
 * Separa todas las figuras de un diseño usando el editor interno (sin interfaz visible)
 */
router.post('/separate-internal/:designId', async (req, res) => {
  try {
    const designId = parseInt(req.params.designId);
    
    if (isNaN(designId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de diseño inválido'
      });
    }

    const options = {
      namePrefix: req.body.namePrefix || 'Figura (Interno)',
      optimizeCanvas: req.body.optimizeCanvas !== false, // true por defecto
      useInternalEditor: true
    };

    console.log(`🔧 API INTERNA: Separando figuras del diseño ${designId} usando editor interno`);
    
    const createdDesignIds = await separateDesignFiguresInternal(designId, options);
    
    res.json({
      success: true,
      message: `Se separaron ${createdDesignIds.length} figuras exitosamente usando el editor interno`,
      data: {
        originalDesignId: designId,
        createdDesignIds: createdDesignIds,
        count: createdDesignIds.length,
        mode: 'internal',
        editorUsed: 'internal'
      }
    });
    
  } catch (error) {
    console.error('Error en API interna de separación:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/figures-separation/separate-internal-simple/:designId
 * Versión simplificada para separar figuras usando el editor interno
 */
router.post('/separate-internal-simple/:designId', async (req, res) => {
  try {
    const designId = parseInt(req.params.designId);
    
    if (isNaN(designId)) {
      return res.status(400).json({
        success: false,
        error: 'ID de diseño inválido'
      });
    }

    console.log(`🔧 API INTERNA SIMPLE: Separando figuras del diseño ${designId} usando editor interno`);
    
    const createdDesignIds = await separateFiguresFromDesignInternal(designId);
    
    res.json({
      success: true,
      message: `Se separaron ${createdDesignIds.length} figuras exitosamente usando el editor interno`,
      data: {
        originalDesignId: designId,
        createdDesignIds: createdDesignIds,
        count: createdDesignIds.length,
        mode: 'internal-simple',
        editorUsed: 'internal'
      }
    });
    
  } catch (error) {
    console.error('Error en API interna simple de separación:', error);
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
          description: 'Separa figuras con opciones personalizadas (editor normal)',
          body: {
            namePrefix: 'string (opcional) - Prefijo para nombres de diseños',
            optimizeCanvas: 'boolean (opcional) - Si optimizar canvas al tamaño de figura'
          }
        },
        'POST /separate-simple/:designId': {
          description: 'Separa figuras con configuración predeterminada (editor normal)',
          body: 'No requiere body'
        },
        'POST /separate-internal/:designId': {
          description: 'Separa figuras usando el editor interno (sin interfaz visible)',
          body: {
            namePrefix: 'string (opcional) - Prefijo para nombres de diseños',
            optimizeCanvas: 'boolean (opcional) - Si optimizar canvas al tamaño de figura'
          }
        },
        'POST /separate-internal-simple/:designId': {
          description: 'Separa figuras usando el editor interno con configuración predeterminada',
          body: 'No requiere body'
        }
      },
      features: [
        'Separación automática de todas las figuras de un diseño',
        'Optimización ultra-ajustada del canvas (2px padding)',
        'Centrado automático de figuras',
        'Registro automático en base de datos',
        'Nombres descriptivos automáticos',
        'Modo interno: procesamiento sin interfaz visible para el usuario'
      ],
      modes: {
        normal: 'Usa el editor normal con interfaz visible',
        internal: 'Usa el editor interno sin interfaz visible (recomendado para automatización)'
      }
    }
  });
});

module.exports = router;