const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');

// Configuración de la conexión a SQLite
let db;

async function initializeDatabase() {
  db = await open({
    filename: path.join(__dirname, '..', 'database.sqlite'),
    driver: sqlite3.Database
  });
  
  // Habilitar foreign keys
  await db.exec('PRAGMA foreign_keys = ON');
  
  return db;
}

// Función para crear las tablas necesarias
async function createTables() {
  try {
    // Tabla de usuarios (admin)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabla de diseños
    await db.exec(`
      CREATE TABLE IF NOT EXISTS designs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        thumbnail TEXT,
        is_internal INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Migración: Agregar campo is_internal si no existe
    try {
      await db.exec(`ALTER TABLE designs ADD COLUMN is_internal INTEGER DEFAULT 0`);
      console.log('✅ Campo is_internal agregado a la tabla designs');
    } catch (error) {
      // El campo ya existe, ignorar error
      if (!error.message.includes('duplicate column name')) {
        console.log('ℹ️ Campo is_internal ya existe en la tabla designs');
      }
    }

    // Migración: Agregar campo separated_svgs para almacenar SVGs generados
    try {
      await db.exec(`ALTER TABLE designs ADD COLUMN separated_svgs TEXT`);
      console.log('✅ Campo separated_svgs agregado a la tabla designs');
    } catch (error) {
      // El campo ya existe, ignorar error
      if (!error.message.includes('duplicate column name')) {
        console.log('ℹ️ Campo separated_svgs ya existe en la tabla designs');
      }
    }
    
    // Tabla de pantallas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS screens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        refresh_interval INTEGER DEFAULT 30,
        width INTEGER DEFAULT 1920,
        height INTEGER DEFAULT 1080,
        design_html TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migración: Agregar campos width, height y design_html si no existen
    try {
      await db.exec(`ALTER TABLE screens ADD COLUMN width INTEGER DEFAULT 1920`);
      console.log('✅ Campo width agregado a la tabla screens');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('ℹ️ Campo width ya existe en la tabla screens');
      }
    }

    try {
      await db.exec(`ALTER TABLE screens ADD COLUMN height INTEGER DEFAULT 1080`);
      console.log('✅ Campo height agregado a la tabla screens');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('ℹ️ Campo height ya existe en la tabla screens');
      }
    }

    try {
      await db.exec(`ALTER TABLE screens ADD COLUMN design_html TEXT`);
      console.log('✅ Campo design_html agregado a la tabla screens');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('ℹ️ Campo design_html ya existe en la tabla screens');
      }
    }
    
    // Tabla de asignaciones diseño-pantalla
    await db.exec(`
      CREATE TABLE IF NOT EXISTS design_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        screen_id INTEGER REFERENCES screens(id) ON DELETE CASCADE,
        design_id INTEGER REFERENCES designs(id) ON DELETE CASCADE,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(screen_id)
      )
    `);
    
    // Tabla de archivos subidos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        size INTEGER NOT NULL,
        path TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Tablas creadas correctamente');
  } catch (error) {
    console.error('Error al crear tablas:', error);
    throw error;
  }
}

// Función para crear el usuario administrador por defecto
async function createDefaultAdmin() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Verificar si ya existe un admin
    const existingAdmin = await db.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [username, hashedPassword, 'admin']
      );
      
      console.log(`Usuario administrador creado: ${username}`);
    } else {
      console.log('Usuario administrador ya existe');
    }
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
    throw error;
  }
}

// Función para crear diseños de ejemplo
async function createSampleDesigns() {
  try {
    const existingDesigns = await db.get('SELECT COUNT(*) as count FROM designs');
    
    if (parseInt(existingDesigns.count) === 0) {
      const sampleDesign = {
        sections: [
          {
            id: 'section-1',
            type: 'section',
            columns: 1,
            backgroundColor: '#ffffff',
            padding: '20px',
            elements: [
              {
                id: 'element-1',
                type: 'text',
                content: 'Bienvenido al Sistema de Pantallas',
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#333333',
                textAlign: 'center',
                marginBottom: '20px'
              },
              {
                id: 'element-2',
                type: 'text',
                content: 'Este es un diseño de ejemplo. Puedes editarlo desde el panel de administración.',
                fontSize: '18px',
                color: '#666666',
                textAlign: 'center'
              }
            ]
          }
        ]
      };
      
      await db.run(
        'INSERT INTO designs (name, description, content) VALUES (?, ?, ?)',
        ['Diseño de Bienvenida', 'Diseño de ejemplo para nuevas pantallas', JSON.stringify(sampleDesign)]
      );
      
      console.log('Diseño de ejemplo creado');
    }
  } catch (error) {
    console.error('Error al crear diseños de ejemplo:', error);
  }
}

// Función principal de inicialización
async function initialize() {
  try {
    // Inicializar base de datos SQLite
    await initializeDatabase();
    console.log('Conexión a SQLite establecida');
    
    // Crear tablas
    await createTables();
    
    // Crear usuario administrador
    await createDefaultAdmin();
    
    // Crear diseños de ejemplo
    await createSampleDesigns();
    
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  }
}

// Función para cerrar la conexión
async function close() {
  if (db) {
    await db.close();
  }
}

module.exports = {
  db: () => db,
  initialize,
  close
};