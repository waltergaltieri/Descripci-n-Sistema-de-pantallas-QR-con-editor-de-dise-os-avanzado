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

test('supabase storage provider accepts the new project secret key env name', () => {
  const { getStorageProviderConfig } = loadStorageModule();
  const config = getStorageProviderConfig({
    SUPABASE_URL: 'https://demo.supabase.co',
    SUPABASE_SECRET_KEY: 'sb_secret_demo',
    SUPABASE_STORAGE_BUCKET: 'uploads'
  });

  assert.equal(config.provider, 'supabase');
  assert.equal(config.serviceRoleKey, 'sb_secret_demo');
});

test('supabase bucket security config mirrors backend upload restrictions', () => {
  const { getSupabaseBucketSecurityConfig, __internals } = loadStorageModule();
  const config = getSupabaseBucketSecurityConfig({});

  assert.equal(config.isPublic, true);
  assert.equal(config.fileSizeLimit, __internals.DEFAULT_MAX_FILE_SIZE_BYTES);
  assert.deepEqual(config.allowedMimeTypes, __internals.DEFAULT_ALLOWED_IMAGE_MIME_TYPES);
});

test('ensureSupabaseStorageBucket creates the bucket when it does not exist', async () => {
  const { ensureSupabaseStorageBucket } = loadStorageModule();
  const calls = [];
  const fakeClient = {
    storage: {
      async getBucket(bucket) {
        calls.push({ method: 'getBucket', bucket });
        return {
          data: null,
          error: { message: 'Bucket not found' }
        };
      },
      async createBucket(bucket, options) {
        calls.push({ method: 'createBucket', bucket, options });
        return { data: { name: bucket }, error: null };
      }
    }
  };

  const result = await ensureSupabaseStorageBucket(
    {
      UPLOAD_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://demo.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_demo',
      SUPABASE_STORAGE_BUCKET: 'uploads',
      MAX_FILE_SIZE: '1234'
    },
    { client: fakeClient }
  );

  assert.equal(result.action, 'created');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].method, 'createBucket');
  assert.equal(calls[1].options.public, true);
  assert.equal(calls[1].options.fileSizeLimit, 1234);
  assert.match(calls[1].options.allowedMimeTypes.join(','), /image\/svg\+xml/);
});

test('ensureSupabaseStorageBucket updates the bucket when it already exists', async () => {
  const { ensureSupabaseStorageBucket } = loadStorageModule();
  const calls = [];
  const fakeClient = {
    storage: {
      async getBucket(bucket) {
        calls.push({ method: 'getBucket', bucket });
        return {
          data: { name: bucket, public: true },
          error: null
        };
      },
      async updateBucket(bucket, options) {
        calls.push({ method: 'updateBucket', bucket, options });
        return { data: { name: bucket }, error: null };
      }
    }
  };

  const result = await ensureSupabaseStorageBucket(
    {
      UPLOAD_PROVIDER: 'supabase',
      SUPABASE_URL: 'https://demo.supabase.co',
      SUPABASE_SECRET_KEY: 'sb_secret_demo',
      SUPABASE_STORAGE_BUCKET: 'uploads'
    },
    { client: fakeClient }
  );

  assert.equal(result.action, 'updated');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].method, 'updateBucket');
});

test('normalizeSupabaseObjectPath keeps Supabase style paths and rewrites Windows separators', () => {
  const { normalizeSupabaseObjectPath } = loadStorageModule();

  assert.equal(
    normalizeSupabaseObjectPath({
      filename: 'demo.png',
      path: 'uploads\\demo.png'
    }),
    'uploads/demo.png'
  );

  assert.equal(
    normalizeSupabaseObjectPath({
      filename: 'demo.png',
      path: 'uploads/demo.png'
    }),
    'uploads/demo.png'
  );
});

test('resolveLegacyUploadSourcePath falls back to uploads directory by filename', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pantallasqr-legacy-uploads-'));
  const filename = 'legacy-demo.png';
  const filePath = path.join(tempDir, filename);
  fs.writeFileSync(filePath, 'demo');

  const { resolveLegacyUploadSourcePath } = loadStorageModule();
  const resolved = resolveLegacyUploadSourcePath(
    {
      filename,
      path: `uploads\\${filename}`
    },
    tempDir
  );

  assert.equal(resolved, filePath);
});
