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
      getProviderConfig: () => ({ provider: 'sqlite' })
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

test('dashboard metrics scope queries to the authenticated business account', async () => {
  const getCalls = [];
  const fakeDbConnection = {
    async get(sql, params = []) {
      getCalls.push({ sql, params });
      return { count: 0 };
    }
  };

  const router = loadRouterWithMocks(fakeDbConnection);
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/dashboard/metrics' && layer.route.methods.get
  );

  const req = {
    query: {},
    user: {
      actorType: 'business_user',
      businessAccountId: 17
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
  assert.equal(jsonBody.totalProducts, 0);
  assert.equal(getCalls.length, 9);
  assert.equal(
    getCalls.every(({ sql, params }) => sql.includes('business_account_id = ?') && params.includes(17)),
    true
  );

  cleanupRouterMocks();
});

test('business profile route reads the current business account for business users', async () => {
  const getCalls = [];
  const fakeDbConnection = {
    async get(sql, params = []) {
      getCalls.push({ sql, params });

      if (sql.includes('FROM business_accounts')) {
        return {
          id: 23,
          name: 'Cafe Norte',
          legal_name: 'Cafe Norte SRL',
          description: 'Perfil del tenant',
          contact_phone: '11-5555-0101',
          contact_person: 'Ana',
          contact_email: 'ana@cafenorte.test',
          logo_upload_id: 9,
          logo_url: 'https://cdn.test/logo.png',
          timezone: 'America/Buenos_Aires',
          currency_code: 'ARS'
        };
      }

      return null;
    }
  };

  const router = loadRouterWithMocks(fakeDbConnection);
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/business-profile' && layer.route.methods.get
  );

  const req = {
    query: {},
    user: {
      actorType: 'business_user',
      businessAccountId: 23
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
  assert.equal(jsonBody.name, 'Cafe Norte');
  assert.equal(getCalls[0].sql.includes('FROM business_accounts'), true);
  assert.deepEqual(getCalls[0].params, [23]);

  cleanupRouterMocks();
});

test('create combo route stores the authenticated business account id', async () => {
  const runCalls = [];
  const fakeDbConnection = {
    async get(sql, params = []) {
      if (sql.includes('FROM products WHERE id = ? AND business_account_id = ?')) {
        return { id: params[0] };
      }

      if (sql.includes('FROM menus WHERE id = ? AND business_account_id = ?')) {
        return { id: params[0] };
      }

      if (sql.includes('FROM uploads WHERE id = ? AND business_account_id = ?')) {
        return { id: params[0] };
      }

      if (sql.includes('FROM combos c')) {
        return {
          id: 91,
          name: 'Combo tenant',
          business_account_id: 55
        };
      }

      return null;
    },
    async run(sql, params = []) {
      runCalls.push({ sql, params });
      return { lastID: 91 };
    },
    async all() {
      return [];
    },
    async exec() {
      return true;
    }
  };

  const router = loadRouterWithMocks(fakeDbConnection);
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/combos' && layer.route.methods.post
  );

  const req = {
    body: {
      name: 'Combo tenant',
      combo_price: 12.5,
      image_upload_id: 4,
      product_ids: [10],
      menu_ids: [30]
    },
    user: {
      actorType: 'business_user',
      businessAccountId: 55
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
  assert.equal(jsonBody.id, 91);
  assert.equal(
    runCalls.some(
      ({ sql, params }) => sql.includes('INSERT INTO combos') && params[0] === 55
    ),
    true
  );

  cleanupRouterMocks();
});

test('list links route scopes queries to the authenticated business account', async () => {
  const getCalls = [];
  const allCalls = [];
  const fakeDbConnection = {
    async get(sql, params = []) {
      getCalls.push({ sql, params });
      return { count: 1 };
    },
    async all(sql, params = []) {
      allCalls.push({ sql, params });
      return [
        {
          id: 7,
          name: 'Link tenant',
          qr_config: '{}'
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
      limit: '10'
    },
    user: {
      actorType: 'business_user',
      businessAccountId: 77
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
  assert.equal(getCalls[0].sql.includes('pl.business_account_id = ?'), true);
  assert.deepEqual(getCalls[0].params, [77]);
  assert.equal(allCalls[0].sql.includes('pl.business_account_id = ?'), true);
  assert.equal(allCalls[0].params[0], 77);

  cleanupRouterMocks();
});
