const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Configurar directorio de uploads
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF, WebP, SVG)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB por defecto
  },
  fileFilter: fileFilter
});

// Subir una imagen
router.post('/image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }
    
    const { filename, originalname, mimetype, size, path: filePath } = req.file;
    const url = `/uploads/${filename}`;
    
    
      const result = await db().run(`
        INSERT INTO uploads (filename, original_name, mimetype, size, path, url)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [filename, originalname, mimetype, size, filePath, url]);
      
      const uploadRecord = await db().get(
        'SELECT * FROM uploads WHERE id = ?',
        [result.lastID]
      );
      
      res.status(201).json({
        id: uploadRecord.id,
        filename: uploadRecord.filename,
        originalName: uploadRecord.original_name,
        url: uploadRecord.url,
        size: uploadRecord.size,
        mimetype: uploadRecord.mimetype,
        uploadedAt: uploadRecord.created_at
      });
    
  } catch (error) {
    // Si hay error, eliminar el archivo subido
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error al subir imagen:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande' });
    }
    
    if (error.message.includes('Solo se permiten')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Subir múltiples imágenes
router.post('/images', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }
    
    
      const uploadedFiles = [];
      
      for (const file of req.files) {
        const { filename, originalname, mimetype, size, path: filePath } = file;
        const url = `/uploads/${filename}`;
        
        const result = await db().run(`
          INSERT INTO uploads (filename, original_name, mimetype, size, path, url)
          VALUES (?, ?, ?, ?, ?, ?)
          RETURNING *
        `, [filename, originalname, mimetype, size, filePath, url]);
        
        const uploadRecord = result;
        
        uploadedFiles.push({
          id: uploadRecord.id,
          filename: uploadRecord.filename,
          originalName: uploadRecord.original_name,
          url: uploadRecord.url,
          size: uploadRecord.size,
          mimetype: uploadRecord.mimetype,
          uploadedAt: uploadRecord.created_at
        });
      }
      
      res.status(201).json(uploadedFiles);
    
  } catch (error) {
    // Si hay error, eliminar los archivos subidos
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    console.error('Error al subir imágenes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener lista de archivos subidos
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;
    
    
      let query = `
        SELECT id, filename, original_name, mimetype, size, url, created_at
        FROM uploads
      `;
      let params = [];
      
      if (type) {
        query += ' WHERE mimetype LIKE ?';
        params.push(`${type}%`);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await db().run(query, params);
      
      // Obtener total de registros
      let countQuery = 'SELECT COUNT(*) FROM uploads';
      let countParams = [];
      
      if (type) {
        countQuery += ' WHERE mimetype LIKE ?';
        countParams.push(`${type}%`);
      }
      
      const countResult = await db().get(countQuery, countParams);
      const total = parseInt(countResult.count);
      
      res.json({
        files: result.map(row => ({
          id: row.id,
          filename: row.filename,
          originalName: row.original_name,
          url: row.url,
          size: row.size,
          mimetype: row.mimetype,
          uploadedAt: row.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    
  } catch (error) {
    console.error('Error al obtener archivos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar archivo
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    
      // Obtener información del archivo antes de eliminarlo
      const fileToDelete = await db().get(
        'SELECT * FROM uploads WHERE id = ?',
        [id]
      );
      
      if (!fileToDelete) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }
      
      const result = await db().run(
        'DELETE FROM uploads WHERE id = ?',
        [id]
      );
      
      // Eliminar archivo físico
      if (fs.existsSync(fileToDelete.path)) {
        fs.unlinkSync(fileToDelete.path);
      }
      
      res.json({ message: 'Archivo eliminado exitosamente' });
    
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener información de un archivo específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    
      const result = await db().run(
        'SELECT * FROM uploads WHERE id = ?',
        [id]
      );
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }
      
      const file = result;
      
      res.json({
        id: file.id,
        filename: file.filename,
        originalName: file.original_name,
        url: file.url,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: file.created_at
      });
    
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Middleware de manejo de errores específico para multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Demasiados archivos' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Campo de archivo inesperado' });
    }
  }
  
  if (error.message.includes('Solo se permiten')) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;