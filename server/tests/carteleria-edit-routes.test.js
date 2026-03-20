const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('../routes/carteleria');

const hasRoute = (path, method) =>
  router.stack.some(
    (layer) => layer.route && layer.route.path === path && layer.route.methods[method]
  );

test('carteleria router exposes edit routes for promotions and combos', () => {
  assert.equal(hasRoute('/promotions/:id', 'get'), true);
  assert.equal(hasRoute('/promotions/:id', 'put'), true);
  assert.equal(hasRoute('/combos/:id', 'get'), true);
  assert.equal(hasRoute('/combos/:id', 'put'), true);
});
