const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');
const authModulePath = require.resolve('../middleware/auth');
const storageModulePath = require.resolve('../config/storage');
const routerModulePath = require.resolve('../routes/uploads');

const loadRouterWithMocks = ({ fakeDbConnection, fakeStorageProvider }) => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
  delete require.cache[storageModulePath];

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

  require.cache[storageModulePath] = {
    id: storageModulePath,
    filename: storageModulePath,
    loaded: true,
    exports: {
      createStorageProvider: () => fakeStorageProvider
    }
  };

  return require('../routes/uploads');
};

const cleanupRouterMocks = () => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
  delete require.cache[storageModulePath];
};

test('single image upload route persists metadata from storage provider', async () => {
  const runCalls = [];
  const fakeStorageProvider = {
    async saveFile() {
      return {
        filename: 'stored-image.png',
        original_name: 'carta.png',
        mimetype: 'image/png',
        size: 1234,
        path: 'uploads/stored-image.png',
        url: 'https://storage.example.com/stored-image.png'
      };
    },
    async deleteFile() {}
  };

  const fakeDbConnection = {
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { lastID: 42 };
    },
    async get(sql) {
      if (sql.includes('SELECT * FROM uploads WHERE id = ?')) {
        return {
          id: 42,
          filename: 'stored-image.png',
          original_name: 'carta.png',
          url: 'https://storage.example.com/stored-image.png',
          size: 1234,
          mimetype: 'image/png',
          created_at: '2030-01-01T00:00:00Z'
        };
      }

      return null;
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection, fakeStorageProvider });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/image' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    file: {
      originalname: 'carta.png',
      mimetype: 'image/png',
      size: 1234,
      buffer: Buffer.from('png')
    }
  };

  let statusCode = 200;
  let jsonBody = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    }
  };

  await handler(req, res);

  assert.equal(statusCode, 201);
  assert.equal(jsonBody.id, 42);
  assert.equal(jsonBody.url, 'https://storage.example.com/stored-image.png');
  assert.equal(runCalls.length, 1);
  assert.equal(runCalls[0].params[0], 'stored-image.png');

  cleanupRouterMocks();
});

test('delete upload route removes file from configured storage provider', async () => {
  const deletedFiles = [];
  const fakeStorageProvider = {
    async saveFile() {
      throw new Error('saveFile no debe llamarse en este test');
    },
    async deleteFile(uploadRecord) {
      deletedFiles.push(uploadRecord);
    }
  };

  const fakeDbConnection = {
    async get() {
      return {
        id: 7,
        filename: 'stored-image.png',
        path: 'uploads/stored-image.png',
        url: 'https://storage.example.com/stored-image.png'
      };
    },
    async run() {
      return { changes: 1 };
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection, fakeStorageProvider });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/:id' && layer.route.methods.delete
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = { params: { id: '7' } };
  let jsonBody = null;
  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    }
  };

  await handler(req, res);

  assert.equal(jsonBody.message, 'Archivo eliminado exitosamente');
  assert.equal(deletedFiles.length, 1);
  assert.equal(deletedFiles[0].id, 7);

  cleanupRouterMocks();
});
