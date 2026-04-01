const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const providerConfigModulePath = require.resolve('../config/databaseProviderConfig');

const loadProviderConfig = () => {
  delete require.cache[providerConfigModulePath];
  return require('../config/databaseProviderConfig');
};

test('defaults to sqlite provider with server database path', () => {
  const { getDatabaseProviderConfig } = loadProviderConfig();
  const config = getDatabaseProviderConfig({});
  const expectedSqlitePath = path.join(path.dirname(providerConfigModulePath), '..', 'database.sqlite');

  assert.equal(config.provider, 'sqlite');
  assert.equal(config.sqlitePath, expectedSqlitePath);
});

test('uses explicit sqlite path when provided', () => {
  const { getDatabaseProviderConfig } = loadProviderConfig();
  const config = getDatabaseProviderConfig({
    DB_PROVIDER: 'sqlite',
    SQLITE_PATH: '/tmp/custom.sqlite'
  });

  assert.equal(config.provider, 'sqlite');
  assert.equal(config.sqlitePath, '/tmp/custom.sqlite');
});

test('switches to postgres when database url is configured', () => {
  const { getDatabaseProviderConfig } = loadProviderConfig();
  const config = getDatabaseProviderConfig({
    DATABASE_URL: 'postgresql://postgres:secret@db.supabase.co:5432/postgres'
  });

  assert.equal(config.provider, 'postgres');
  assert.equal(config.databaseUrl, 'postgresql://postgres:secret@db.supabase.co:5432/postgres');
  assert.equal(config.ssl, true);
});

test('builds postgres url from supabase project id and database password', () => {
  const { getDatabaseProviderConfig } = loadProviderConfig();
  const config = getDatabaseProviderConfig({
    SUPABASE_PROJECT_ID: 'qorqkcywoefkficspepx',
    SUPABASE_DB_PASSWORD: 'r3R88=3M++Tv'
  });

  assert.equal(config.provider, 'postgres');
  assert.equal(
    config.databaseUrl,
    'postgresql://postgres:r3R88%3D3M%2B%2BTv@db.qorqkcywoefkficspepx.supabase.co:5432/postgres'
  );
});
