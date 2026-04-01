#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { Pool } = require('pg');
const dotenv = require('dotenv');

const { getDatabaseProviderConfig } = require('../config/databaseProviderConfig');
const { getPostgresSchemaStatements } = require('../config/postgresSchema');
const { syncLegacyUploadsToStorage } = require('./syncLegacyUploadsToStorage');

dotenv.config({
  path: path.join(__dirname, '..', '.env')
});

const DEFAULT_SOURCE_SQLITE_PATH = path.join(__dirname, '..', 'database.sqlite');
const TARGET_TABLES = [
  'users',
  'business_accounts',
  'super_admin_users',
  'business_users',
  'billing_profiles',
  'billing_events',
  'uploads',
  'business_profile',
  'categories',
  'products',
  'product_images',
  'combos',
  'combo_items',
  'promotions',
  'menus',
  'menu_blocks',
  'combo_menu_visibility',
  'persistent_links',
  'link_schedule_rules',
  'menu_views',
  'designs',
  'screens',
  'design_assignments'
];

const SCOPED_TABLES = new Set([
  'uploads',
  'categories',
  'products',
  'combos',
  'promotions',
  'menus',
  'persistent_links'
]);

const COPY_PLAN = [
  { table: 'users' },
  {
    table: 'business_accounts',
    transform: (row) => ({
      ...row,
      logo_upload_id: null
    })
  },
  { table: 'super_admin_users' },
  { table: 'business_users' },
  { table: 'billing_profiles' },
  { table: 'billing_events' },
  {
    table: 'uploads',
    transform: (row, context) => ({
      ...row,
      business_account_id: row.business_account_id || context.defaultBusinessAccountId || null
    })
  },
  { table: 'business_profile' },
  {
    table: 'categories',
    transform: (row, context) => ({
      ...row,
      business_account_id: row.business_account_id || context.defaultBusinessAccountId
    })
  },
  {
    table: 'products',
    transform: (row, context) => ({
      ...row,
      business_account_id: row.business_account_id || context.defaultBusinessAccountId
    })
  },
  { table: 'product_images' },
  {
    table: 'combos',
    transform: (row, context) => ({
      ...row,
      business_account_id: row.business_account_id || context.defaultBusinessAccountId
    })
  },
  { table: 'combo_items' },
  {
    table: 'promotions',
    transform: (row, context) => ({
      ...row,
      business_account_id: row.business_account_id || context.defaultBusinessAccountId
    })
  },
  {
    table: 'menus',
    transform: (row, context) => ({
      ...row,
      business_account_id: row.business_account_id || context.defaultBusinessAccountId
    })
  },
  { table: 'menu_blocks' },
  { table: 'combo_menu_visibility' },
  {
    table: 'persistent_links',
    transform: (row, context) => ({
      ...row,
      business_account_id: row.business_account_id || context.defaultBusinessAccountId
    })
  },
  { table: 'link_schedule_rules' },
  { table: 'menu_views' },
  { table: 'designs' },
  { table: 'screens' },
  { table: 'design_assignments' }
];

const HELP_TEXT = `
Uso:
  node server/scripts/migrate.js [--from ruta/al/sqlite] [--help]

Descripcion:
  Migra los datos del archivo SQLite legacy hacia la base Postgres/Supabase
  definida en el entorno actual. El destino se limpia antes de copiar la data.

Variables relevantes:
  DB_PROVIDER=postgres
  DATABASE_URL o SUPABASE_DB_URL o SUPABASE_PROJECT_ID + SUPABASE_DB_PASSWORD
  SOURCE_SQLITE_PATH=./database.sqlite
`;

const parseArgs = (argv) => {
  const parsed = {
    help: false,
    from: process.env.SOURCE_SQLITE_PATH || DEFAULT_SOURCE_SQLITE_PATH
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--help' || current === '-h') {
      parsed.help = true;
      continue;
    }

    if (current === '--from') {
      parsed.from = argv[index + 1];
      index += 1;
    }
  }

  return parsed;
};

const quoteIdentifier = (value) => `"${String(value).replace(/"/g, '""')}"`;

const ensureSourceExists = (sourcePath) => {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    throw new Error(`No se encontro la base SQLite de origen: ${sourcePath}`);
  }
};

const getTargetConfig = () => {
  const config = getDatabaseProviderConfig(process.env);

  if (config.provider !== 'postgres' || !config.databaseUrl) {
    throw new Error(
      'La migracion requiere DB_PROVIDER=postgres y una conexion Postgres/Supabase valida'
    );
  }

  return config;
};

