import {
  getMaskedImageFlipNormalization,
  normalizeDesignContent
} from '../utils/designContent';

const toSvgDataUrl = (markup) => `data:image/svg+xml;base64,${Buffer.from(markup, 'utf8').toString('base64')}`;
const fromSvgDataUrl = (value) => Buffer.from(value.split(',')[1], 'base64').toString('utf8');

describe('designContent mask flip normalization', () => {
  test('moves masked image flips into the clip svg', () => {
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

    expect(element.flipX).toBe(false);
    expect(element.flipY).toBe(false);
    expect(decodedMask).toMatch(/transform="translate\(300 200\) scale\(-1 -1\)"/);
  });

  test('returns live normalization data for masked image flips', () => {
    const maskSvg = '\n    <svg viewBox="0 0 300 200" width="300" height="200"><path d="M0 0 H300 V200 H0 Z" fill="black" /></svg>';

    const normalization = getMaskedImageFlipNormalization({
      type: 'image',
      clipSrc: toSvgDataUrl(maskSvg),
      flipX: true,
      flipY: false
    });

    const decodedMask = fromSvgDataUrl(normalization.clipSrc);

    expect(normalization.flipX).toBe(false);
    expect(normalization.flipY).toBe(false);
    expect(decodedMask).toMatch(/transform="translate\(300 0\) scale\(-1 1\)"/);
  });
});
