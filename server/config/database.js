const path = require('node:path');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { Pool } = require('pg');

const { getDatabaseProviderConfig } = require('./databaseProviderConfig');
const { getPostgresSchemaStatements } = require('./postgresSchema');
const {
  createPostgresAdapter,
  runWithDatabaseContext: runWithPostgresDatabaseContext
} = require('./postgresAdapter');

let databaseConnection = null;
let databaseProviderConfig = null;
let databaseContextRunner = async (callback) => callback();

async function initializeDatabaseConnection() {
  databaseProviderConfig = getDatabaseProviderConfig();

  if (databaseProviderConfig.provider === 'postgres') {
    if (!databaseProviderConfig.databaseUrl) {
      throw new Error('DATABASE_URL o SUPABASE_DB_URL es requerido para Postgres/Supabase');
    }

    const pool = new Pool({
      connectionString: databaseProviderConfig.databaseUrl,
      ssl: databaseProviderConfig.ssl ? { rejectUnauthorized: false } : false
    });

    databaseConnection = createPostgresAdapter({ pool });
    databaseContextRunner = runWithPostgresDatabaseContext;
    await databaseConnection.query('SELECT 1');
    return databaseConnection;
  }

  databaseConnection = await open({
    filename: databaseProviderConfig.sqlitePath,
    driver: sqlite3.Database
  });

  await databaseConnection.exec('PRAGMA foreign_keys = ON');
  databaseContextRunner = async (callback) => callback();

  return databaseConnection;
}

