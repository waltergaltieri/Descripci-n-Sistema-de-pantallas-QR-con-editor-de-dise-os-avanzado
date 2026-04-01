const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');
const authMiddlewareModulePath = require.resolve('../middleware/auth');
const modulePath = require.resolve('../routes/auth');

const loadRouterWithMocks = ({ fakeDbConnection, fakeAuthMiddleware }) => {
  delete require.cache[modulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authMiddlewareModulePath];

  require.cache[databaseModulePath] = {
    id: databaseModulePath,
    filename: databaseModulePath,
    loaded: true,
    exports: {
      db: () => fakeDbConnection
    }
  };

  require.cache[authMiddlewareModulePath] = {
    id: authMiddlewareModulePath,
    filename: authMiddlewareModulePath,
    loaded: true,
    exports: fakeAuthMiddleware || {
      authenticateToken: (req, res, next) => next()
    }
  };

  return require('../routes/auth');
};

const cleanup = () => {
  delete require.cache[modulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authMiddlewareModulePath];
};

test('verify route returns the full authenticated application profile', async () => {
  const router = loadRouterWithMocks({
    fakeDbConnection: {}
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/verify' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      businessAccountId: 12,
      role: 'owner',
      accessStatus: 'active',
      authProvider: 'supabase'
    }
  };

  let jsonBody = null;
  const res = {
    json(payload) {
      jsonBody = payload;
      return this;
    }
  };

  await handler(req, res);

  assert.deepEqual(jsonBody, {
    valid: true,
    user: req.user
  });

  cleanup();
});

test('login route is disabled because authentication is handled by Supabase Auth', async () => {
  const router = loadRouterWithMocks({
    fakeDbConnection: {}
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/login' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    body: {
      username: 'admin',
      password: 'legacy123'
    }
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

  assert.equal(res.statusCode, 410);
  assert.match(res.payload.error, /supabase/i);

  cleanup();
});

test('change-password rejects Supabase-managed users with a clear message', async () => {
  let dbWasTouched = false;
  const router = loadRouterWithMocks({
    fakeDbConnection: {
      async get() {
        dbWasTouched = true;
        return null;
      },
      async run() {
        dbWasTouched = true;
      }
    }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/change-password' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      authProvider: 'supabase'
    },
    body: {
      currentPassword: 'actual123',
      newPassword: 'nueva123'
    }
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

  assert.equal(res.statusCode, 400);
  assert.match(res.payload.error, /Supabase/i);
  assert.equal(dbWasTouched, false);

  cleanup();
});
