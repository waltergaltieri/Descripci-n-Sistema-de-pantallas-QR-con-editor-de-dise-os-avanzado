const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');
const postgresSchemaModulePath = require.resolve('../config/postgresSchema');

const loadDatabaseModule = () => {
  delete require.cache[databaseModulePath];
  return require('../config/database');
};

const loadPostgresSchema = () => {
  delete require.cache[postgresSchemaModulePath];
  return require('../config/postgresSchema');
};

test('postgres schema includes SaaS administration tables', () => {
  const { getPostgresSchemaStatements } = loadPostgresSchema();
  const schema = getPostgresSchemaStatements().join('\n');

  assert.match(schema, /CREATE TABLE IF NOT EXISTS super_admin_users/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS business_accounts/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS business_users/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS billing_profiles/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS billing_events/i);
});

test('postgres schema scopes operational tables by business account', () => {
  const { getPostgresSchemaStatements } = loadPostgresSchema();
  const schema = getPostgresSchemaStatements().join('\n');

  assert.match(schema, /CREATE TABLE IF NOT EXISTS business_accounts[\s\S]*logo_upload_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS uploads[\s\S]*business_account_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS categories[\s\S]*business_account_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS products[\s\S]*business_account_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS combos[\s\S]*business_account_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS promotions[\s\S]*business_account_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS menus[\s\S]*business_account_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS persistent_links[\s\S]*business_account_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS designs[\s\S]*business_account_id/i);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS screens[\s\S]*business_account_id/i);
});

test('postgres schema enables row level security on public application tables', () => {
  const { getPostgresSchemaStatements, __internals } = loadPostgresSchema();
  const schema = getPostgresSchemaStatements().join('\n');

  assert.ok(Array.isArray(__internals.PUBLIC_RLS_TABLES));
  assert.ok(__internals.PUBLIC_RLS_TABLES.length > 0);

  for (const tableName of __internals.PUBLIC_RLS_TABLES) {
    assert.match(
      schema,
      new RegExp(`ALTER TABLE public\\.${tableName} ENABLE ROW LEVEL SECURITY`, 'i')
    );
  }
});

test('sqlite setup creates SaaS administration tables', async () => {
  const execStatements = [];
  const { __internals } = loadDatabaseModule();

  await __internals.ensureSqliteSaasTables({
    exec: async (sql) => {
      execStatements.push(sql);
    }
  });

  const combined = execStatements.join('\n');
  assert.match(combined, /CREATE TABLE IF NOT EXISTS super_admin_users/i);
  assert.match(combined, /CREATE TABLE IF NOT EXISTS business_accounts/i);
  assert.match(combined, /CREATE TABLE IF NOT EXISTS business_users/i);
  assert.match(combined, /CREATE TABLE IF NOT EXISTS billing_profiles/i);
  assert.match(combined, /CREATE TABLE IF NOT EXISTS billing_events/i);
});

test('sqlite schema support includes business account scoped operational tables', async () => {
  const execStatements = [];
  const { __internals } = loadDatabaseModule();

  await __internals.ensureSqliteSaasTables({
    exec: async (sql) => {
      execStatements.push(sql);
    }
  });

  const combined = execStatements.join('\n');
  assert.match(combined, /CREATE TABLE IF NOT EXISTS business_accounts[\s\S]*logo_upload_id/i);
});
