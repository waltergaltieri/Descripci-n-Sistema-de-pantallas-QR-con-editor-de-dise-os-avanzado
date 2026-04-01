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
    },
    user: {
      actorType: 'business_user',
      businessAccountId: 3
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
  assert.equal(runCalls[0].params[0], 3);
  assert.equal(runCalls[0].params[1], 'stored-image.png');

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

  const req = {
    params: { id: '7' },
    user: {
      actorType: 'business_user',
      businessAccountId: 3
    }
  };
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

test('single image upload route stores the authenticated business account id', async () => {
  const runCalls = [];
  const fakeStorageProvider = {
    async saveFile() {
      return {
        filename: 'tenant-image.png',
        original_name: 'tenant.png',
        mimetype: 'image/png',
        size: 4321,
        path: 'uploads/tenant-image.png',
        url: 'https://storage.example.com/tenant-image.png'
      };
    },
    async deleteFile() {}
  };

  const fakeDbConnection = {
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { lastID: 52 };
    },
    async get() {
      return {
        id: 52,
        filename: 'tenant-image.png',
        original_name: 'tenant.png',
        url: 'https://storage.example.com/tenant-image.png',
        size: 4321,
        mimetype: 'image/png',
        created_at: '2030-01-01T00:00:00Z'
      };
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection, fakeStorageProvider });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/image' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    file: {
      originalname: 'tenant.png',
      mimetype: 'image/png',
      size: 4321,
      buffer: Buffer.from('png')
    },
    user: {
      actorType: 'business_user',
      businessAccountId: 9
    }
  };

  let statusCode = 200;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  await handler(req, res);

  assert.equal(statusCode, 201);
  assert.equal(runCalls.length, 1);
  assert.equal(runCalls[0].params[0], 9);

  cleanupRouterMocks();
});

test('list uploads route scopes results to the authenticated business account', async () => {
  const allCalls = [];
  const getCalls = [];
  const fakeStorageProvider = {
    async saveFile() {
      throw new Error('saveFile no debe llamarse en este test');
    },
    async deleteFile() {}
  };

  const fakeDbConnection = {
    async all(sql, params) {
      allCalls.push({ sql, params });
      return [];
    },
    async get(sql, params) {
      getCalls.push({ sql, params });
      return { count: 0 };
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection, fakeStorageProvider });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    query: {
      page: '1',
      limit: '20'
    },
    user: {
      actorType: 'business_user',
      businessAccountId: 14
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

  assert.equal(allCalls[0].sql.includes('business_account_id = ?'), true);
  assert.equal(allCalls[0].params[0], 14);
  assert.equal(getCalls[0].sql.includes('business_account_id = ?'), true);
  assert.equal(getCalls[0].params[0], 14);

  cleanupRouterMocks();
});

test('delete upload route deletes only uploads belonging to the authenticated business account', async () => {
  const getCalls = [];
  const runCalls = [];
  const fakeStorageProvider = {
    async saveFile() {
      throw new Error('saveFile no debe llamarse en este test');
    },
    async deleteFile() {}
  };

  const fakeDbConnection = {
    async get(sql, params) {
      getCalls.push({ sql, params });
      return {
        id: 7,
        filename: 'stored-image.png',
        path: 'uploads/stored-image.png',
        url: 'https://storage.example.com/stored-image.png'
      };
    },
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { changes: 1 };
    }
  };

  const router = loadRouterWithMocks({ fakeDbConnection, fakeStorageProvider });
  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/:id' && layer.route.methods.delete
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    params: { id: '7' },
    user: {
      actorType: 'business_user',
      businessAccountId: 22
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

  assert.equal(getCalls[0].sql.includes('business_account_id = ?'), true);
  assert.deepEqual(getCalls[0].params, ['7', 22]);
  assert.equal(runCalls[0].sql.includes('business_account_id = ?'), true);
  assert.deepEqual(runCalls[0].params, ['7', 22]);

  cleanupRouterMocks();
});
