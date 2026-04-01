const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractAnimations
} = require('../utils/animationsEngine');

test('extractAnimations returns animations from nested group children', () => {
  const designData = {
    pages: [
      {
        id: 'page-1',
        children: [
          {
            id: 'group-1',
            type: 'group',
            children: [
              {
                id: 'text-1',
                type: 'text',
                custom: {
                  animation: {
                    type: 'pulse',
                    duration: 2000,
                    delay: 0,
                    loop: true
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  };

  const animations = extractAnimations(designData);

  assert.equal(animations.length, 1);
  assert.deepEqual(animations[0], {
    elementIndex: 0,
    elementId: 'text-1',
    elementType: 'text',
    animation: {
      type: 'pulse',
      duration: 2000,
      delay: 0,
      loop: true
    }
  });
});
