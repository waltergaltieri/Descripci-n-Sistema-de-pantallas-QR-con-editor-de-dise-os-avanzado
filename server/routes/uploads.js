const express = require('express');
const multer = require('multer');

const { db } = require('../config/database');
const { createStorageProvider } = require('../config/storage');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const storageProvider = createStorageProvider();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test((file.originalname || '').toLowerCase().split('.').pop() || '');
  const mimetype = allowedTypes.test(file.mimetype || '');

  if (mimetype && extname) {
    return cb(null, true);
  }

  cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, GIF, WebP, SVG)'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024
  },
  fileFilter
});

const toApiUpload = (uploadRecord) => ({
  id: uploadRecord.id,
  filename: uploadRecord.filename,
  originalName: uploadRecord.original_name,
  url: uploadRecord.url,
  size: uploadRecord.size,
  mimetype: uploadRecord.mimetype,
  uploadedAt: uploadRecord.created_at
});

const safeDeleteStoredFiles = async (storedFiles) => {
  for (const storedFile of storedFiles) {
    try {
      await storageProvider.deleteFile(storedFile);
    } catch (cleanupError) {
      console.warn('No se pudo limpiar un archivo subido tras error:', cleanupError.message);
    }
  }
};

router.post('/image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  let storedFile = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporciono ningun archivo' });
    }

    storedFile = await storageProvider.saveFile(req.file);

    const result = await db().run(
      `
        INSERT INTO uploads (filename, original_name, mimetype, size, path, url)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        storedFile.filename,
        storedFile.original_name,
        storedFile.mimetype,
        storedFile.size,
        storedFile.path,
        storedFile.url
      ]
    );

    const uploadRecord = await db().get('SELECT * FROM uploads WHERE id = ?', [result.lastID]);

    res.status(201).json(toApiUpload(uploadRecord));
  } catch (error) {
    if (storedFile) {
      await safeDeleteStoredFiles([storedFile]);
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

router.post('/images', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  const storedFiles = [];
  let transactionStarted = false;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }

    await db().exec('BEGIN');
    transactionStarted = true;

    const uploadedFiles = [];

    for (const file of req.files) {
      const storedFile = await storageProvider.saveFile(file);
      storedFiles.push(storedFile);

      const result = await db().run(
        `
          INSERT INTO uploads (filename, original_name, mimetype, size, path, url)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          storedFile.filename,
          storedFile.original_name,
          storedFile.mimetype,
          storedFile.size,
          storedFile.path,
          storedFile.url
        ]
      );

      const uploadRecord = await db().get('SELECT * FROM uploads WHERE id = ?', [result.lastID]);
      uploadedFiles.push(toApiUpload(uploadRecord));
    }

    await db().exec('COMMIT');
    transactionStarted = false;

    res.status(201).json(uploadedFiles);
  } catch (error) {
    if (transactionStarted) {
      try {
        await db().exec('ROLLBACK');
      } catch (rollbackError) {
        console.warn('No se pudo revertir la transaccion de uploads:', rollbackError.message);
      }
    }

    await safeDeleteStoredFiles(storedFiles);

    console.error('Error al subir imagenes:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande' });
    }

    if (error.message.includes('Solo se permiten')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;
    const { type } = req.query;

    let query = `
      SELECT id, filename, original_name, mimetype, size, url, created_at
      FROM uploads
    `;
    const params = [];

    if (type) {
      query += ' WHERE mimetype LIKE ?';
      params.push(`${type}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const files = await db().all(query, params);

    let countQuery = 'SELECT COUNT(*) as count FROM uploads';
    const countParams = [];

    if (type) {
      countQuery += ' WHERE mimetype LIKE ?';
      countParams.push(`${type}%`);
    }

    const countResult = await db().get(countQuery, countParams);
    const total = parseInt(countResult.count, 10) || 0;

    res.json({
      files: files.map(toApiUpload),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener archivos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const fileToDelete = await db().get('SELECT * FROM uploads WHERE id = ?', [id]);

    if (!fileToDelete) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    await db().run('DELETE FROM uploads WHERE id = ?', [id]);

    try {
      await storageProvider.deleteFile(fileToDelete);
    } catch (cleanupError) {
      console.warn(`No se pudo eliminar el archivo fisico/storage ${id}:`, cleanupError.message);
    }

    res.json({ message: 'Archivo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await db().get('SELECT * FROM uploads WHERE id = ?', [id]);

    if (!file) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }

    res.json(toApiUpload(file));
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

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
