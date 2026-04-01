const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');
const supabaseAuthModulePath = require.resolve('../utils/supabaseAuth');
const modulePath = require.resolve('../middleware/auth');

const loadMiddlewareWithMocks = ({ fakeDbConnection, fakeSupabaseAuth }) => {
  delete require.cache[modulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[supabaseAuthModulePath];

  require.cache[databaseModulePath] = {
    id: databaseModulePath,
    filename: databaseModulePath,
    loaded: true,
    exports: {
      db: () => fakeDbConnection
    }
  };

  require.cache[supabaseAuthModulePath] = {
    id: supabaseAuthModulePath,
    filename: supabaseAuthModulePath,
    loaded: true,
    exports: fakeSupabaseAuth
  };

  return require('../middleware/auth');
};

const cleanup = () => {
  delete require.cache[modulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[supabaseAuthModulePath];
};

test('authenticateToken prefers Supabase app profiles when available', async () => {
  const { authenticateToken } = loadMiddlewareWithMocks({
    fakeDbConnection: {},
    fakeSupabaseAuth: {
      resolveAuthenticatedAppUser: async () => ({
        actorType: 'super_admin',
        isActive: true,
        email: 'owner@kaze.com'
      })
    }
  });

  const req = { headers: { authorization: 'Bearer good-token' } };
  let nextCalled = false;
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

  await authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(req.user.actorType, 'super_admin');

  cleanup();
});

test('authenticateToken rejects bearer tokens that do not resolve to a Supabase application profile', async () => {
  const { authenticateToken } = loadMiddlewareWithMocks({
    fakeDbConnection: {},
    fakeSupabaseAuth: {
      resolveAuthenticatedAppUser: async () => null
    }
  });

  const req = { headers: { authorization: 'Bearer invalid-or-legacy-token' } };
  let nextCalled = false;
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

  await authenticateToken(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.payload.error, /supabase/i);

  cleanup();
});

test('requireAdmin accepts super admins and business owners, but rejects unprivileged business users', () => {
  const { requireAdmin } = loadMiddlewareWithMocks({
    fakeDbConnection: {},
    fakeSupabaseAuth: {
      resolveAuthenticatedAppUser: async () => null
    }
  });

  let nextCalled = false;
  requireAdmin({ user: { actorType: 'super_admin' } }, {}, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);

  let ownerAllowed = false;
  const unusedRes = {
    status() {
      throw new Error('owner should not be rejected');
    }
  };

  requireAdmin({ user: { actorType: 'business_user', role: 'owner' } }, unusedRes, () => {
    ownerAllowed = true;
  });
  assert.equal(ownerAllowed, true);

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

  requireAdmin({ user: { actorType: 'business_user', role: 'viewer' } }, res, () => {});
  assert.equal(res.statusCode, 403);

  cleanup();
});
