const { createClient } = require('@supabase/supabase-js');

const getSupabaseProjectId = (env = process.env) =>
  env.SUPABASE_PROJECT_ID?.trim() || null;

const getSupabaseProjectUrl = (env = process.env) => {
  const explicitUrl = env.SUPABASE_URL?.trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const projectId = getSupabaseProjectId(env);
  return projectId ? `https://${projectId}.supabase.co` : null;
};

const getSupabaseSecretKey = (env = process.env) =>
  env.SUPABASE_SECRET_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim() || null;

const getSupabaseServerConfig = (env = process.env) => ({
  projectId: getSupabaseProjectId(env),
  url: getSupabaseProjectUrl(env),
  secretKey: getSupabaseSecretKey(env),
  storageBucket: env.SUPABASE_STORAGE_BUCKET?.trim() || null
});

const createSupabaseServiceClient = (env = process.env) => {
  const config = getSupabaseServerConfig(env);

  if (!config.url) {
    throw new Error('SUPABASE_URL o SUPABASE_PROJECT_ID es requerido');
  }

  if (!config.secretKey) {
    throw new Error('SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY es requerido');
  }

  return createClient(config.url, config.secretKey, {
    auth: { persistSession: false }
  });
};

module.exports = {
  createSupabaseServiceClient,
  getSupabaseProjectId,
  getSupabaseProjectUrl,
  getSupabaseSecretKey,
  getSupabaseServerConfig
};
