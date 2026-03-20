const path = require('node:path');

const normalizeProvider = (value) => {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized === 'supabase' ? 'postgres' : normalized;
};

const getDatabaseProviderConfig = (env = process.env) => {
  const explicitProvider = normalizeProvider(env.DB_PROVIDER);
  const databaseUrl = env.DATABASE_URL || env.SUPABASE_DB_URL || '';
  const provider =
    explicitProvider || (databaseUrl ? 'postgres' : 'sqlite');

  if (provider === 'postgres') {
    return {
      provider,
      databaseUrl,
      ssl: env.DB_SSL === 'false' ? false : true
    };
  }

  return {
    provider: 'sqlite',
    sqlitePath: env.SQLITE_PATH || path.join(__dirname, '..', 'database.sqlite')
  };
};

module.exports = {
  getDatabaseProviderConfig
};
