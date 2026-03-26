const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const konvaRenderer = require('../utils/konvaRenderer');
const { normalizeDesignContent } = require('../utils/designContent');

const router = express.Router();

const normalizeFlagForDatabase = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
      return 1;
    }

    if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
      return 0;
    }
  }

  return Number(Boolean(value));
};

const normalizeFlagForResponse = (value) => {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
      return true;
    }

    if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
      return false;
    }
  }

  return Boolean(Number(value));
};

const serializeScreen = (screen) => {
  if (!screen) {
    return screen;
  }

  return {
    ...screen,
    is_active: normalizeFlagForResponse(screen.is_active)
  };
};

const serializeScreens = (screens = []) => screens.map(serializeScreen);

const normalizeScreenPayload = (payload = {}) => {
  const isActiveValue = payload.is_active ?? payload.active;

  return {
    name: payload.name,
    description: payload.description,
    is_active:
      isActiveValue === undefined || isActiveValue === null
        ? null
        : normalizeFlagForDatabase(isActiveValue),
    refresh_interval: payload.refresh_interval ?? null,
    width: payload.width ?? null,
    height: payload.height ?? null
  };
};

router.get('/', optionalAuth, async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';
    const query = `
      SELECT 
        s.*,
        d.id as design_id,
        d.name as design_name,
        s.design_html as design_content
      FROM screens s
      LEFT JOIN design_assignments da ON s.id = da.screen_id
      LEFT JOIN designs d ON da.design_id = d.id
      ${isAdmin ? '' : 'WHERE s.is_active = 1'}
      ORDER BY s.display_order ASC, s.created_at ASC
    `;

    const result = await db().all(query);
    res.json(serializeScreens(result));
  } catch (error) {
    console.error('Error al obtener pantallas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db().get(`
      SELECT 
        s.*,
        d.id as design_id,
        d.name as design_name,
        s.design_html as design_content,
        d.updated_at as design_updated_at
      FROM screens s
      LEFT JOIN design_assignments da ON s.id = da.screen_id
      LEFT JOIN designs d ON da.design_id = d.id
      WHERE s.id = ?
    `, [id]);

    if (!result) {
      return res.status(404).json({ error: 'Pantalla no encontrada' });
    }

    res.json(serializeScreen(result));
  } catch (error) {
    console.error('Error al obtener pantalla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      is_active,
      refresh_interval = 30,
      width = 1920,
      height = 1080
    } = normalizeScreenPayload(req.body);

    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const orderResult = await db().get(
      'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM screens'
    );

    const result = await db().run(`
      INSERT INTO screens (name, description, display_order, is_active, refresh_interval, width, height)
      VALUES (?, ?, ?, COALESCE(?, 1), ?, ?, ?)
    `, [name, description, orderResult.next_order, is_active, refresh_interval, width, height]);

    const newScreen = await db().get('SELECT * FROM screens WHERE id = ?', [result.lastID]);
    const serializedScreen = serializeScreen(newScreen);

    const io = req.app.get('io');
    io.emit('screens-updated', { action: 'created', screen: serializedScreen });

    res.status(201).json(serializedScreen);
  } catch (error) {
    console.error('Error al crear pantalla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      is_active,
      refresh_interval,
      width,
      height
    } = normalizeScreenPayload(req.body);

    const result = await db().run(`
      UPDATE screens 
      SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active),
        refresh_interval = COALESCE(?, refresh_interval),
        width = COALESCE(?, width),
        height = COALESCE(?, height),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, description, is_active, refresh_interval, width, height, id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pantalla no encontrada' });
    }

    const updatedScreen = await db().get('SELECT * FROM screens WHERE id = ?', [id]);
    const serializedScreen = serializeScreen(updatedScreen);
    const io = req.app.get('io');

    io.emit('screens-updated', { action: 'updated', screen: serializedScreen });
    io.to(`screen-${id}`).emit('screen-config-updated', {
      screenId: Number(id),
      screen: serializedScreen
    });

    res.json(serializedScreen);
  } catch (error) {
    console.error('Error al actualizar pantalla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db().run(
      'DELETE FROM screens WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pantalla no encontrada' });
    }

    const io = req.app.get('io');
    io.emit('screens-updated', { action: 'deleted', screenId: Number(id) });

    res.json({ message: 'Pantalla eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pantalla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { screenIds } = req.body;

    if (!Array.isArray(screenIds)) {
      return res.status(400).json({ error: 'Se requiere un array de IDs de pantallas' });
    }

    for (let i = 0; i < screenIds.length; i += 1) {
      await db().run(
        'UPDATE screens SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [i + 1, screenIds[i]]
      );
    }

    const io = req.app.get('io');
    io.emit('screens-updated', { action: 'reordered', screenIds });

    res.json({ message: 'Orden actualizado exitosamente' });
  } catch (error) {
    console.error('Error al reordenar pantallas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:id/assign-design', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { designId } = req.body;

    if (!designId) {
      return res.status(400).json({ error: 'ID del diseño es requerido' });
    }

    const screenCheck = await db().get('SELECT id FROM screens WHERE id = ?', [id]);
    const design = await db().get('SELECT * FROM designs WHERE id = ?', [designId]);

    if (!screenCheck) {
      return res.status(404).json({ error: 'Pantalla no encontrada' });
    }

    if (!design) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }

    let designHtml = null;

    try {
      const designContent = normalizeDesignContent(design.content);
      designHtml = await konvaRenderer.renderWithKonva(designContent, design.name, designId);
      console.log(`HTML generado para diseño ${design.name} (${designHtml.length} caracteres)`);
    } catch (error) {
      console.error('Error generando HTML del diseño:', error);
      return res.status(500).json({ error: 'Error generando HTML del diseño' });
    }

    await db().run('DELETE FROM design_assignments WHERE screen_id = ?', [id]);
    await db().run(
      'INSERT INTO design_assignments (screen_id, design_id) VALUES (?, ?)',
      [id, designId]
    );
    await db().run(
      'UPDATE screens SET design_html = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [designHtml, id]
    );

    const io = req.app.get('io');
    io.to(`screen-${id}`).emit('design-updated', {
      screenId: Number(id),
      designId: Number(designId),
      html: designHtml
    });
    io.to(`screen-${id}`).emit('design-content-updated', {
      screenId: Number(id),
      designId: Number(designId),
      content: designHtml,
      isHtml: true
    });
    io.emit('screens-updated', {
      action: 'design-assigned',
      screenId: Number(id),
      designId: Number(designId)
    });

    res.json({ message: 'Diseño asignado exitosamente', htmlGenerated: true });
  } catch (error) {
    console.error('Error al asignar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id/remove-design', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await db().run(
      'DELETE FROM design_assignments WHERE screen_id = ?',
      [id]
    );
    await db().run(
      'UPDATE screens SET design_html = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    const io = req.app.get('io');
    io.to(`screen-${id}`).emit('design-removed', { screenId: Number(id) });
    io.emit('screens-updated', { action: 'design-removed', screenId: Number(id) });

    res.json({ message: 'Diseño removido exitosamente' });
  } catch (error) {
    console.error('Error al remover diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
