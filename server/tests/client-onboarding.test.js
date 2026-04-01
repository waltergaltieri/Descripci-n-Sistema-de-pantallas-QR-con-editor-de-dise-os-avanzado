const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');
const authModulePath = require.resolve('../middleware/auth');
const supabaseModulePath = require.resolve('../config/supabase');
const routerModulePath = require.resolve('../routes/superAdmin');

const loadRouterWithMocks = ({ fakeDbConnection, fakeSupabaseClient }) => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
  delete require.cache[supabaseModulePath];

  require.cache[databaseModulePath] = {
    id: databaseModulePath,
    filename: databaseModulePath,
    loaded: true,
    exports: {
      db: () => fakeDbConnection
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

  require.cache[supabaseModulePath] = {
    id: supabaseModulePath,
    filename: supabaseModulePath,
    loaded: true,
    exports: {
      createSupabaseServiceClient: () => fakeSupabaseClient
    }
  };

  return require('../routes/superAdmin');
};

const cleanup = () => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
  delete require.cache[supabaseModulePath];
};

test('client onboarding creates Supabase user, business account, owner user and billing profile', async () => {
  const runCalls = [];
  const fakeDbConnection = {
    async run(sql, params) {
      runCalls.push({ sql, params });

      if (sql.includes('INSERT INTO business_accounts')) {
        return { lastID: 15 };
      }

      if (sql.includes('INSERT INTO business_users')) {
        return { lastID: 30 };
      }

      if (sql.includes('INSERT INTO billing_profiles')) {
        return { lastID: 45 };
      }

      return { changes: 1 };
    }
  };

  let createUserPayload = null;
  const fakeSupabaseClient = {
    auth: {
      admin: {
        async createUser(payload) {
          createUserPayload = payload;
          return {
            data: {
              user: {
                id: 'supabase-user-15',
                email: payload.email
              }
            },
            error: null
          };
        }
      }
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection, fakeSupabaseClient });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/clients' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    body: {
      name: 'Cafe Central',
      address: 'Calle 123',
      contactPhone: '11223344',
      contactPerson: 'Ana',
      contactEmail: 'ana@cafecentral.com',
      ownerFullName: 'Ana Owner',
      ownerEmail: 'owner@cafecentral.com',
      password: 'ClaveSegura123',
      firstPaymentDate: '2099-04-01',
      billingAmount: 2500,
      notes: 'Cliente premium'
    },
    user: { actorType: 'super_admin', superAdminId: 7 }
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  await handler(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(createUserPayload.email, 'owner@cafecentral.com');
  assert.equal(createUserPayload.password, 'ClaveSegura123');
  assert.equal(runCalls.length, 4);
  assert.match(runCalls[0].sql, /INSERT INTO business_accounts/);
  assert.equal(runCalls[1].params[1], 'supabase-user-15');
  assert.equal(runCalls[2].params[2], 250000);
  assert.match(runCalls[3].sql, /INSERT INTO billing_events/);
  assert.equal(res.payload.client.id, 15);
  assert.equal(res.payload.client.owner.supabaseUserId, 'supabase-user-15');

  cleanup();
});
