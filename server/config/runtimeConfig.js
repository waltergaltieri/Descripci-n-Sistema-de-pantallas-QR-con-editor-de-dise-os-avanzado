const { getDatabaseProviderConfig } = require('./databaseProviderConfig');
const { getStorageProviderConfig } = require('./storage');

const getRuntimeConfigWarnings = (env = process.env) => {
  const databaseConfig = getDatabaseProviderConfig(env);
  const storageConfig = getStorageProviderConfig(env);
  const warnings = [];

  if (databaseConfig.provider === 'postgres' && storageConfig.provider === 'local') {
    warnings.push(
      'Configuracion riesgosa: estas usando Postgres con uploads locales. ' +
        'Esto funciona solo si la base y los archivos viven en el mismo entorno; ' +
        'si compartis la base entre maquinas o deployments, las imagenes pueden quedar rotas.'
    );
  }

  return warnings;
};

module.exports = {
  getRuntimeConfigWarnings
};
