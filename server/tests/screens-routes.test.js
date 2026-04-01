const test = require('node:test');
const assert = require('node:assert/strict');

const databaseModulePath = require.resolve('../config/database');
const authModulePath = require.resolve('../middleware/auth');
const rendererModulePath = require.resolve('../utils/konvaRenderer');
const designContentModulePath = require.resolve('../utils/designContent');
const routerModulePath = require.resolve('../routes/screens');

const loadRouterWithMocks = ({ fakeDbConnection, fakeRenderer }) => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
  delete require.cache[rendererModulePath];
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

  return require('../routes/screens');
};

const cleanupRouterMocks = () => {
  delete require.cache[routerModulePath];
  delete require.cache[databaseModulePath];
  delete require.cache[authModulePath];
  delete require.cache[rendererModulePath];
  delete require.cache[designContentModulePath];
};

test('screen list route filters active screens with integer flags and returns booleans', async () => {
  let receivedSql = null;
  let jsonBody = null;

  const fakeDbConnection = {
    async all(sql) {
      receivedSql = sql;
      return [
        {
          id: 1,
          name: 'Lobby',
          is_active: 1
        },
        {
          id: 2,
          name: 'Kiosco',
          is_active: 0
        }
      ];
    }
  };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: { renderWithKonva: async () => '<html></html>' }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {};
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

  assert.match(receivedSql, /WHERE s\.is_active = 1/);
  assert.equal(jsonBody[0].is_active, true);
  assert.equal(jsonBody[1].is_active, false);

  cleanupRouterMocks();
});

test('screen list route scopes screens to the authenticated business account', async () => {
  const allCalls = [];

  const fakeDbConnection = {
    async all(sql, params) {
      allCalls.push({ sql, params });
      return [];
    }
  };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: { renderWithKonva: async () => '<html></html>' }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/' && layer.route.methods.get
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      businessAccountId: 17,
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

  assert.equal(allCalls.length, 1);
  assert.match(allCalls[0].sql, /s\.business_account_id = \?/);
  assert.deepEqual(allCalls[0].params, [17]);

  cleanupRouterMocks();
});

test('screen update route accepts legacy active field and emits normalized socket payload', async () => {
  const runCalls = [];
  const emittedEvents = [];
  const roomEvents = [];

  const fakeDbConnection = {
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { changes: 1 };
    },
    async get() {
      return {
        id: 12,
        name: 'Totem',
        description: 'Pantalla vertical',
        is_active: false,
        refresh_interval: 15,
        width: 1080,
        height: 1920
      };
    }
  };

  const io = {
    emit(event, payload) {
      emittedEvents.push({ event, payload });
    },
    to(roomName) {
      return {
        emit(event, payload) {
          roomEvents.push({ roomName, event, payload });
        }
      };
    }
  };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: { renderWithKonva: async () => '<html></html>' }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/:id' && layer.route.methods.put
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      businessAccountId: 12,
      role: 'owner'
    },
    params: { id: '12' },
    body: { active: false },
    app: {
      get() {
        return io;
      }
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

  assert.equal(runCalls[0].params[2], 0);
  assert.equal(emittedEvents[0].event, 'screens-updated');
  assert.equal(roomEvents[0].event, 'screen-config-updated');
  assert.equal(roomEvents[0].payload.screenId, 12);
  assert.equal(roomEvents[0].payload.screen.id, 12);
  assert.equal(jsonBody.is_active, false);

  cleanupRouterMocks();
});

test('screen create route stores the authenticated business account id', async () => {
  const runCalls = [];

  const fakeDbConnection = {
    async get(sql) {
      if (sql.includes('COALESCE(MAX(display_order)')) {
        return { next_order: 3 };
      }

      return {
        id: 44,
        name: 'Nueva pantalla',
        business_account_id: 22,
        is_active: 1
      };
    },
    async run(sql, params) {
      runCalls.push({ sql, params });
      return { lastID: 44 };
    }
  };

  const io = { emit() {} };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: { renderWithKonva: async () => '<html></html>' }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      businessAccountId: 22,
      role: 'owner'
    },
    body: {
      name: 'Nueva pantalla'
    },
    app: {
      get() {
        return io;
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

  assert.match(runCalls[0].sql, /INSERT INTO screens \(business_account_id, name,/);
  assert.equal(runCalls[0].params[0], 22);

  cleanupRouterMocks();
});

test('assign design route renders normalized content and emits screen scoped updates', async () => {
  let renderPayload = null;
  const roomEvents = [];

  const fakeDbConnection = {
    async get(sql) {
      if (sql.includes('SELECT id FROM screens')) {
        return { id: 5 };
      }

      if (sql.includes('SELECT * FROM designs')) {
        return {
          id: 9,
          name: 'Promo QR',
          content: JSON.stringify({
            settings: {
              canvasWidth: 720,
              canvasHeight: 1280,
              orientation: 'portrait'
            }
          })
        };
      }

      return null;
    },
    async run() {
      return { changes: 1 };
    }
  };

  const io = {
    emit() {},
    to(roomName) {
      return {
        emit(event, payload) {
          roomEvents.push({ roomName, event, payload });
        }
      };
    }
  };

  const router = loadRouterWithMocks({
    fakeDbConnection,
    fakeRenderer: {
      async renderWithKonva(content) {
        renderPayload = content;
        return '<!DOCTYPE html><html><body>ok</body></html>';
      }
    }
  });

  const routeLayer = router.stack.find(
    (layer) => layer.route && layer.route.path === '/:id/assign-design' && layer.route.methods.post
  );
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    user: {
      actorType: 'business_user',
      businessAccountId: 5,
      role: 'owner'
    },
    params: { id: '5' },
    body: { designId: 9 },
    app: {
      get() {
        return io;
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

  assert.equal(renderPayload.width, 720);
  assert.equal(renderPayload.height, 1280);
  assert.equal(renderPayload.pages.length, 1);
  assert.equal(roomEvents[0].roomName, 'screen-5');
  assert.equal(roomEvents[1].event, 'design-content-updated');
  assert.equal(roomEvents[1].payload.screenId, 5);

  cleanupRouterMocks();
});
