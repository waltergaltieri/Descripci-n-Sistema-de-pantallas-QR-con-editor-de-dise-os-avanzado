const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');

const loadDatabaseModule = () => {
  delete require.cache[databaseModulePath];
  return require('../config/database');
};

test('creates a default business account and billing profile when none exist', async () => {
  const calls = [];
  const { __internals } = loadDatabaseModule();

  const fakeDbConnection = {
    async get(sql) {
      if (sql.includes('FROM business_accounts')) {
        return null;
      }

      if (sql.includes('FROM business_profile')) {
        return {
          name: 'Mi Local',
          legal_name: 'Mi Local SRL',
          description: 'Perfil legacy',
          timezone: 'America/Buenos_Aires',
          currency_code: 'ARS'
        };
      }

      return null;
    },
    async run(sql, params) {
      calls.push({ sql, params });

      if (sql.includes('INSERT INTO business_accounts')) {
        return { lastID: 10 };
      }

      return { lastID: 20 };
    }
  };

  const result = await __internals.ensureDefaultBusinessAccount(fakeDbConnection, {
    BUSINESS_NAME: 'Mi Local',
    BUSINESS_CURRENCY: 'ARS'
  });

  assert.equal(result.businessAccountId, 10);
  assert.equal(calls.length, 2);
  assert.match(calls[0].sql, /INSERT INTO business_accounts/i);
  assert.match(calls[1].sql, /INSERT INTO billing_profiles/i);
});
