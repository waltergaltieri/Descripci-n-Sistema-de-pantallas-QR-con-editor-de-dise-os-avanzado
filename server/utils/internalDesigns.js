const { db } = require('../config/database');

async function markDesignAsInternal(designId) {
  try {
    const result = await db().run('UPDATE designs SET is_internal = 1 WHERE id = ?', [designId]);
    return result.changes > 0;
  } catch (error) {
    console.error('Error marcando diseno como interno:', error);
    return false;
  }
}

async function markDesignAsPublic(designId) {
  try {
    const result = await db().run('UPDATE designs SET is_internal = 0 WHERE id = ?', [designId]);
    return result.changes > 0;
  } catch (error) {
    console.error('Error marcando diseno como publico:', error);
    return false;
  }
}

async function isInternalDesign(designId) {
  try {
    const design = await db().get('SELECT is_internal FROM designs WHERE id = ?', [designId]);
    return design ? design.is_internal === 1 : false;
  } catch (error) {
    console.error('Error verificando si diseno es interno:', error);
    return false;
  }
}

async function getInternalDesigns() {
  try {
    return await db().all('SELECT * FROM designs WHERE is_internal = 1 ORDER BY created_at DESC');
  } catch (error) {
    console.error('Error obteniendo disenos internos:', error);
    return [];
  }
}

async function getPublicDesigns() {
  try {
    return await db().all(
      'SELECT * FROM designs WHERE is_internal = 0 OR is_internal IS NULL ORDER BY created_at DESC'
    );
  } catch (error) {
    console.error('Error obteniendo disenos publicos:', error);
    return [];
  }
}

async function deleteAllInternalDesigns() {
  try {
    const result = await db().run('DELETE FROM designs WHERE is_internal = 1');
    console.log(`Eliminados ${result.changes} disenos internos`);
    return result.changes;
  } catch (error) {
    console.error('Error eliminando disenos internos:', error);
    return 0;
  }
}

async function countInternalDesigns() {
  try {
    const result = await db().get('SELECT COUNT(*) as count FROM designs WHERE is_internal = 1');
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error contando disenos internos:', error);
    return 0;
  }
}

async function countPublicDesigns() {
  try {
    const result = await db().get(
      'SELECT COUNT(*) as count FROM designs WHERE is_internal = 0 OR is_internal IS NULL'
    );
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error contando disenos publicos:', error);
    return 0;
  }
}

module.exports = {
  markDesignAsInternal,
  markDesignAsPublic,
  isInternalDesign,
  getInternalDesigns,
  getPublicDesigns,
  deleteAllInternalDesigns,
  countInternalDesigns,
  countPublicDesigns
};
