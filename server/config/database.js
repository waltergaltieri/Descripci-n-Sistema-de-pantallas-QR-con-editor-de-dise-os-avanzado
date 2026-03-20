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

    // Perfil del negocio (una instalación por local, preparado para futuro SaaS)
    await db.exec(`
      CREATE TABLE IF NOT EXISTS business_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL DEFAULT 'Mi Local',
        legal_name TEXT,
        description TEXT,
        logo_upload_id INTEGER REFERENCES uploads(id) ON DELETE SET NULL,
        timezone TEXT NOT NULL DEFAULT 'America/Buenos_Aires',
        currency_code TEXT NOT NULL DEFAULT 'ARS',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Categorías de productos del módulo de cartelería
    await db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Productos del catálogo
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price_cents INTEGER NOT NULL DEFAULT 0 CHECK(price_cents >= 0),
        currency_code TEXT NOT NULL DEFAULT 'ARS',
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'sold_out')),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        primary_image_upload_id INTEGER REFERENCES uploads(id) ON DELETE SET NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Galería adicional de imágenes por producto
    await db.exec(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        upload_id INTEGER NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        alt_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Promociones aplicadas a productos
    await db.exec(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(
          type IN (
            'percentage_discount',
            'two_for_one',
            'second_unit_percentage',
            'free_with_other_product',
            'free_with_minimum_spend',
            'discount_with_minimum_spend'
          )
        ),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'expired')),
        target_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        target_combo_id INTEGER REFERENCES combos(id) ON DELETE SET NULL,
        trigger_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        discount_percentage REAL,
        minimum_spend_cents INTEGER,
        description TEXT,
        conditions_text TEXT,
        has_countdown INTEGER DEFAULT 0,
        starts_at DATETIME,
        ends_at DATETIME,
        no_expiration INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await db.exec(`ALTER TABLE promotions ADD COLUMN target_combo_id INTEGER REFERENCES combos(id) ON DELETE SET NULL`);
      console.log('Campo target_combo_id agregado a la tabla promotions');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Campo target_combo_id ya existe en la tabla promotions');
      }
    }

    // Combos del módulo de cartelería
    await db.exec(`
      CREATE TABLE IF NOT EXISTS combos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        conditions_text TEXT,
        combo_price_cents INTEGER NOT NULL DEFAULT 0 CHECK(combo_price_cents >= 0),
        currency_code TEXT NOT NULL DEFAULT 'ARS',
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused', 'expired')),
        image_upload_id INTEGER REFERENCES uploads(id) ON DELETE SET NULL,
        starts_at DATETIME,
        ends_at DATETIME,
        no_expiration INTEGER DEFAULT 0,
        has_countdown INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await db.exec(`ALTER TABLE combos ADD COLUMN has_countdown INTEGER DEFAULT 0`);
      console.log('Campo has_countdown agregado a la tabla combos');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Campo has_countdown ya existe en la tabla combos');
      }
    }

    await db.exec(`
      CREATE TABLE IF NOT EXISTS combo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combo_id INTEGER NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(combo_id, product_id)
      )
    `);

    try {
      await db.exec(`ALTER TABLE promotions ADD COLUMN target_combo_id INTEGER REFERENCES combos(id) ON DELETE SET NULL`);
      console.log('Campo target_combo_id agregado a la tabla promotions');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        console.log('Campo target_combo_id ya existe en la tabla promotions');
      }
    }

    // Menús publicados en web
    await db.exec(`
      CREATE TABLE IF NOT EXISTS menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        local_name TEXT,
        slug TEXT UNIQUE,
        logo_upload_id INTEGER REFERENCES uploads(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'paused')),
        theme_key TEXT NOT NULL DEFAULT 'style-1',
        settings TEXT NOT NULL DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS menu_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        block_type TEXT NOT NULL CHECK(
          block_type IN ('header', 'product', 'category', 'promotion', 'combo', 'separator')
        ),
        title TEXT,
        content TEXT,
        background_type TEXT,
        background_value TEXT,
        text_color TEXT,
        sort_order INTEGER DEFAULT 0,
        config TEXT NOT NULL DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS combo_menu_visibility (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combo_id INTEGER NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
        menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(combo_id, menu_id)
      )
    `);

    // Links persistentes y su configuración QR
    await db.exec(`
      CREATE TABLE IF NOT EXISTS persistent_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        slug TEXT NOT NULL UNIQUE,
        default_menu_id INTEGER REFERENCES menus(id) ON DELETE SET NULL,
        manual_menu_id INTEGER REFERENCES menus(id) ON DELETE SET NULL,
        manual_override_active INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'paused')),
        qr_config TEXT NOT NULL DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS link_schedule_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        persistent_link_id INTEGER NOT NULL REFERENCES persistent_links(id) ON DELETE CASCADE,
        menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        rule_name TEXT,
        days_of_week TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        starts_on DATE,
        ends_on DATE,
        priority INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Métricas básicas de visualización de menús
    await db.exec(`
      CREATE TABLE IF NOT EXISTS menu_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        menu_id INTEGER REFERENCES menus(id) ON DELETE SET NULL,
        persistent_link_id INTEGER REFERENCES persistent_links(id) ON DELETE SET NULL,
        resolved_source TEXT,
        user_agent TEXT,
        device_type TEXT,
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Índices del módulo de cartelería
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_categories_active_order
      ON categories(is_active, sort_order, name)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_status_category
      ON products(status, category_id)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_product_images_product
      ON product_images(product_id, sort_order)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_promotions_status_target
      ON promotions(status, target_product_id)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_combos_status
      ON combos(status)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_menus_status
      ON menus(status)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_menu_blocks_menu_order
      ON menu_blocks(menu_id, sort_order)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_persistent_links_status
      ON persistent_links(status)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_link_schedule_rules_link
      ON link_schedule_rules(persistent_link_id, is_active, start_time, end_time)
    `);
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_menu_views_requested_at
      ON menu_views(requested_at DESC)
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

async function ensureBusinessProfile() {
  try {
    const existingProfile = await db.get('SELECT id FROM business_profile LIMIT 1');

    if (!existingProfile) {
      await db.run(
        `
          INSERT INTO business_profile (name, description, timezone, currency_code)
          VALUES (?, ?, ?, ?)
        `,
        [
          process.env.BUSINESS_NAME || 'Mi Local',
          'Perfil inicial para el módulo de cartelería digital',
          process.env.BUSINESS_TIMEZONE || 'America/Buenos_Aires',
          process.env.BUSINESS_CURRENCY || 'ARS'
        ]
      );

      console.log('Perfil de negocio inicial creado');
    }
  } catch (error) {
    console.error('Error al inicializar perfil de negocio:', error);
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

    // Crear perfil inicial del negocio
    await ensureBusinessProfile();
    
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
