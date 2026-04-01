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
      createSupabaseServiceClient: () =>
        fakeSupabaseClient || {
          auth: {
            admin: {
              createUser: async () => ({ data: { user: { id: 'supabase-user-id' } }, error: null }),
              updateUserById: async () => ({ data: {}, error: null }),
              deleteUser: async () => ({ data: {}, error: null })
            }
          }
        }
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

const createResponse = () => {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
};

test('dashboard route returns account counters and billing alerts for super admins', async () => {
  const fakeDbConnection = {
    async all(sql) {
      assert.match(sql, /FROM business_accounts/);
      return [
        {
          id: 1,
          access_status: 'active',
          next_due_date: '2099-04-05',
          reminder_days_before: 7
        },
        {
          id: 2,
          access_status: 'suspended',
          next_due_date: '2099-04-20',
          reminder_days_before: 7
        },
        {
          id: 3,
          access_status: 'inactive',
          next_due_date: '2099-03-20',
          reminder_days_before: 7
        }
      ];
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/dashboard' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    query: { today: '2099-04-01' },
    user: { actorType: 'super_admin' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.deepEqual(res.payload.metrics, {
    totalClients: 3,
    activeClients: 1,
    suspendedClients: 1,
    inactiveClients: 1,
    dueSoonClients: 1,
    overdueClients: 1
  });

  cleanup();
});

test('clients list route returns normalized clients and supports filtering by commercial status', async () => {
  const fakeDbConnection = {
    async all(sql) {
      assert.match(sql, /FROM business_accounts/);
      return [
        {
          id: 8,
          name: 'Cafe Central',
          contact_person: 'Ana',
          contact_email: 'ana@cafecentral.com',
          contact_phone: '123',
          access_status: 'active',
          commercial_status: 'current',
          billing_amount_cents: 250000,
          billing_currency_code: 'ARS',
          next_due_date: '2099-04-04',
          last_payment_marked_at: '2099-03-04T12:00:00Z',
          owner_email: 'owner@cafecentral.com',
          owner_full_name: 'Ana'
        },
        {
          id: 9,
          name: 'Pizzeria 9',
          contact_person: 'Luis',
          contact_email: 'luis@p9.com',
          contact_phone: '456',
          access_status: 'suspended',
          commercial_status: 'current',
          billing_amount_cents: 300000,
          billing_currency_code: 'ARS',
          next_due_date: '2099-03-20',
          last_payment_marked_at: '2099-02-20T12:00:00Z',
          owner_email: 'owner@p9.com',
          owner_full_name: 'Luis'
        }
      ];
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/clients' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    query: { today: '2099-04-01', commercialStatus: 'due_soon' },
    user: { actorType: 'super_admin' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.payload.length, 1);
  assert.equal(res.payload[0].id, 8);
  assert.equal(res.payload[0].commercialStatus, 'due_soon');
  assert.equal(res.payload[0].billingAmount, 2500);

  cleanup();
});

test('client detail route returns business, owner, billing profile and billing events', async () => {
  const fakeDbConnection = {
    async get(sql, params) {
      assert.equal(params[0], '12');

      if (sql.includes('FROM business_accounts ba')) {
        return {
          id: 12,
          name: 'Rotiseria Sol',
          access_status: 'active',
          contact_person: 'Sofia',
          contact_email: 'sofia@rotisol.com',
          contact_phone: '789',
          next_due_date: '2099-04-10',
          billing_amount_cents: 450000,
          billing_currency_code: 'ARS',
          reminder_days_before: 7,
          owner_email: 'owner@rotisol.com',
          owner_full_name: 'Sofia',
          owner_role: 'owner'
        };
      }

      return null;
    },
    async all(sql, params) {
      assert.equal(params[0], '12');
      assert.match(sql, /FROM billing_events/);
      return [
        {
          id: 91,
          event_type: 'payment_marked',
          amount_cents: 450000,
          notes: 'Pago marzo',
          event_date: '2099-03-10T12:00:00Z'
        }
      ];
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/clients/:id' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    params: { id: '12' },
    query: { today: '2099-04-01' },
    user: { actorType: 'super_admin' }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(res.payload.client.id, 12);
  assert.equal(res.payload.client.owner.email, 'owner@rotisol.com');
  assert.equal(res.payload.client.billing.billingAmount, 4500);
  assert.equal(res.payload.client.events.length, 1);

  cleanup();
});

test('mark-payment route updates billing profile and records a billing event', async () => {
  const runCalls = [];
  const fakeDbConnection = {
    async get(sql, params) {
      assert.equal(params[0], '6');
      return {
        business_account_id: 6,
        next_due_date: '2099-04-10',
        first_payment_date: '2099-03-10',
        billing_amount_cents: 550000,
        billing_currency_code: 'ARS',
        reminder_days_before: 7
      };
    },
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { changes: 1 };
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection });
  const routeLayer = router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === '/clients/:id/mark-payment' &&
      layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    params: { id: '6' },
    body: {
      paymentDate: '2099-04-10T15:00:00Z',
      amount: 5500,
      notes: 'Pago abril'
    },
    user: { actorType: 'super_admin', superAdminId: 4 }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(runCalls.length, 2);
  assert.match(runCalls[0].sql, /UPDATE billing_profiles/);
  assert.equal(runCalls[0].params[1], '2099-05-10');
  assert.match(runCalls[1].sql, /INSERT INTO billing_events/);
  assert.equal(res.payload.client.billing.nextDueDate, '2099-05-10');

  cleanup();
});

test('access-status route updates business access status and records an event', async () => {
  const runCalls = [];
  const fakeDbConnection = {
    async get(sql, params) {
      assert.equal(params[0], '4');
      return {
        id: 4,
        access_status: 'active'
      };
    },
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { changes: 1 };
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection });
  const routeLayer = router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === '/clients/:id/access-status' &&
      layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    params: { id: '4' },
    body: { accessStatus: 'suspended', notes: 'Sin pago' },
    user: { actorType: 'super_admin', superAdminId: 2 }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(runCalls.length, 2);
  assert.match(runCalls[0].sql, /UPDATE business_accounts/);
  assert.equal(runCalls[0].params[0], 'suspended');
  assert.match(runCalls[1].sql, /INSERT INTO billing_events/);
  assert.equal(runCalls[1].params[1], 'access_suspended');
  assert.equal(res.payload.client.accessStatus, 'suspended');

  cleanup();
});

test('update client route edits business data and owner profile in app db and Supabase Auth', async () => {
  const runCalls = [];
  const supabaseCalls = [];
  const fakeDbConnection = {
    async get(sql, params) {
      assert.equal(params[0], '15');

      if (sql.includes('FROM business_accounts ba')) {
        return {
          id: 15,
          name: 'Bar Central',
          access_status: 'active',
          contact_person: 'Nora',
          contact_email: 'nora@barcentral.com',
          contact_phone: '444',
          address: 'Calle vieja',
          notes: 'cliente legacy',
          next_due_date: '2099-04-10',
          billing_amount_cents: 550000,
          billing_currency_code: 'ARS',
          reminder_days_before: 7,
          owner_email: 'owner@barcentral.com',
          owner_full_name: 'Nora Owner',
          owner_role: 'owner',
          owner_supabase_user_id: 'owner-supabase-15'
        };
      }

      return {
        id: 15,
        supabase_user_id: 'owner-supabase-15'
      };
    },
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { changes: 1 };
    },
    async all() {
      return [];
    }
  };

  const fakeSupabaseClient = {
    auth: {
      admin: {
        async updateUserById(userId, payload) {
          supabaseCalls.push({ userId, payload });
          return { data: {}, error: null };
        }
      }
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection, fakeSupabaseClient });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/clients/:id' && layer.route.methods.put
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    params: { id: '15' },
    body: {
      name: 'Bar Central Renovado',
      address: 'Calle nueva 123',
      contactPhone: '555',
      contactPerson: 'Nora Soporte',
      contactEmail: 'soporte@barcentral.com',
      ownerFullName: 'Nora Admin',
      ownerEmail: 'owner+new@barcentral.com',
      notes: 'cliente actualizado'
    },
    user: { actorType: 'super_admin', superAdminId: 7 }
  };
  const res = createResponse();

  await handler(req, res);

  assert.equal(runCalls.length, 3);
  assert.match(runCalls[0].sql, /UPDATE business_accounts/);
  assert.match(runCalls[1].sql, /UPDATE business_users/);
  assert.match(runCalls[2].sql, /INSERT INTO billing_events/);
  assert.deepEqual(supabaseCalls, [
    {
      userId: 'owner-supabase-15',
      payload: {
        email: 'owner+new@barcentral.com',
        user_metadata: {
          full_name: 'Nora Admin'
        }
      }
    }
  ]);
  assert.equal(res.payload.client.name, 'Bar Central');

  cleanup();
});

test('reset password route updates owner credentials in Supabase Auth and records an event', async () => {
  const runCalls = [];
  const supabaseCalls = [];
  const fakeDbConnection = {
    async get(sql, params) {
      assert.equal(params[0], '15');

      if (sql.includes('FROM business_users')) {
        return {
          id: 80,
          business_account_id: 15,
          supabase_user_id: 'owner-supabase-15',
          email: 'owner@barcentral.com'
        };
      }

      return {
        id: 15
      };
    },
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { changes: 1 };
    }
  };

  const fakeSupabaseClient = {
    auth: {
      admin: {
        async updateUserById(userId, payload) {
          supabaseCalls.push({ userId, payload });
          return { data: {}, error: null };
        }
      }
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection, fakeSupabaseClient });
  const routeLayer = router.stack.find(
    (layer) =>
      layer.route &&
      layer.route.path === '/clients/:id/reset-password' &&
      layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    params: { id: '15' },
    body: {
      password: 'NuevaClave12345',
      notes: 'Reset solicitado por soporte'
    },
    user: { actorType: 'super_admin', superAdminId: 7 }
  };
  const res = createResponse();

  await handler(req, res);

  assert.deepEqual(supabaseCalls, [
    {
      userId: 'owner-supabase-15',
      payload: {
        password: 'NuevaClave12345'
      }
    }
  ]);
  assert.equal(runCalls.length, 1);
  assert.match(runCalls[0].sql, /INSERT INTO billing_events/);
  assert.equal(res.payload.success, true);

  cleanup();
});
