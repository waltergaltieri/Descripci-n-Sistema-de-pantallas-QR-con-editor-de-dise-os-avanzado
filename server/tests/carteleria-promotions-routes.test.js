const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');
const authModulePath = require.resolve('../middleware/auth');
const routerModulePath = require.resolve('../routes/carteleria');

const loadRouterWithMocks = (fakeDbConnection) => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];

  require.cache[databaseModulePath] = {
    id: databaseModulePath,
    filename: databaseModulePath,
    loaded: true,
    exports: {
      db: () => fakeDbConnection,
      getProviderConfig: () => ({ provider: 'postgres' })
    }
  };

  require.cache[authModulePath] = {
    id: authModulePath,
    filename: authModulePath,
    loaded: true,
    exports: {
      authenticateToken: (req, res, next) => next(),
      requireAdmin: (req, res, next) => next()
    }
  };

  return require('../routes/carteleria');
};

const cleanupRouterMocks = () => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
};

test('create promotion route accepts minimum_spend without crashing', async () => {
  const runCalls = [];
  const fakeDbConnection = {
    async get(sql) {
      if (sql.includes('FROM products WHERE id')) {
        return { id: 1 };
      }

      if (sql.includes('FROM promotions pr')) {
        return {
          id: 77,
          name: 'Promo por gasto',
          minimum_spend_cents: 150000
        };
      }

      return { id: 77 };
    },
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { lastID: 77 };
    }
  };

  const router = loadRouterWithMocks(fakeDbConnection);
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/promotions' && layer.route.methods.post
  );

  const req = {
    body: {
      name: 'Promo por gasto',
      type: 'free_with_minimum_spend',
      target_product_id: 1,
      minimum_spend: 1500
    }
  };

  let statusCode = 200;
  let jsonBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    }
  };

  await routeLayer.route.stack[0].handle(req, res);

  assert.equal(statusCode, 201);
  assert.equal(jsonBody.id, 77);
  assert.equal(runCalls.length, 1);
  assert.equal(runCalls[0].params[7], 150000);

  cleanupRouterMocks();
});

test('list combos route uses postgres-safe aggregation', async () => {
  const allCalls = [];
  const fakeDbConnection = {
    async get(sql) {
      if (sql.includes('COUNT(*) AS count')) {
        return { count: 1 };
      }

      return { id: 1 };
    },
    async all(sql) {
      allCalls.push(sql);
      return [
        {
          id: 12,
          name: 'Combo test',
          combo_price_cents: 250000,
          items_count: 2,
          items_summary: 'A, B',
          visible_in_menus: 1
        }
      ];
    }
  };

  const router = loadRouterWithMocks(fakeDbConnection);
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/combos' && layer.route.methods.get
  );

  const req = {
    query: {
      page: '1',
      limit: '100',
      status: 'active'
    }
  };

  let statusCode = 200;
  let jsonBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    }
  };

  await routeLayer.route.stack[0].handle(req, res);

  assert.equal(statusCode, 200);
  assert.equal(jsonBody.data.length, 1);
  assert.equal(allCalls.length, 1);
  assert.equal(allCalls[0].includes('GROUP_CONCAT'), false);
  assert.equal(allCalls[0].includes('STRING_AGG'), true);

  cleanupRouterMocks();
});

test('list links route groups joined menu name for postgres', async () => {
  const allCalls = [];
  const fakeDbConnection = {
    async get(sql) {
      if (sql.includes('COUNT(*) AS count')) {
        return { count: 1 };
      }

      return { id: 1 };
    },
    async all(sql) {
      allCalls.push(sql);
      return [
        {
          id: 3,
          name: 'Menu mañana',
          slug: 'menu-manana',
          qr_config: '{}',
          default_menu_name: 'Desayuno',
          rules_count: 2
        }
      ];
    }
  };

  const router = loadRouterWithMocks(fakeDbConnection);
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/links' && layer.route.methods.get
  );

  const req = {
    query: {
      page: '1',
      limit: '12',
      search: '',
      status: ''
    }
  };

  let statusCode = 200;
  let jsonBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    }
  };

  await routeLayer.route.stack[0].handle(req, res);

  assert.equal(statusCode, 200);
  assert.equal(jsonBody.data.length, 1);
  assert.equal(allCalls.length, 1);
  assert.equal(allCalls[0].includes('GROUP BY pl.id, m.name'), true);

  cleanupRouterMocks();
});

test('create combo route persists countdown flag', async () => {
  const runCalls = [];
  const fakeDbConnection = {
    async get(sql) {
      if (sql.includes('FROM products WHERE id')) {
        return { id: 10 };
      }

      if (sql.includes('FROM menus WHERE id')) {
        return { id: 90 };
      }

      if (sql.includes('SELECT * FROM combos WHERE id = ?')) {
        return {
          id: 88,
          name: 'Combo countdown',
          has_countdown: 1
        };
      }

      return { id: 88 };
    },
    async exec() {
      return true;
    },
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { lastID: 88 };
    }
  };

  const router = loadRouterWithMocks(fakeDbConnection);
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/combos' && layer.route.methods.post
  );

  const req = {
    body: {
      name: 'Combo countdown',
      combo_price: 25,
      has_countdown: true,
      starts_at: '2030-01-04T09:30',
      ends_at: '2030-01-04T12:30',
      no_expiration: false,
      product_ids: [10],
      menu_ids: [90]
    }
  };

  let statusCode = 200;
  let jsonBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    }
  };

  await routeLayer.route.stack[0].handle(req, res);

  assert.equal(statusCode, 201);
  assert.equal(jsonBody.id, 88);

  const insertCall = runCalls.find((call) => call.sql.includes('INSERT INTO combos'));
  assert.ok(insertCall);
  assert.equal(insertCall.params[8], 1);

  cleanupRouterMocks();
});
