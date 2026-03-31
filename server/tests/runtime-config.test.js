const test = require('node:test');
const assert = require('node:assert/strict');

const runtimeConfigModulePath = require.resolve('../config/runtimeConfig');

const loadRuntimeConfig = () => {
  delete require.cache[runtimeConfigModulePath];
  return require('../config/runtimeConfig');
};

test('does not warn for local sqlite development setup', () => {
  const { getRuntimeConfigWarnings } = loadRuntimeConfig();
  const warnings = getRuntimeConfigWarnings({
    NODE_ENV: 'development',
    DB_PROVIDER: 'sqlite',
    UPLOAD_PROVIDER: 'local'
  });

  assert.deepEqual(warnings, []);
});

test('warns when postgres uses local uploads in development', () => {
  const { getRuntimeConfigWarnings } = loadRuntimeConfig();
  const warnings = getRuntimeConfigWarnings({
    NODE_ENV: 'development',
    DB_PROVIDER: 'postgres',
    UPLOAD_PROVIDER: 'local',
    DATABASE_URL: 'postgresql://postgres:secret@db.example.com:5432/postgres'
  });

  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /Postgres/i);
  assert.match(warnings[0], /uploads locales/i);
});
