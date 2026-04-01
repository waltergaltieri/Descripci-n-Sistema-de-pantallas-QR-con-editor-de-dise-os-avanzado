const test = require('node:test');
const assert = require('node:assert/strict');

const modulePath = require.resolve('../utils/appAuthProfile');

const loadModule = () => {
  delete require.cache[modulePath];
  return require('../utils/appAuthProfile');
};

test('resolves a super admin application profile', async () => {
  const { resolveAppUserProfile } = loadModule();

  const fakeDbConnection = {
    async get(sql, params) {
      if (sql.includes('FROM super_admin_users')) {
        return {
          id: 1,
          email: 'owner@kaze.com',
          full_name: 'Kaze Owner',
          is_active: 1,
          supabase_user_id: params[0]
        };
      }

      return null;
    }
  };

  const profile = await resolveAppUserProfile({
    dbConnection: fakeDbConnection,
    supabaseUserId: 'supabase-user-1'
  });

  assert.equal(profile.actorType, 'super_admin');
  assert.equal(profile.isActive, true);
  assert.equal(profile.email, 'owner@kaze.com');
});

test('resolves an active business user profile', async () => {
  const { resolveAppUserProfile } = loadModule();

  const fakeDbConnection = {
    async get(sql, params) {
      if (sql.includes('FROM super_admin_users')) {
        return null;
      }

      if (sql.includes('FROM business_users')) {
        return {
          business_user_id: 22,
          business_account_id: 8,
          business_name: 'Cafe Central',
          access_status: 'active',
          commercial_status: 'due_soon',
          email: 'owner@cafecentral.com',
          full_name: 'Ana',
          role: 'owner',
          is_active: 1,
          supabase_user_id: params[0]
        };
      }

      return null;
    }
  };

  const profile = await resolveAppUserProfile({
    dbConnection: fakeDbConnection,
    supabaseUserId: 'supabase-user-2'
  });

  assert.equal(profile.actorType, 'business_user');
  assert.equal(profile.businessAccountId, 8);
  assert.equal(profile.accessStatus, 'active');
  assert.equal(profile.isActive, true);
});

test('marks suspended business users as blocked at application level', async () => {
  const { resolveAppUserProfile } = loadModule();

  const fakeDbConnection = {
    async get(sql) {
      if (sql.includes('FROM super_admin_users')) {
        return null;
      }

      if (sql.includes('FROM business_users')) {
        return {
          business_user_id: 33,
          business_account_id: 9,
          business_name: 'Pizzeria 9',
          access_status: 'suspended',
          commercial_status: 'overdue',
          email: 'owner@pizzeria9.com',
          full_name: 'Luis',
          role: 'owner',
          is_active: 1,
          supabase_user_id: 'supabase-user-3'
        };
      }

      return null;
    }
  };

  const profile = await resolveAppUserProfile({
    dbConnection: fakeDbConnection,
    supabaseUserId: 'supabase-user-3'
  });

  assert.equal(profile.actorType, 'business_user');
  assert.equal(profile.isBlocked, true);
  assert.equal(profile.accessStatus, 'suspended');
});
