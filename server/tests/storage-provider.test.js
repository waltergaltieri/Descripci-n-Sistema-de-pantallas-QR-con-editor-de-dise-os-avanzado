const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const storageModulePath = require.resolve('../config/storage');

const loadStorageModule = () => {
  delete require.cache[storageModulePath];
  return require('../config/storage');
};

test('defaults to local upload provider', () => {
  const { getStorageProviderConfig } = loadStorageModule();
  const config = getStorageProviderConfig({});

  assert.equal(config.provider, 'local');
  assert.match(config.uploadPath, /uploads$/);
});

test('local storage provider writes and deletes uploaded files', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantallasqr-storage-'));
  const { createStorageProvider } = loadStorageModule();
  const storage = createStorageProvider({
    UPLOAD_PROVIDER: 'local',
    UPLOAD_PATH: tempDir
  });

  const saved = await storage.saveFile({
    originalname: 'logo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('hola mundo'),
    size: 10
  });

  assert.ok(saved.filename);
  assert.ok(saved.url.startsWith('/uploads/'));
  assert.equal(fs.existsSync(saved.path), true);

  await storage.deleteFile(saved);

  assert.equal(fs.existsSync(saved.path), false);
});

test('supabase storage provider config is selected when credentials are present', () => {
  const { getStorageProviderConfig } = loadStorageModule();
  const config = getStorageProviderConfig({
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
    SUPABASE_STORAGE_BUCKET: 'uploads'
  });

  assert.equal(config.provider, 'supabase');
  assert.equal(config.bucket, 'uploads');
});
