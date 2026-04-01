const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeDesignContent } = require('../utils/designContent');

const toSvgDataUrl = (markup) => `data:image/svg+xml;base64,${Buffer.from(markup, 'utf8').toString('base64')}`;
const fromSvgDataUrl = (value) => Buffer.from(value.split(',')[1], 'base64').toString('utf8');

test('normalizeDesignContent moves masked image flips into the mask svg', () => {
  const maskSvg = '\n    <svg viewBox="0 0 300 200" width="300" height="200"><defs><clipPath id="shape"><path d="M0 0 H300 V200 H0 Z" /></clipPath></defs><path d="M0 0 H300 V200 H0 Z" fill="black" /></svg>';

  const normalized = normalizeDesignContent({
    width: 1920,
    height: 1080,
    pages: [
      {
        width: 1920,
        height: 1080,
        children: [
          {
            id: 'masked-image',
            type: 'image',
            src: 'https://example.com/image.jpg',
            clipSrc: toSvgDataUrl(maskSvg),
            flipX: true,
            flipY: true
          }
        ]
      }
    ]
  });

  const element = normalized.pages[0].children[0];
  const decodedMask = fromSvgDataUrl(element.clipSrc);

  assert.equal(element.flipX, false);
  assert.equal(element.flipY, false);
  assert.match(decodedMask, /transform="translate\(300 200\) scale\(-1 -1\)"/);
});