async function ensureSqliteTables() {
  try {
    await databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS designs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        thumbnail TEXT,
        is_internal INTEGER DEFAULT 0,
        html_content TEXT,
        separated_svgs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await databaseConnection.exec(`ALTER TABLE designs ADD COLUMN is_internal INTEGER DEFAULT 0`);
      console.log('Campo is_internal agregado a la tabla designs');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    try {
      await databaseConnection.exec(`ALTER TABLE designs ADD COLUMN html_content TEXT`);
      console.log('Campo html_content agregado a la tabla designs');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    try {
      await databaseConnection.exec(`ALTER TABLE designs ADD COLUMN separated_svgs TEXT`);
      console.log('Campo separated_svgs agregado a la tabla designs');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    await databaseConnection.exec(`
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

    for (const alterStatement of [
      `ALTER TABLE screens ADD COLUMN width INTEGER DEFAULT 1920`,
      `ALTER TABLE screens ADD COLUMN height INTEGER DEFAULT 1080`,
      `ALTER TABLE screens ADD COLUMN design_html TEXT`
    ]) {
      try {
        await databaseConnection.exec(alterStatement);
        console.log(`Migracion aplicada: ${alterStatement}`);
      } catch (error) {
        if (!error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }

    await databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS design_assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        screen_id INTEGER REFERENCES screens(id) ON DELETE CASCADE,
        design_id INTEGER REFERENCES designs(id) ON DELETE CASCADE,
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(screen_id)
      )
    `);

    await databaseConnection.exec(`
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

    await databaseConnection.exec(`
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

    await databaseConnection.exec(`
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

    await databaseConnection.exec(`
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

    await databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS product_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        upload_id INTEGER NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        alt_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await databaseConnection.exec(`
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
      await databaseConnection.exec(`ALTER TABLE combos ADD COLUMN has_countdown INTEGER DEFAULT 0`);
      console.log('Campo has_countdown agregado a la tabla combos');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    await databaseConnection.exec(`
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
      await databaseConnection.exec(`ALTER TABLE promotions ADD COLUMN target_combo_id INTEGER REFERENCES combos(id) ON DELETE SET NULL`);
      console.log('Campo target_combo_id agregado a la tabla promotions');
    } catch (error) {
      if (!error.message.includes('duplicate column name')) {
        throw error;
      }
    }

    await databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS combo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combo_id INTEGER NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(combo_id, product_id)
      )
    `);

    await databaseConnection.exec(`
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

    await databaseConnection.exec(`
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

    await databaseConnection.exec(`
      CREATE TABLE IF NOT EXISTS combo_menu_visibility (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combo_id INTEGER NOT NULL REFERENCES combos(id) ON DELETE CASCADE,
        menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(combo_id, menu_id)
      )
    `);

    await databaseConnection.exec(`
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

    await databaseConnection.exec(`
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

    await databaseConnection.exec(`
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

    for (const indexStatement of [
      `CREATE INDEX IF NOT EXISTS idx_categories_active_order ON categories(is_active, sort_order, name)`,
      `CREATE INDEX IF NOT EXISTS idx_products_status_category ON products(status, category_id)`,
      `CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, sort_order)`,
      `CREATE INDEX IF NOT EXISTS idx_promotions_status_target ON promotions(status, target_product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_combos_status ON combos(status)`,
      `CREATE INDEX IF NOT EXISTS idx_menus_status ON menus(status)`,
      `CREATE INDEX IF NOT EXISTS idx_menu_blocks_menu_order ON menu_blocks(menu_id, sort_order)`,
      `CREATE INDEX IF NOT EXISTS idx_persistent_links_status ON persistent_links(status)`,
      `CREATE INDEX IF NOT EXISTS idx_link_schedule_rules_link ON link_schedule_rules(persistent_link_id, is_active, start_time, end_time)`,
      `CREATE INDEX IF NOT EXISTS idx_menu_views_requested_at ON menu_views(requested_at DESC)`
    ]) {
      await databaseConnection.exec(indexStatement);
    }

    console.log('Tablas SQLite creadas correctamente');
  } catch (error) {
    console.error('Error al crear tablas SQLite:', error);
    throw error;
  }
}

async function ensurePostgresTables() {
  try {
    for (const statement of getPostgresSchemaStatements()) {
      await databaseConnection.exec(statement);
    }

    console.log('Esquema Postgres/Supabase verificado correctamente');
  } catch (error) {
    console.error('Error al crear tablas Postgres/Supabase:', error);
    throw error;
  }
}

async function createTables() {
  if (!databaseConnection) {
    throw new Error('La base de datos no fue inicializada');
  }

  if (databaseProviderConfig?.provider === 'postgres') {
    await ensurePostgresTables();
    return;
  }

  await ensureSqliteTables();
}

async function createDefaultAdmin() {
  try {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    const existingAdmin = await databaseConnection.get(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(password, 10);

      await databaseConnection.run(
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
    const existingProfile = await databaseConnection.get('SELECT id FROM business_profile LIMIT 1');

    if (!existingProfile) {
      await databaseConnection.run(
        `
          INSERT INTO business_profile (name, description, timezone, currency_code)
          VALUES (?, ?, ?, ?)
        `,
        [
          process.env.BUSINESS_NAME || 'Mi Local',
          'Perfil inicial para el modulo de carteleria digital',
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

async function createSampleDesigns() {
  try {
    const existingDesigns = await databaseConnection.get('SELECT COUNT(*) as count FROM designs');

    if (parseInt(existingDesigns.count, 10) === 0) {
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
                content: 'Este es un diseno de ejemplo. Puedes editarlo desde el panel de administracion.',
                fontSize: '18px',
                color: '#666666',
                textAlign: 'center'
              }
            ]
          }
        ]
      };

      await databaseConnection.run(
        'INSERT INTO designs (name, description, content) VALUES (?, ?, ?)',
        ['Diseno de Bienvenida', 'Diseno de ejemplo para nuevas pantallas', JSON.stringify(sampleDesign)]
      );

      console.log('Diseno de ejemplo creado');
    }
  } catch (error) {
    console.error('Error al crear disenos de ejemplo:', error);
  }
}

async function initialize() {
  try {
    if (databaseConnection) {
      return true;
    }

    await initializeDatabaseConnection();
    console.log(`Conexion a ${databaseProviderConfig.provider} establecida`);

    await createTables();
    await createDefaultAdmin();
    await ensureBusinessProfile();
    await createSampleDesigns();

    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  }
}

async function close() {
  if (!databaseConnection) {
    return;
  }

  await databaseConnection.close();
  databaseConnection = null;
  databaseProviderConfig = null;
  databaseContextRunner = async (callback) => callback();
}

async function runWithDatabaseContext(callback) {
  return databaseContextRunner(callback);
}

module.exports = {
  db: () => databaseConnection,
  initialize,
  close,
  runWithDatabaseContext,
  getProviderConfig: () => databaseProviderConfig || getDatabaseProviderConfig()
};
