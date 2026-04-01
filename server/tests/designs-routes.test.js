const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');
const authModulePath = require.resolve('../middleware/auth');
const rendererModulePath = require.resolve('../utils/konvaRenderer');
const autoSvgExporterModulePath = require.resolve('../utils/autoSvgExporter');
const designContentModulePath = require.resolve('../utils/designContent');
const routerModulePath = require.resolve('../routes/designs');

const loadRouterWithMocks = ({ fakeDbConnection, fakeRenderer, fakeAutoSvgExporter }) => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
  delete require.cache[rendererModulePath];
  delete require.cache[autoSvgExporterModulePath];
  delete require.cache[designContentModulePath];

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
      requireAdmin: (req, res, next) => next(),
      optionalAuth: (req, res, next) => next()
    }
  };

  require.cache[rendererModulePath] = {
    id: rendererModulePath,
    filename: rendererModulePath,
    loaded: true,
    exports: fakeRenderer
  };

  require.cache[autoSvgExporterModulePath] = {
    id: autoSvgExporterModulePath,
    filename: autoSvgExporterModulePath,
    loaded: true,
    exports: fakeAutoSvgExporter
  };

  return require('../routes/designs');
};

const cleanupRouterMocks = () => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
  delete require.cache[rendererModulePath];
  delete require.cache[autoSvgExporterModulePath];
  delete require.cache[designContentModulePath];
};

test('design list route returns assigned screens and normalized content', async () => {
  const fakeDbConnection = {
    async all(sql) {
      if (sql.includes('FROM designs d')) {
        return [
          {
            id: 5,
            name: 'Pantalla Lobby',
            description: 'Diseño principal',
            content: JSON.stringify({
              width: 1080,
              height: 1920,
              pages: [
                {
                  id: 'page-1',
                  width: 1080,
                  height: 1920,
                  background: '#ffffff',
                  children: []
                }
              ],
              settings: {
                canvasWidth: 1080,
                canvasHeight: 1920,
                orientation: 'portrait'
              }
            }),
            assigned_screens_count: 1
          }
        ];
      }

      return [
        {
          design_id: 5,
          id: 99,
          name: 'Recepción'
        }
      ];
    }
  };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: { renderWithKonva: async () => '<html></html>' },
    fakeAutoSvgExporter: { separateAndExportToSVG: async () => ({ success: true, statistics: { successfulExports: 0 } }) }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = { user: null };
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

  assert.equal(jsonBody.length, 1);
  assert.equal(jsonBody[0].assigned_screens_count, 1);
  assert.deepEqual(jsonBody[0].assigned_screens, [{ id: 99, name: 'Recepción' }]);
  assert.equal(jsonBody[0].content.settings.canvasWidth, 1080);
  assert.equal(jsonBody[0].content.settings.orientation, 'portrait');

  cleanupRouterMocks();
});

test('design list route scopes designs to the authenticated business account', async () => {
  const allCalls = [];

  const fakeDbConnection = {
    async all(sql, params) {
      allCalls.push({ sql, params });
      return [];
    }
  };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: { renderWithKonva: async () => '<html></html>' },
    fakeAutoSvgExporter: { separateAndExportToSVG: async () => ({ success: true, statistics: { successfulExports: 0 } }) }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      businessAccountId: 31,
      role: 'owner'
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

  assert.equal(allCalls.length, 2);
  assert.match(allCalls[0].sql, /d\.business_account_id = \?/);
  assert.deepEqual(allCalls[0].params, [31]);
  assert.match(allCalls[1].sql, /d\.business_account_id = \?/);
  assert.deepEqual(allCalls[1].params, [31, 31]);

  cleanupRouterMocks();
});

test('create from template route persists canonical content payload', async () => {
  let insertedContent = null;

  const fakeDbConnection = {
    async run(sql, params) {
      insertedContent = params[3];
      return { lastID: 77 };
    },
    async get(sql) {
      if (sql.includes('SELECT * FROM designs WHERE id = ?')) {
        return {
          id: 77,
          name: 'Nuevo diseño',
          description: 'Desde plantilla',
          content: insertedContent,
          thumbnail: null
        };
      }

      return null;
    },
    async all() {
      return [];
    }
  };

  const emittedEvents = [];
  const io = {
    emit(event, payload) {
      emittedEvents.push({ event, payload });
    }
  };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: { renderWithKonva: async () => '<html></html>' },
    fakeAutoSvgExporter: { separateAndExportToSVG: async () => ({ success: true, statistics: { successfulExports: 0 } }) }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/from-template' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      businessAccountId: 19,
      role: 'owner'
    },
    body: {
      templateId: 'template-welcome',
      name: 'Nuevo diseño',
      description: 'Desde plantilla'
    },
    app: {
      get() {
        return io;
      }
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

  const normalizedContent = JSON.parse(insertedContent);
  assert.equal(statusCode, 201);
  assert.equal(normalizedContent.pages.length, 1);
  assert.equal(normalizedContent.settings.canvasWidth, 1920);
  assert.equal(normalizedContent.settings.orientation, 'landscape');
  assert.equal(jsonBody.assigned_screens_count, 0);
  assert.equal(emittedEvents[0].event, 'designs-updated');

  cleanupRouterMocks();
});

test('create design route stores the authenticated business account id', async () => {
  const runCalls = [];

  const fakeDbConnection = {
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { lastID: 88 };
    },
    async get(sql) {
      if (sql.includes('SELECT * FROM designs WHERE id = ?')) {
        return {
          id: 88,
          business_account_id: 41,
          name: 'Tenant design',
          description: null,
          content: JSON.stringify({ pages: [] }),
          thumbnail: null
        };
      }

      return null;
    },
    async all() {
      return [];
    }
  };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: { renderWithKonva: async () => '<html></html>' },
    fakeAutoSvgExporter: { separateAndExportToSVG: async () => ({ success: true, statistics: { successfulExports: 0 } }) }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      businessAccountId: 41,
      role: 'owner'
    },
    body: {
      name: 'Tenant design',
      content: { pages: [] }
    },
    app: {
      get() {
        return { emit() {} };
      }
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

  const insertCall = runCalls.find(({ sql }) => sql.includes('INSERT INTO designs'));
  assert.ok(insertCall);
  assert.match(insertCall.sql, /INSERT INTO designs \(business_account_id, name, description, content, thumbnail\)/);
  assert.equal(insertCall.params[0], 41);

  cleanupRouterMocks();
});
