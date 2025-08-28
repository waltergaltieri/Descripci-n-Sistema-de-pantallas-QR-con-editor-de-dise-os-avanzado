const express = require('express');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const konvaRenderer = require('../utils/konvaRenderer');

const router = express.Router();

/**
 * Función helper para generar y guardar HTML en la base de datos
 * @param {number} designId - ID del diseño
 * @param {object} content - Contenido JSON del diseño
 * @param {string} designName - Nombre del diseño
 */
async function generateAndSaveHtml(designId, content, designName) {
    try {
        // Generar HTML usando konvaRenderer
        const html = konvaRenderer.renderWithKonva(content, designName);
        
        // Actualizar el campo html_content en la base de datos
        await db().run(
            'UPDATE designs SET html_content = ? WHERE id = ?',
            [html, designId]
        );
        
        console.log(`✅ HTML generado y guardado para diseño ID ${designId} (${html.length} caracteres)`);
        return { success: true, htmlLength: html.length };
        
    } catch (error) {
        console.error(`❌ Error generando HTML para diseño ID ${designId}:`, error);
        return { success: false, error: error.message };
    }
}

// Obtener todos los diseños
router.get('/', optionalAuth, async (req, res) => {
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
    
    // Parsear el contenido JSON para cada diseño
    const parsedResult = result.map(design => {
      if (design.content && typeof design.content === 'string') {
        try {
          design.content = JSON.parse(design.content);
        } catch (error) {
          console.error('Error parsing design content:', error);
          design.content = null;
        }
      }
      return design;
    });
      
      res.json(parsedResult);
  } catch (error) {
    console.error('Error al obtener diseños:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener un diseño específico por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener el diseño
    const design = await db().get(
      'SELECT * FROM designs WHERE id = ?',
      [id]
    );
    
    if (!design) {
      return res.status(404).json({ error: 'Diseño no encontrado' });
    }
    
    // Obtener pantallas asignadas
    const assignedScreens = await db().all(`
      SELECT s.id as screen_id, s.name as screen_name
      FROM design_assignments da
      JOIN screens s ON da.screen_id = s.id
      WHERE da.design_id = ?
    `, [id]);
    
    design.assigned_screens = assignedScreens;
    
    // Parsear el contenido JSON antes de devolver
      if (design.content && typeof design.content === 'string') {
        try {
          design.content = JSON.parse(design.content);
        } catch (error) {
          console.error('Error parsing design content:', error);
          design.content = null;
        }
      }
      
      res.json(design);
  } catch (error) {
    console.error('Error al obtener diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Función para sincronizar dimensiones del content con las páginas
const syncContentDimensions = (content) => {
  if (!content || typeof content !== 'object') {
    return content;
  }
  
  // Si hay páginas, usar las dimensiones de la primera página
  if (content.pages && content.pages.length > 0) {
    const firstPage = content.pages[0];
    if (firstPage.width && firstPage.height) {
      content.width = firstPage.width;
      content.height = firstPage.height;
      console.log(`✅ Dimensiones sincronizadas: ${firstPage.width}x${firstPage.height}`);
    }
  }
  
  return content;
};

// Crear nuevo diseño
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, content, thumbnail } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'El contenido del diseño es requerido' });
    }
    
    // Sincronizar dimensiones antes de guardar
    const syncedContent = syncContentDimensions(content);
    
    
      const result = await db().run(`
        INSERT INTO designs (name, description, content, thumbnail)
        VALUES (?, ?, ?, ?)
      `, [name, description, JSON.stringify(syncedContent), thumbnail]);
      
      const newDesign = await db().get(
        'SELECT * FROM designs WHERE id = ?',
        [result.lastID]
      );
      
      // Parsear el contenido JSON antes de devolver
      if (newDesign.content && typeof newDesign.content === 'string') {
        try {
          newDesign.content = JSON.parse(newDesign.content);
        } catch (error) {
          console.error('Error parsing design content:', error);
          newDesign.content = null;
        }
      }
      
      // Generar y guardar HTML automáticamente
      if (newDesign.content) {
        await generateAndSaveHtml(result.lastID, newDesign.content, newDesign.name);
      }
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.emit('designs-updated', { action: 'created', design: newDesign });
      
      res.status(201).json(newDesign);
    
  } catch (error) {
    console.error('Error al crear diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar diseño
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, content, thumbnail } = req.body;
    
    // Sincronizar dimensiones si se está actualizando el contenido
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
      
      const updatedDesign = await db().get(
        'SELECT * FROM designs WHERE id = ?',
        [id]
      );
      
      // Generar y guardar HTML automáticamente si se actualizó el contenido
      if (syncedContent && updatedDesign.content) {
        try {
          const parsedContent = typeof updatedDesign.content === 'string' 
            ? JSON.parse(updatedDesign.content) 
            : updatedDesign.content;
          await generateAndSaveHtml(id, parsedContent, updatedDesign.name);
        } catch (error) {
          console.error('Error generando HTML en actualización:', error);
        }
      }
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.emit('designs-updated', { action: 'updated', design: updatedDesign });
      
      // Notificar a las pantallas que usan este diseño
      const assignedScreens = await db().all(
        'SELECT screen_id FROM design_assignments WHERE design_id = ?',
        [id]
      );
      
      assignedScreens.forEach(row => {
        io.to(`screen-${row.screen_id}`).emit('design-content-updated', {
          designId: id,
          content: updatedDesign.content
        });
      });
      
      res.json(updatedDesign);
    
  } catch (error) {
    console.error('Error al actualizar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Duplicar diseño
router.post('/:id/duplicate', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    
      // Obtener el diseño original
      const originalResult = await db().run(
        'SELECT * FROM designs WHERE id = ?',
        [id]
      );
      
      if (!originalResult) {
        return res.status(404).json({ error: 'Diseño no encontrado' });
      }
      
      const original = originalResult;
      const duplicateName = name || `${original.name} (Copia)`;
      
      // Crear el duplicado
      const result = await db().run(`
        INSERT INTO designs (name, description, content, thumbnail)
        VALUES (?, ?, ?, ?)
        RETURNING *
      `, [
        duplicateName,
        original.description,
        original.content,
        original.thumbnail
      ]);
      
      const duplicatedDesign = result;
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.emit('designs-updated', { action: 'created', design: duplicatedDesign });
      
      res.status(201).json(duplicatedDesign);
    
  } catch (error) {
    console.error('Error al duplicar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar diseño
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    
      // Verificar si el diseño está asignado a alguna pantalla
      const assignmentCheck = await db().get(
        'SELECT COUNT(*) as count FROM design_assignments WHERE design_id = ?',
        [id]
      );
      
      if (parseInt(assignmentCheck.count) > 0) {
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
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.emit('designs-updated', { action: 'deleted', designId: id });
      
      res.json({ message: 'Diseño eliminado exitosamente' });
    
  } catch (error) {
    console.error('Error al eliminar diseño:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener plantillas predefinidas
router.get('/templates/predefined', async (req, res) => {
  try {
    const templates = [
      {
        id: 'template-welcome',
        name: 'Plantilla de Bienvenida',
        description: 'Diseño simple con título y texto de bienvenida',
        thumbnail: null,
        content: {
          sections: [
            {
              id: 'section-1',
              type: 'section',
              columns: 1,
              backgroundColor: '#ffffff',
              padding: '40px',
              elements: [
                {
                  id: 'element-1',
                  type: 'text',
                  content: 'Bienvenido',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#2563eb',
                  textAlign: 'center',
                  marginBottom: '20px'
                },
                {
                  id: 'element-2',
                  type: 'text',
                  content: 'Este es un mensaje de bienvenida personalizable',
                  fontSize: '24px',
                  color: '#64748b',
                  textAlign: 'center'
                }
              ]
            }
          ]
        }
      },
      {
        id: 'template-info',
        name: 'Plantilla Informativa',
        description: 'Diseño con dos columnas para información',
        thumbnail: null,
        content: {
          sections: [
            {
              id: 'section-1',
              type: 'section',
              columns: 2,
              backgroundColor: '#f8fafc',
              padding: '30px',
              elements: [
                {
                  id: 'element-1',
                  type: 'text',
                  content: 'Información Principal',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '15px',
                  column: 1
                },
                {
                  id: 'element-2',
                  type: 'text',
                  content: 'Aquí puedes agregar información detallada sobre tu contenido.',
                  fontSize: '18px',
                  color: '#475569',
                  column: 1
                },
                {
                  id: 'element-3',
                  type: 'text',
                  content: 'Información Secundaria',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '15px',
                  column: 2
                },
                {
                  id: 'element-4',
                  type: 'text',
                  content: 'Contenido adicional en la segunda columna.',
                  fontSize: '18px',
                  color: '#475569',
                  column: 2
                }
              ]
            }
          ]
        }
      }
    ];
    
    res.json(templates);
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear diseño desde plantilla
router.post('/from-template', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { templateId, name, description } = req.body;
    
    if (!templateId || !name) {
      return res.status(400).json({ error: 'ID de plantilla y nombre son requeridos' });
    }
    
    // Obtener plantillas predefinidas
    const templatesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/designs/templates/predefined`);
    const templates = await templatesResponse.json();
    
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    
    
      const result = await db().run(`
        INSERT INTO designs (name, description, content, thumbnail)
        VALUES (?, ?, ?, ?)
      `, [name, description, JSON.stringify(template.content), template.thumbnail]);
      
      const newDesign = await db().get(
        'SELECT * FROM designs WHERE id = ?',
        [result.lastID]
      );
      
      // Emitir evento de actualización
      const io = req.app.get('io');
      io.emit('designs-updated', { action: 'created', design: newDesign });
      
      res.status(201).json(newDesign);
    
  } catch (error) {
    console.error('Error al crear diseño desde plantilla:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;