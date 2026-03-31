const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const konvaRenderer = require('../utils/konvaRenderer');
const autoSvgExporter = require('../utils/autoSvgExporter');
const {
  normalizeDesignContent,
  decorateDesignRecord,
  getPredefinedDesignTemplates
} = require('../utils/designContent');

const router = express.Router();

async function generateAndSaveHtml(designId, content, designName) {
  try {
    const normalizedContent = normalizeDesignContent(content);
    const html = await konvaRenderer.renderWithKonva(normalizedContent, designName, designId);

    await db().run(
      'UPDATE designs SET html_content = ? WHERE id = ?',
      [html, designId]
    );

    console.log(`HTML generado y guardado para diseño ID ${designId} (${html.length} caracteres)`);
    return { success: true, htmlLength: html.length };
  } catch (error) {
    console.error(`Error generando HTML para diseño ID ${designId}:`, error);
    return { success: false, error: error.message };
  }
}

async function getAssignedScreensMap() {
  const assignments = await db().all(`
    SELECT
      da.design_id,
      s.id,
      s.name
    FROM design_assignments da
    JOIN screens s ON s.id = da.screen_id
  `);

  return assignments.reduce((map, row) => {
    if (!map.has(row.design_id)) {
      map.set(row.design_id, []);
    }

    map.get(row.design_id).push({
      id: row.id,
      name: row.name
    });

    return map;
  }, new Map());
}

async function getAssignedScreensForDesign(designId) {
  return db().all(`
    SELECT
      s.id,
      s.name
    FROM design_assignments da
    JOIN screens s ON s.id = da.screen_id
    WHERE da.design_id = ?
  `, [designId]);
}

async function getDecoratedDesignById(designId) {
  const design = await db().get('SELECT * FROM designs WHERE id = ?', [designId]);

  if (!design) {
    return null;
  }

  const assignedScreens = await getAssignedScreensForDesign(designId);
  return decorateDesignRecord(design, assignedScreens);
}

const syncContentDimensions = (content) => normalizeDesignContent(content);

