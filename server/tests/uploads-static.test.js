const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const express = require('express');

const { createUploadsStaticMiddleware } = require('../utils/uploadsStatic');

test('uploads static middleware serves files with cross-origin resource policy', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantallasqr-uploads-'));
  const tempFilePath = path.join(tempDir, 'sample.png');
  fs.writeFileSync(tempFilePath, 'fake-image-content');

  const app = express();
  app.use('/uploads', createUploadsStaticMiddleware(tempDir));

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/uploads/sample.png`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cross-origin-resource-policy'), 'cross-origin');
    assert.equal(body, 'fake-image-content');
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