const openSourceDatabase = async (sourcePath) =>
  open({
    filename: sourcePath,
    driver: sqlite3.Database
  });

const createTargetPool = (targetConfig) =>
  new Pool({
    connectionString: targetConfig.databaseUrl,
    ssl: targetConfig.ssl ? { rejectUnauthorized: false } : false
  });

const tableExistsInSqlite = async (sourceDb, tableName) => {
  const row = await sourceDb.get(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName]
  );

  return Boolean(row?.name);
};

const getSqliteColumns = async (sourceDb, tableName) => {
  const columns = await sourceDb.all(`PRAGMA table_info(${quoteIdentifier(tableName)})`);
  return columns.map((column) => column.name);
};

const getExistingTargetTables = async (targetPool) => {
  const result = await targetPool.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
  );

  return new Set(result.rows.map((row) => row.tablename));
};

const dropTargetTables = async (targetPool) => {
  const existingTables = await getExistingTargetTables(targetPool);
  const tablesToDrop = TARGET_TABLES.filter((tableName) => existingTables.has(tableName));

  if (tablesToDrop.length === 0) {
    return;
  }

  const dropSql = `
    DROP TABLE IF EXISTS ${tablesToDrop.map(quoteIdentifier).join(', ')} CASCADE
  `;

  await targetPool.query(dropSql);
};

const ensureTargetSchema = async (targetPool) => {
  for (const statement of getPostgresSchemaStatements()) {
    await targetPool.query(statement);
  }
};

const buildInsertStatement = (tableName, columns) => {
  const quotedColumns = columns.map(quoteIdentifier).join(', ');
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

  return `
    INSERT INTO ${quoteIdentifier(tableName)} (${quotedColumns})
    VALUES (${placeholders})
  `;
};

const copyTable = async ({ sourceDb, targetPool, tableName, transform, context }) => {
  const exists = await tableExistsInSqlite(sourceDb, tableName);
  if (!exists) {
    return 0;
  }

  const columns = await getSqliteColumns(sourceDb, tableName);
  if (columns.length === 0) {
    return 0;
  }

  const orderBy = columns.includes('id') ? ' ORDER BY id ASC' : '';
  const rows = await sourceDb.all(`SELECT * FROM ${quoteIdentifier(tableName)}${orderBy}`);

  if (rows.length === 0) {
    return 0;
  }

  const preparedRows = rows.map((row) => (transform ? transform(row, context) : row));
  const insertColumns = Array.from(
    new Set([
      ...columns,
      ...Object.keys(preparedRows[0])
    ])
  ).filter((column) =>
    Object.prototype.hasOwnProperty.call(preparedRows[0], column)
  );
  const insertSql = buildInsertStatement(tableName, insertColumns);

  for (const row of preparedRows) {
    const values = insertColumns.map((column) => row[column]);
    await targetPool.query(insertSql, values);
  }

  return preparedRows.length;
};

const loadSourceBusinessProfile = async (sourceDb) => {
  const exists = await tableExistsInSqlite(sourceDb, 'business_profile');
  if (!exists) {
    return null;
  }

  return sourceDb.get(
    `
      SELECT name, legal_name, description, timezone, currency_code, logo_upload_id
      FROM business_profile
      ORDER BY id ASC
      LIMIT 1
    `
  );
};

const insertFallbackBusinessAccount = async ({ targetPool, businessProfile, env }) => {
  const result = await targetPool.query(
    `
      INSERT INTO business_accounts (
        id,
        name,
        legal_name,
        description,
        timezone,
        currency_code,
        access_status,
        commercial_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'active', 'current')
      RETURNING id
    `,
    [
      1,
      businessProfile?.name || env.BUSINESS_NAME || 'Mi Local',
      businessProfile?.legal_name || null,
      businessProfile?.description || 'Tenant inicial migrado desde la base legacy',
      businessProfile?.timezone || env.BUSINESS_TIMEZONE || 'America/Buenos_Aires',
      businessProfile?.currency_code || env.BUSINESS_CURRENCY || 'ARS'
    ]
  );

  return result.rows[0].id;
};

const insertFallbackBillingProfile = async ({ targetPool, businessAccountId, businessProfile, env }) => {
  await targetPool.query(
    `
      INSERT INTO billing_profiles (
        business_account_id,
        first_payment_date,
        billing_amount_cents,
        billing_currency_code,
        billing_frequency,
        next_due_date,
        reminder_days_before
      )
      VALUES ($1, CURRENT_DATE, 0, $2, 'monthly', CURRENT_DATE, 7)
    `,
    [
      businessAccountId,
      businessProfile?.currency_code || env.BUSINESS_CURRENCY || 'ARS'
    ]
  );
};

