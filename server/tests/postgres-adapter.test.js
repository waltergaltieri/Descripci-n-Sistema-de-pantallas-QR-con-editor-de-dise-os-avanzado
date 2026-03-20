const test = require('node:test');
const assert = require('node:assert/strict');

const postgresAdapterModulePath = require.resolve('../config/postgresAdapter');

const loadPostgresAdapter = () => {
  delete require.cache[postgresAdapterModulePath];
  return require('../config/postgresAdapter');
};

test('postgres adapter translates insert placeholders and returns lastID', async () => {
  const queryCalls = [];
  const fakePool = {
    async query(sql, params) {
      queryCalls.push({ sql, params });
      return {
        rowCount: 1,
        rows: [{ id: 55 }]
      };
    }
  };

  const { createPostgresAdapter } = loadPostgresAdapter();
  const adapter = createPostgresAdapter({ pool: fakePool });

  const result = await adapter.run(
    'INSERT INTO categories (name, description) VALUES (?, ?)',
    ['Bebidas', 'Frias']
  );

  assert.equal(result.lastID, 55);
  assert.equal(result.changes, 1);
  assert.match(queryCalls[0].sql, /\$1/);
  assert.match(queryCalls[0].sql, /\$2/);
  assert.match(queryCalls[0].sql, /RETURNING id/i);
});

test('postgres adapter keeps transaction client bound to context between BEGIN and COMMIT', async () => {
  const poolQueries = [];
  const txQueries = [];
  let released = false;

  const txClient = {
    async query(sql, params) {
      txQueries.push({ sql, params });
      return {
        rowCount: 1,
        rows: [{ count: 3 }]
      };
    },
    release() {
      released = true;
    }
  };

  const fakePool = {
    async query(sql, params) {
      poolQueries.push({ sql, params });
      return {
        rowCount: 1,
        rows: []
      };
    },
    async connect() {
      return txClient;
    }
  };

  const { createPostgresAdapter, runWithDatabaseContext } = loadPostgresAdapter();
  const adapter = createPostgresAdapter({ pool: fakePool });

  await runWithDatabaseContext(async () => {
    await adapter.exec('BEGIN');
    await adapter.get('SELECT COUNT(*) AS count FROM products WHERE status = ?', ['active']);
    await adapter.exec('COMMIT');
  });

  assert.equal(poolQueries.length, 0);
  assert.equal(txQueries[0].sql, 'BEGIN');
  assert.equal(txQueries[1].sql, 'SELECT COUNT(*) AS count FROM products WHERE status = $1');
  assert.equal(txQueries[2].sql, 'COMMIT');
  assert.equal(released, true);
});
