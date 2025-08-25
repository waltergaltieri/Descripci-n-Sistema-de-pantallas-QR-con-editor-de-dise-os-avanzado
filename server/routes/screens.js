const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Obtener todas las pantallas
router.get('/', optionalAuth, async (req, res) => {
  try {
    // Si el usuario está autenticado y es admin, mostrar todas las pantallas
    // Si no, mostrar solo las activas (para visualización pública)
    if (req.user && req.user.role === 'admin') {
      const result = await db().all(`
        SELECT 
          s.*,
          d.id as design_id,
          d.name as design_name,
          d.content as design_content,
          d.html_content as design_html
        FROM screens s
        LEFT JOIN design_assignments da ON s.id = da.screen_id
        LEFT JOIN designs d ON da.design_id = d.id
        ORDER BY s.display_order ASC, s.created_at ASC
      `);
      
      res.json(result);
    } else {
      const result = await db().all(`
        SELECT 
          s.*,
          d.id as design_id,
          d.name as design_name,
          d.content as design_content,
          d.html_content as design_html
        FROM screens s
        LEFT JOIN design_assignments da ON s.id = da.screen_id
        LEFT JOIN designs d ON da.design_id = d.id
        WHERE s.is_active = true
        ORDER BY s.display_order ASC, s.created_at ASC
      `);
      
      res.json(result);
    }
    
  } catch (error) {
    console.error('Error al obtener pantallas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una pantalla específica por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    
      const result = await db().get(`
      SELECT 
        s.*,
        d.id as design_id,
        d.name as design_name,
        d.content as design_content,
        d.html_content as design_html,
        d.updated_at as design_updated_at
      FROM screens s
      LEFT JOIN design_assignments da ON s.id = da.screen_id
      LEFT JOIN designs d ON da.design_id = d.id
      WHERE s.id = ?
    `, [id]);
    
    if (!result) {
      return res.status(404).json({ error: 'Pantalla no encontrada' });
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Error al obtener pantalla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva pantalla (requiere autenticación)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, refresh_interval = 30, width = 1920, height = 1080 } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    
      // Obtener el siguiente orden de visualización
      const orderResult = await db().get(
        'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM screens'
      );
      const nextOrder = orderResult.next_order;
      
      const result = await db().run(`
        INSERT INTO screens (name, description, display_order, refresh_interval, width, height)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [name, description, nextOrder, refresh_interval, width, height]);
      
      const newScreen = await db().get(
        'SELECT * FROM screens WHERE id = ?',
        [result.lastID]
      );
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.emit('screens-updated', { action: 'created', screen: newScreen });
      
      res.status(201).json(newScreen);
    
  } catch (error) {
    console.error('Error al crear pantalla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar pantalla
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active, refresh_interval, width, height } = req.body;
    
    
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
      
      const updatedScreen = await db().get(
        'SELECT * FROM screens WHERE id = ?',
        [id]
      );
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.emit('screens-updated', { action: 'updated', screen: updatedScreen });
      io.to(`screen-${id}`).emit('screen-config-updated', updatedScreen);
      
      res.json(updatedScreen);
    
  } catch (error) {
    console.error('Error al actualizar pantalla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar pantalla
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
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.emit('screens-updated', { action: 'deleted', screenId: id });
      
      res.json({ message: 'Pantalla eliminada exitosamente' });
    
  } catch (error) {
    console.error('Error al eliminar pantalla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar orden de pantallas
router.post('/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { screenIds } = req.body;
    
    if (!Array.isArray(screenIds)) {
      return res.status(400).json({ error: 'Se requiere un array de IDs de pantallas' });
    }
    
    // Actualizar el orden de cada pantalla
    for (let i = 0; i < screenIds.length; i++) {
      await db().run(
        'UPDATE screens SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [i + 1, screenIds[i]]
      );
    }
    
    // Emitir evento de actualización
    const io = req.app.get('io');
    io.emit('screens-updated', { action: 'reordered', screenIds });
    
    res.json({ message: 'Orden actualizado exitosamente' });
    
  } catch (error) {
    console.error('Error al reordenar pantallas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Asignar diseño a pantalla
router.post('/:id/assign-design', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { designId } = req.body;
    
    if (!designId) {
      return res.status(400).json({ error: 'ID del diseño es requerido' });
    }
    
    // Verificar que la pantalla y el diseño existen
    const screenCheck = await db().get('SELECT id FROM screens WHERE id = ?', [id]);
    const designCheck = await db().get('SELECT id FROM designs WHERE id = ?', [designId]);
    
    if (!screenCheck) {
      return res.status(404).json({ error: 'Pantalla no encontrada' });
    }
    
    if (!designCheck) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }
    
    // Eliminar asignación anterior si existe
    await db().run('DELETE FROM design_assignments WHERE screen_id = ?', [id]);
    
    // Crear nueva asignación
    await db().run(
      'INSERT INTO design_assignments (screen_id, design_id) VALUES (?, ?)',
      [id, designId]
    );
    
    // Emitir evento de actualización a la pantalla específica
    const io = req.app.get('io');
    io.to(`screen-${id}`).emit('design-updated', { screenId: id, designId });
    io.emit('screens-updated', { action: 'design-assigned', screenId: id, designId });
    
    res.json({ message: 'Diseño asignado exitosamente' });
    
  } catch (error) {
    console.error('Error al asignar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Remover diseño de pantalla
router.delete('/:id/remove-design', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    
      const result = await db().run(
        'DELETE FROM design_assignments WHERE screen_id = ? RETURNING *',
        [id]
      );
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.to(`screen-${id}`).emit('design-removed', { screenId: id });
      io.emit('screens-updated', { action: 'design-removed', screenId: id });
      
      res.json({ message: 'Diseño removido exitosamente' });
    
  } catch (error) {
    console.error('Error al remover diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;