router.get('/', optionalAuth, async (req, res) => {
  try {
    const result = await db().all(`
      SELECT 
        d.*,
        COUNT(da.screen_id) as assigned_screens_count
      FROM designs d
      LEFT JOIN design_assignments da ON d.id = da.design_id
      WHERE d.is_internal = 0 OR d.is_internal IS NULL
      GROUP BY d.id
      ORDER BY d.updated_at DESC
    `);

    const assignmentsMap = await getAssignedScreensMap();
    const parsedResult = result.map((design) =>
      decorateDesignRecord(design, assignmentsMap.get(design.id) || [])
    );

    res.json(parsedResult);
  } catch (error) {
    console.error('Error al obtener diseños:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/all-including-internal', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await db().all(`
      SELECT 
        d.*,
        COUNT(da.screen_id) as assigned_screens_count
      FROM designs d
      LEFT JOIN design_assignments da ON d.id = da.design_id
      GROUP BY d.id
      ORDER BY d.updated_at DESC
    `);

    const assignmentsMap = await getAssignedScreensMap();
    const parsedResult = result.map((design) =>
      decorateDesignRecord(design, assignmentsMap.get(design.id) || [])
    );

    res.json(parsedResult);
  } catch (error) {
    console.error('Error al obtener todos los diseños:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/templates/predefined', async (req, res) => {
  try {
    res.json(getPredefinedDesignTemplates());
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const design = await getDecoratedDesignById(id);

    if (!design) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    res.json(design);
  } catch (error) {
    console.error('Error al obtener diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, content, thumbnail } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    if (!content) {
      return res.status(400).json({ error: 'El contenido del diseño es requerido' });
    }

    const syncedContent = syncContentDimensions(content);
    const result = await db().run(`
      INSERT INTO designs (name, description, content, thumbnail)
      VALUES (?, ?, ?, ?)
    `, [name, description, JSON.stringify(syncedContent), thumbnail]);

    const newDesign = await getDecoratedDesignById(result.lastID);

    if (newDesign?.content) {
      await generateAndSaveHtml(result.lastID, newDesign.content, newDesign.name);
    }

    const io = req.app.get('io');
    io.emit('designs-updated', { action: 'created', design: newDesign });

    res.status(201).json(newDesign);
  } catch (error) {
    console.error('Error al crear diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, content, thumbnail } = req.body;

    const syncedContent = content ? syncContentDimensions(content) : null;

    const result = await db().run(`
      UPDATE designs SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        content = COALESCE(?, content),
        thumbnail = COALESCE(?, thumbnail),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name,
      description,
      syncedContent ? JSON.stringify(syncedContent) : null,
      thumbnail,
      id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    const updatedDesign = await getDecoratedDesignById(id);

    if (syncedContent) {
      await generateAndSaveHtml(id, syncedContent, updatedDesign.name);
    }

    const io = req.app.get('io');
    io.emit('designs-updated', { action: 'updated', design: updatedDesign });

    res.json(updatedDesign);
  } catch (error) {
    console.error('Error al actualizar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const design = await db().get('SELECT * FROM designs WHERE id = ?', [id]);

    if (!design) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    if (!design.content) {
      return res.status(400).json({ error: 'El diseño no tiene contenido para publicar' });
    }

    const parsedContent = normalizeDesignContent(design.content);

    try {
      try {
        console.log(`Iniciando separación de figuras y exportación SVG para diseño ${id} antes de publicar...`);
        const svgExportResult = await autoSvgExporter.separateAndExportToSVG(id, {
          namePrefix: `${design.name} - Figura`,
          exportPrefix: `${design.name.toLowerCase().replace(/\s+/g, '-')}-figura`
        });

        if (svgExportResult.success && svgExportResult.statistics.successfulExports > 0) {
          console.log(`Separación y exportación SVG completada: ${svgExportResult.statistics.successfulExports} archivos SVG generados`);
        } else {
          console.log(`No se encontraron figuras o máscaras para separar en el diseño ${id}`);
        }
      } catch (separationError) {
        console.warn('Error en separación de figuras y exportación SVG (no crítico):', separationError.message);
      }

      const htmlResult = await generateAndSaveHtml(id, parsedContent, design.name);

      if (!htmlResult.success) {
        return res.status(500).json({ error: `Error generando HTML: ${htmlResult.error}` });
      }

      await db().run(
        'UPDATE designs SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      const updatedDesign = await getDecoratedDesignById(id);
      const io = req.app.get('io');

      io.emit('designs-updated', { action: 'published', design: updatedDesign });

      const assignedScreens = await db().all(
        'SELECT screen_id FROM design_assignments WHERE design_id = ?',
        [id]
      );

      const designWithHtml = await db().get(
        'SELECT html_content FROM designs WHERE id = ?',
        [id]
      );

      for (const row of assignedScreens) {
        await db().run(
          'UPDATE screens SET design_html = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [designWithHtml.html_content, row.screen_id]
        );

        io.to(`screen-${row.screen_id}`).emit('design-content-updated', {
          screenId: Number(row.screen_id),
          designId: Number(id),
          content: designWithHtml.html_content,
          isHtml: true
        });
      }

      console.log(`HTML actualizado en ${assignedScreens.length} pantallas asignadas`);

      res.json({
        success: true,
        message: 'Diseño publicado correctamente',
        design: updatedDesign,
        htmlLength: htmlResult.htmlLength
      });
    } catch (error) {
      console.error('Error en proceso de publicación:', error);
      res.status(500).json({ error: 'Error en el proceso de publicación' });
    }
  } catch (error) {
    console.error('Error al publicar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:id/duplicate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const original = await db().get('SELECT * FROM designs WHERE id = ?', [id]);

    if (!original) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    const duplicateName = name || `${original.name} (Copia)`;
    const duplicatedContent = JSON.stringify(normalizeDesignContent(original.content));

    const result = await db().run(`
      INSERT INTO designs (name, description, content, thumbnail)
      VALUES (?, ?, ?, ?)
    `, [
      duplicateName,
      original.description,
      duplicatedContent,
      original.thumbnail
    ]);

    const duplicatedDesign = await getDecoratedDesignById(result.lastID);

    const io = req.app.get('io');
    io.emit('designs-updated', { action: 'created', design: duplicatedDesign });

    res.status(201).json(duplicatedDesign);
  } catch (error) {
    console.error('Error al duplicar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const assignmentCheck = await db().get(
      'SELECT COUNT(*) as count FROM design_assignments WHERE design_id = ?',
      [id]
    );

    if (Number.parseInt(assignmentCheck.count, 10) > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el diseño porque está asignado a una o más pantallas'
      });
    }

    const result = await db().run(
      'DELETE FROM designs WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    const io = req.app.get('io');
    io.emit('designs-updated', { action: 'deleted', designId: Number(id) });

    res.json({ message: 'Diseño eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/from-template', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId, name, description } = req.body;

    if (!templateId || !name) {
      return res.status(400).json({ error: 'ID de plantilla y nombre son requeridos' });
    }

    const template = getPredefinedDesignTemplates().find((item) => item.id === templateId);

    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    const normalizedContent = normalizeDesignContent(template.content);
    const result = await db().run(`
      INSERT INTO designs (name, description, content, thumbnail)
      VALUES (?, ?, ?, ?)
    `, [name, description, JSON.stringify(normalizedContent), template.thumbnail]);

    const newDesign = await getDecoratedDesignById(result.lastID);

    const io = req.app.get('io');
    io.emit('designs-updated', { action: 'created', design: newDesign });

    res.status(201).json(newDesign);
  } catch (error) {
    console.error('Error al crear diseño desde plantilla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id/separated-svgs', async (req, res) => {
  try {
    const designId = parseInt(req.params.id, 10);

    if (Number.isNaN(designId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de diseño inválido'
      });
    }

    const design = await db().get(
      'SELECT id, name, separated_svgs FROM designs WHERE id = ?',
      [designId]
    );

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Diseño no encontrado'
      });
    }

    let svgs = [];
    if (design.separated_svgs) {
      try {
        svgs = JSON.parse(design.separated_svgs);
      } catch (parseError) {
        console.error('Error parseando SVGs:', parseError);
        svgs = [];
      }
    }

    res.json({
      success: true,
      designId: design.id,
      designName: design.name,
      svgs,
      count: svgs.length
    });
  } catch (error) {
    console.error('Error obteniendo SVGs separados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.get('/:id/separated-svgs/:svgIndex', async (req, res) => {
  try {
    const designId = parseInt(req.params.id, 10);
    const svgIndex = parseInt(req.params.svgIndex, 10);

    if (Number.isNaN(designId) || Number.isNaN(svgIndex)) {
      return res.status(400).json({
        success: false,
        message: 'ID de diseño o índice de SVG inválido'
      });
    }

    const design = await db().get(
      'SELECT id, name, separated_svgs FROM designs WHERE id = ?',
      [designId]
    );

    if (!design) {
      return res.status(404).json({
        success: false,
        message: 'Diseño no encontrado'
      });
    }

    let svgs = [];
    if (design.separated_svgs) {
      try {
        svgs = JSON.parse(design.separated_svgs);
      } catch (parseError) {
        return res.status(500).json({
          success: false,
          message: 'Error parseando SVGs guardados'
        });
      }
    }

    if (svgIndex < 0 || svgIndex >= svgs.length) {
      return res.status(404).json({
        success: false,
        message: 'Índice de SVG no encontrado'
      });
    }

    const svg = svgs[svgIndex];

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg.svgData);
  } catch (error) {
    console.error('Error obteniendo SVG específico:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