const syncBusinessAccountLogos = async ({ sourceDb, targetPool, defaultBusinessAccountId }) => {
  const exists = await tableExistsInSqlite(sourceDb, 'business_accounts');
  if (exists) {
    const rows = await sourceDb.all(
      'SELECT id, logo_upload_id FROM business_accounts WHERE logo_upload_id IS NOT NULL'
    );

    for (const row of rows) {
      await targetPool.query(
        `
          UPDATE business_accounts
          SET logo_upload_id = $1
          WHERE id = $2
        `,
        [row.logo_upload_id, row.id]
      );
    }

    return rows.length;
  }

  const businessProfile = await loadSourceBusinessProfile(sourceDb);
  if (!businessProfile?.logo_upload_id || !defaultBusinessAccountId) {
    return 0;
  }

  await targetPool.query(
    `
      UPDATE business_accounts
      SET logo_upload_id = $1
      WHERE id = $2
    `,
    [businessProfile.logo_upload_id, defaultBusinessAccountId]
  );

  return 1;
};

const resetTargetSequences = async (targetPool) => {
  for (const tableName of TARGET_TABLES) {
    const result = await targetPool.query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'id'
      `,
      [tableName]
    );

    if (result.rowCount === 0) {
      continue;
    }

    await targetPool.query(
      `
        SELECT setval(
          pg_get_serial_sequence($1, 'id'),
          COALESCE((SELECT MAX(id) FROM ${quoteIdentifier(tableName)}), 1),
          EXISTS(SELECT 1 FROM ${quoteIdentifier(tableName)})
        )
      `,
      [tableName]
    );
  }
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP_TEXT.trim());
    return;
  }

  const sourcePath = path.resolve(process.cwd(), args.from);
  ensureSourceExists(sourcePath);

  const targetConfig = getTargetConfig();
  const sourceDb = await openSourceDatabase(sourcePath);
  const targetPool = createTargetPool(targetConfig);
  const context = {
    env: process.env,
    businessProfile: await loadSourceBusinessProfile(sourceDb),
    defaultBusinessAccountId: null
  };

  try {
    await targetPool.query('SELECT 1');
    await dropTargetTables(targetPool);
    await ensureTargetSchema(targetPool);

    console.log(`Migrando desde SQLite: ${sourcePath}`);

    for (const step of COPY_PLAN) {
      const copiedRows = await copyTable({
        sourceDb,
        targetPool,
        tableName: step.table,
        transform: step.transform,
        context
      });

      console.log(`- ${step.table}: ${copiedRows} fila(s)`);

      if (step.table === 'business_accounts') {
        if (copiedRows > 0) {
          const firstBusinessAccount = await sourceDb.get(
            'SELECT id FROM business_accounts ORDER BY id ASC LIMIT 1'
          );
          context.defaultBusinessAccountId = firstBusinessAccount?.id || null;
        } else {
          context.defaultBusinessAccountId = await insertFallbackBusinessAccount({
            targetPool,
            businessProfile: context.businessProfile,
            env: context.env
          });
          console.log(`- business_accounts: tenant legacy creado con id ${context.defaultBusinessAccountId}`);
        }
      }

      if (step.table === 'billing_profiles' && copiedRows === 0 && context.defaultBusinessAccountId) {
        await insertFallbackBillingProfile({
          targetPool,
          businessAccountId: context.defaultBusinessAccountId,
          businessProfile: context.businessProfile,
          env: context.env
        });
        console.log(`- billing_profiles: perfil inicial creado para tenant ${context.defaultBusinessAccountId}`);
      }
    }

    const syncedBusinessLogos = await syncBusinessAccountLogos({
      sourceDb,
      targetPool,
      defaultBusinessAccountId: context.defaultBusinessAccountId
    });

    if (syncedBusinessLogos > 0) {
      console.log(`- business_accounts.logo_upload_id sincronizado para ${syncedBusinessLogos} cuenta(s)`);
    }

    await resetTargetSequences(targetPool);
    await syncLegacyUploadsToStorage();
    console.log('Migracion completada hacia Supabase/Postgres');
  } finally {
    await sourceDb.close();
    await targetPool.end();
  }
};

main().catch((error) => {
  console.error('Error durante la migracion:', error);
  process.exitCode = 1;
});
