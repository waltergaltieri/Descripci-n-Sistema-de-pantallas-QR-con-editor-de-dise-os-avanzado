const { AsyncLocalStorage } = require('node:async_hooks');

const databaseContext = new AsyncLocalStorage();

const runWithDatabaseContext = async (callback) =>
  databaseContext.run({ txClient: null }, callback);

const getDatabaseContext = () => databaseContext.getStore();

const translatePlaceholders = (sql) => {
  let parameterIndex = 0;
  let translated = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let index = 0; index < sql.length; index += 1) {
    const current = sql[index];
    const previous = sql[index - 1];

    if (current === "'" && !inDoubleQuote && previous !== '\\') {
      inSingleQuote = !inSingleQuote;
      translated += current;
      continue;
    }

    if (current === '"' && !inSingleQuote && previous !== '\\') {
      inDoubleQuote = !inDoubleQuote;
      translated += current;
      continue;
    }

    if (current === '?' && !inSingleQuote && !inDoubleQuote) {
      parameterIndex += 1;
      translated += `$${parameterIndex}`;
      continue;
    }

    translated += current;
  }

  return translated;
};

const normalizeSql = (sql) => sql.trim().replace(/;+\s*$/g, '');

const createPostgresAdapter = ({ pool }) => {
  const adapter = {
    pool,
    manualTxClient: null,

    async get(sql, params = []) {
      const result = await adapter.query(sql, params);
      return result.rows[0] || undefined;
    },

    async all(sql, params = []) {
      const result = await adapter.query(sql, params);
      return result.rows;
    },

    async run(sql, params = []) {
      const normalizedSql = normalizeSql(sql);
      const translatedSql = translatePlaceholders(normalizedSql);
      const isInsert = /^insert\s+/i.test(normalizedSql);
      const isSelect = /^select\s+/i.test(normalizedSql);
      const hasReturning = /\breturning\b/i.test(normalizedSql);
      const sqlToExecute =
        isInsert && !hasReturning ? `${translatedSql} RETURNING id` : translatedSql;
      const result = await adapter.query(sqlToExecute, params);

      if (isSelect) {
        return result.rows;
      }

      return {
        lastID: result.rows[0]?.id || null,
        changes: result.rowCount || 0,
        rows: result.rows
      };
    },

    async exec(sql) {
      const normalizedSql = normalizeSql(sql);
      const upperSql = normalizedSql.toUpperCase();
      const context = getDatabaseContext();
      const activeTxClient = context?.txClient || adapter.manualTxClient;

      if (/^BEGIN(\s+TRANSACTION)?$/i.test(upperSql)) {
        const transactionClient = await pool.connect();
        await transactionClient.query('BEGIN');

        if (context) {
          context.txClient = transactionClient;
        } else {
          adapter.manualTxClient = transactionClient;
        }

        return { changes: 0 };
      }

      if (/^(COMMIT|ROLLBACK)$/i.test(upperSql)) {
        if (!activeTxClient) {
          return { changes: 0 };
        }

        await activeTxClient.query(upperSql);
        activeTxClient.release();

        if (context) {
          context.txClient = null;
        } else {
          adapter.manualTxClient = null;
        }

        return { changes: 0 };
      }

      await adapter.query(normalizedSql);
      return { changes: 0 };
    },

    async query(sql, params = []) {
      const translatedSql = translatePlaceholders(normalizeSql(sql));
      const context = getDatabaseContext();
      const executor = context?.txClient || adapter.manualTxClient || pool;
      return executor.query(translatedSql, params);
    },

    async close() {
      if (adapter.manualTxClient) {
        adapter.manualTxClient.release();
        adapter.manualTxClient = null;
      }

      if (typeof pool.end === 'function') {
        await pool.end();
      }
    }
  };

  return adapter;
};

module.exports = {
  createPostgresAdapter,
  runWithDatabaseContext,
  translatePlaceholders
};
