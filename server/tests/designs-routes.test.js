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

test('create from template route persists canonical content payload', async () => {
  let insertedContent = null;

  const fakeDbConnection = {
    async run(sql, params) {
      insertedContent = params[2];
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
