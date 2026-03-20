const test = require('node:test');
const assert = require('node:assert/strict');

const router = require('../routes/carteleria');
const { assembleMenuPayload } = require('../utils/menuAssembler');

test('menu assembler keeps header as first block', () => {
  const output = assembleMenuPayload([
    { id: 10, block_type: 'category', sort_order: 1 },
    { id: 11, block_type: 'header', sort_order: 99 }
  ]);

  assert.equal(output[0].block_type, 'header');
  assert.equal(output[0].sort_order, 0);
  assert.equal(output[1].sort_order, 1);
});

test('carteleria router exposes menu deletion route', () => {
  const hasDeleteRoute = router.stack.some(
    (layer) => layer.route && layer.route.path === '/menus/:id' && layer.route.methods.delete
  );

  assert.equal(hasDeleteRoute, true);
});
