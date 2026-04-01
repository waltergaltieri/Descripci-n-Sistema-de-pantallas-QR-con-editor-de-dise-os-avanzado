const test = require('node:test');
const assert = require('node:assert/strict');

const supabaseConfigModulePath = require.resolve('../config/supabase');
const appAuthProfileModulePath = require.resolve('../utils/appAuthProfile');
const modulePath = require.resolve('../utils/supabaseAuth');

const loadModuleWithMocks = ({ fakeSupabaseClient, fakeProfileResolver }) => {
  delete require.cache[modulePath];
  delete require.cache[supabaseConfigModulePath];
  delete require.cache[appAuthProfileModulePath];

  require.cache[supabaseConfigModulePath] = {
    id: supabaseConfigModulePath,
    filename: supabaseConfigModulePath,
    loaded: true,
    exports: {
      createSupabaseServiceClient: () => fakeSupabaseClient
    }
  };

  require.cache[appAuthProfileModulePath] = {
    id: appAuthProfileModulePath,
    filename: appAuthProfileModulePath,
    loaded: true,
    exports: {
      resolveAppUserProfile: fakeProfileResolver
    }
  };

  return require('../utils/supabaseAuth');
};

const cleanup = () => {
  delete require.cache[modulePath];
  delete require.cache[supabaseConfigModulePath];
  delete require.cache[appAuthProfileModulePath];
};

test('validateSupabaseAccessToken returns normalized user data', async () => {
  const { validateSupabaseAccessToken } = loadModuleWithMocks({
    fakeSupabaseClient: {
      auth: {
        async getUser(token) {
          assert.equal(token, 'good-token');
          return {
            data: {
              user: {
                id: 'supabase-user-1',
                email: 'owner@kaze.com'
              }
            },
            error: null
          };
        }
      }
    },
    fakeProfileResolver: async () => null
  });

  const result = await validateSupabaseAccessToken('good-token');

  assert.deepEqual(result, {
    supabaseUserId: 'supabase-user-1',
    email: 'owner@kaze.com',
    rawUser: {
      id: 'supabase-user-1',
      email: 'owner@kaze.com'
    }
  });

  cleanup();
});

test('resolveAuthenticatedAppUser returns application profile when token is valid', async () => {
  const { resolveAuthenticatedAppUser } = loadModuleWithMocks({
    fakeSupabaseClient: {
      auth: {
        async getUser() {
          return {
            data: {
              user: {
                id: 'supabase-user-2',
                email: 'owner@cafecentral.com'
              }
            },
            error: null
          };
        }
      }
    },
    fakeProfileResolver: async ({ supabaseUserId }) => ({
      actorType: 'business_user',
      supabaseUserId,
      businessAccountId: 8,
      role: 'owner',
      isActive: true,
      accessStatus: 'active'
    })
  });

  const profile = await resolveAuthenticatedAppUser({
    accessToken: 'good-token',
    dbConnection: {}
  });

  assert.equal(profile.actorType, 'business_user');
  assert.equal(profile.supabaseUserId, 'supabase-user-2');
  assert.equal(profile.authProvider, 'supabase');

  cleanup();
});
