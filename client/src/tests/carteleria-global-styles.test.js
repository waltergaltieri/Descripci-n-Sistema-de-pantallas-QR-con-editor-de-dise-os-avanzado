const fs = require('fs');
const path = require('path');

describe('Estilos globales de Carteleria', () => {
  test('no fuerza un color global oscuro en headings, textos y botones', () => {
    const cssPath = path.resolve(__dirname, '../index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent).not.toMatch(
      /h1,\s*h2,\s*h3,\s*h4,\s*h5,\s*h6,\s*p,\s*span,\s*a,\s*button\s*\{[\s\S]*color:\s*#213547\s*!important;[\s\S]*\}/m
    );
  });
});
