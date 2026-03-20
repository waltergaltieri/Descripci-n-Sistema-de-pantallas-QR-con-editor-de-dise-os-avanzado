const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

/**
 * Funciones auxiliares para gestionar diseños internos
 * Los diseños internos son aquellos creados por el sistema para uso interno
 * y no deben ser visibles para el usuario final
 */

/**
 * Marca un diseño como interno
 * @param {number} designId - ID del diseño
 * @returns {Promise<boolean>} - true si se marcó exitosamente
 */
async function markDesignAsInternal(designId) {
  try {
    const db = await open({
      filename: path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    const result = await db.run(
      'UPDATE designs SET is_internal = 1 WHERE id = ?',
      [designId]
    );

    await db.close();
    
    return result.changes > 0;
  } catch (error) {
    console.error('Error marcando diseño como interno:', error);
    return false;
  }
}

/**
 * Marca un diseño como público (no interno)
 * @param {number} designId - ID del diseño
 * @returns {Promise<boolean>} - true si se marcó exitosamente
 */
async function markDesignAsPublic(designId) {
  try {
    const db = await open({
      filename: path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    const result = await db.run(
      'UPDATE designs SET is_internal = 0 WHERE id = ?',
      [designId]
    );

    await db.close();
    
    return result.changes > 0;
  } catch (error) {
    console.error('Error marcando diseño como público:', error);
    return false;
  }
}

/**
 * Verifica si un diseño es interno
 * @param {number} designId - ID del diseño
 * @returns {Promise<boolean>} - true si es interno
 */
async function isInternalDesign(designId) {
  try {
    const db = await open({
      filename: path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    const design = await db.get(
      'SELECT is_internal FROM designs WHERE id = ?',
      [designId]
    );

    await db.close();
    
    return design ? design.is_internal === 1 : false;
  } catch (error) {
    console.error('Error verificando si diseño es interno:', error);
    return false;
  }
}

/**
 * Obtiene todos los diseños internos
 * @returns {Promise<Array>} - Array de diseños internos
 */
async function getInternalDesigns() {
  try {
    const db = await open({
      filename: path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    const designs = await db.all(
      'SELECT * FROM designs WHERE is_internal = 1 ORDER BY created_at DESC'
    );

    await db.close();
    
    return designs;
  } catch (error) {
    console.error('Error obteniendo diseños internos:', error);
    return [];
  }
}

/**
 * Obtiene todos los diseños públicos (no internos)
 * @returns {Promise<Array>} - Array de diseños públicos
 */
async function getPublicDesigns() {
  try {
    const db = await open({
      filename: path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    const designs = await db.all(
      'SELECT * FROM designs WHERE is_internal = 0 OR is_internal IS NULL ORDER BY created_at DESC'
    );

    await db.close();
    
    return designs;
  } catch (error) {
    console.error('Error obteniendo diseños públicos:', error);
    return [];
  }
}

/**
 * Elimina todos los diseños internos
 * @returns {Promise<number>} - Número de diseños eliminados
 */
async function deleteAllInternalDesigns() {
  try {
    const db = await open({
      filename: path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    const result = await db.run(
      'DELETE FROM designs WHERE is_internal = 1'
    );

    await db.close();
    
    console.log(`🗑️ Eliminados ${result.changes} diseños internos`);
    return result.changes;
  } catch (error) {
    console.error('Error eliminando diseños internos:', error);
    return 0;
  }
}

/**
 * Cuenta el número de diseños internos
 * @returns {Promise<number>} - Número de diseños internos
 */
async function countInternalDesigns() {
  try {
    const db = await open({
      filename: path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    const result = await db.get(
      'SELECT COUNT(*) as count FROM designs WHERE is_internal = 1'
    );

    await db.close();
    
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error contando diseños internos:', error);
    return 0;
  }
}

/**
 * Cuenta el número de diseños públicos
 * @returns {Promise<number>} - Número de diseños públicos
 */
async function countPublicDesigns() {
  try {
    const db = await open({
      filename: path.join(__dirname, '../database.sqlite'),
      driver: sqlite3.Database
    });

    const result = await db.get(
      'SELECT COUNT(*) as count FROM designs WHERE is_internal = 0 OR is_internal IS NULL'
    );

    await db.close();
    
    return result ? result.count : 0;
  } catch (error) {
    console.error('Error contando diseños públicos:', error);
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