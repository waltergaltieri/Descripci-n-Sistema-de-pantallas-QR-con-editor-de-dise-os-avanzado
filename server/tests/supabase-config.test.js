const test = require('node:test');
const assert = require('node:assert/strict');

const supabaseConfigModulePath = require.resolve('../config/supabase');

const loadSupabaseConfig = () => {
  delete require.cache[supabaseConfigModulePath];
  return require('../config/supabase');
};

test('resolves supabase project url and secret key from env', () => {
  const { getSupabaseServerConfig } = loadSupabaseConfig();
  const config = getSupabaseServerConfig({
    SUPABASE_PROJECT_ID: 'qorqkcywoefkficspepx',
    SUPABASE_SECRET_KEY: 'sb_secret_demo',
    SUPABASE_STORAGE_BUCKET: 'uploads'
  });

  assert.equal(config.projectId, 'qorqkcywoefkficspepx');
  assert.equal(config.url, 'https://qorqkcywoefkficspepx.supabase.co');
  assert.equal(config.secretKey, 'sb_secret_demo');
  assert.equal(config.storageBucket, 'uploads');
});
