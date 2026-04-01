const test = require('node:test');
const assert = require('node:assert/strict');

const {
  extractUniqueFonts,
  sanitizeSvgForImageEmbedding
} = require('../utils/konvaRenderer');

test('extractUniqueFonts generates a valid Google Fonts query for italic Bahiana text', () => {
  const fontData = extractUniqueFonts({
    pages: [
      {
        children: [
          {
            id: 'text-1',
            type: 'text',
            fontFamily: 'Bahiana',
            fontStyle: 'italic',
            fontWeight: 'normal'
          }
        ]
      }
    ]
  });

  assert.deepEqual(fontData.googleFonts, ['Bahiana:ital,wght@0,400;0,700;1,400;1,700']);
  assert.deepEqual(fontData.fontFamilies, ['Bahiana']);
});

test('sanitizeSvgForImageEmbedding converts css flip transforms into svg transforms', () => {
  const input = '<svg viewBox="0 0 364 535" width="364" height="535"><g style="transform:scaleX(-1)scaleY(-1);" mask="url(#mask-1)"><rect width="10" height="10" /></g></svg>';

  const output = sanitizeSvgForImageEmbedding(input);

  assert.match(output, /transform="translate\(364 535\) scale\(-1 -1\)"/);
  assert.doesNotMatch(output, /style="transform:scaleX\(-1\)scaleY\(-1\);"/);
  assert.match(output, /mask="url\(#mask-1\)"/);
});
