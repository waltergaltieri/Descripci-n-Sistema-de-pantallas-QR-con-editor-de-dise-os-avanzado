const fs = require('node:fs');
const path = require('node:path');
const { v4: uuidv4 } = require('uuid');
const {
  createSupabaseServiceClient,
  getSupabaseServerConfig
} = require('./supabase');

const DEFAULT_ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const DEFAULT_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const DEFAULT_LOCAL_UPLOADS_DIRECTORY = path.join(__dirname, '..', 'uploads');

const parsePositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeSupabaseObjectPath = (uploadRecord = {}) => {
  if (uploadRecord.path && typeof uploadRecord.path === 'string') {
    const normalizedPath = uploadRecord.path.replace(/\\/g, '/').replace(/^\/+/, '');

    if (normalizedPath.startsWith('uploads/')) {
      return normalizedPath;
    }
  }

  if (!uploadRecord.filename) {
    throw new Error('No se pudo resolver el object path del upload sin filename');
  }

  return `uploads/${uploadRecord.filename}`;
};

const resolveLegacyUploadSourcePath = (
  uploadRecord = {},
  uploadsDirectory = DEFAULT_LOCAL_UPLOADS_DIRECTORY
) => {
  const candidatePaths = [];

  if (typeof uploadRecord.path === 'string' && uploadRecord.path.trim()) {
    candidatePaths.push(uploadRecord.path);
  }

  if (uploadRecord.filename) {
    candidatePaths.push(path.join(uploadsDirectory, uploadRecord.filename));
  }

  for (const candidate of candidatePaths) {
    const resolvedCandidate = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(uploadsDirectory, candidate);

    if (fs.existsSync(resolvedCandidate)) {
      return resolvedCandidate;
    }
  }

  return null;
};

const getSupabaseBucketSecurityConfig = (env = process.env) => ({
  isPublic: env.SUPABASE_STORAGE_PUBLIC === 'false' ? false : true,
  fileSizeLimit: parsePositiveInteger(env.MAX_FILE_SIZE, DEFAULT_MAX_FILE_SIZE_BYTES),
  allowedMimeTypes: DEFAULT_ALLOWED_IMAGE_MIME_TYPES
});

const getStorageProviderConfig = (env = process.env) => {
  const explicitProvider = env.UPLOAD_PROVIDER?.trim().toLowerCase();
  const supabaseConfig = getSupabaseServerConfig(env);
  const hasSupabaseCredentials =
    Boolean(supabaseConfig.url) &&
    Boolean(supabaseConfig.secretKey) &&
    Boolean(supabaseConfig.storageBucket);

  if (explicitProvider === 'supabase' || (!explicitProvider && hasSupabaseCredentials)) {
    return {
      provider: 'supabase',
      url: supabaseConfig.url,
      serviceRoleKey: supabaseConfig.secretKey,
      bucket: supabaseConfig.storageBucket,
      bucketSecurity: getSupabaseBucketSecurityConfig(env)
    };
  }

  return {
    provider: 'local',
    uploadPath: env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads')
  };
};

const ensureSupabaseStorageBucket = async (env = process.env, options = {}) => {
  const config = getStorageProviderConfig(env);

  if (config.provider !== 'supabase') {
    return { provider: config.provider, skipped: true };
  }

  const client = options.client || createSupabaseServiceClient({
    SUPABASE_URL: config.url,
    SUPABASE_SECRET_KEY: config.serviceRoleKey,
    SUPABASE_STORAGE_BUCKET: config.bucket
  });
  const desiredBucketConfig = {
    public: config.bucketSecurity.isPublic,
    fileSizeLimit: config.bucketSecurity.fileSizeLimit,
    allowedMimeTypes: config.bucketSecurity.allowedMimeTypes
  };

  const existingBucketResult = await client.storage.getBucket(config.bucket);

  if (existingBucketResult.error) {
    const message = existingBucketResult.error.message?.toLowerCase() || '';
    const bucketMissing = message.includes('not found') || message.includes('does not exist');

    if (!bucketMissing) {
      throw existingBucketResult.error;
    }

    const createResult = await client.storage.createBucket(config.bucket, desiredBucketConfig);

    if (createResult.error) {
      throw createResult.error;
    }

    return {
      provider: 'supabase',
      bucket: config.bucket,
      action: 'created',
      config: desiredBucketConfig
    };
  }

  const updateResult = await client.storage.updateBucket(config.bucket, desiredBucketConfig);

  if (updateResult.error) {
    throw updateResult.error;
  }

  return {
    provider: 'supabase',
    bucket: config.bucket,
    action: 'updated',
    config: desiredBucketConfig
  };
};

const ensureDirectory = (directoryPath) => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const createLocalStorageProvider = (config) => {
  ensureDirectory(config.uploadPath);

  return {
    provider: 'local',

    async saveFile(file) {
      const filename = `${uuidv4()}${path.extname(file.originalname || '')}`;
      const destinationPath = path.join(config.uploadPath, filename);

      fs.writeFileSync(destinationPath, file.buffer);

      return {
        filename,
        path: destinationPath,
        url: `/uploads/${filename}`,
        size: file.size,
        mimetype: file.mimetype,
        original_name: file.originalname
      };
    },

    async deleteFile(uploadRecord) {
      if (uploadRecord?.path && fs.existsSync(uploadRecord.path)) {
        fs.unlinkSync(uploadRecord.path);
      }
    }
  };
};

const createSupabaseStorageProvider = (config) => {
  const client = createSupabaseServiceClient({
    SUPABASE_URL: config.url,
    SUPABASE_SECRET_KEY: config.serviceRoleKey,
    SUPABASE_STORAGE_BUCKET: config.bucket
  });

  return {
    provider: 'supabase',

    async saveFile(file) {
      const filename = `${uuidv4()}${path.extname(file.originalname || '')}`;
      const objectPath = `uploads/${filename}`;
      const bucket = client.storage.from(config.bucket);
      const uploadResult = await bucket.upload(objectPath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      const publicUrlResult = bucket.getPublicUrl(objectPath);

      return {
        filename,
        path: objectPath,
        url: publicUrlResult.data.publicUrl,
        size: file.size,
        mimetype: file.mimetype,
        original_name: file.originalname
      };
    },

    async deleteFile(uploadRecord) {
      if (!uploadRecord?.path) {
        return;
      }

      const bucket = client.storage.from(config.bucket);
      const deleteResult = await bucket.remove([uploadRecord.path]);

      if (deleteResult.error) {
        throw deleteResult.error;
      }
    }
  };
};

const createStorageProvider = (env = process.env) => {
  const config = getStorageProviderConfig(env);

  if (config.provider === 'supabase') {
    return createSupabaseStorageProvider(config);
  }

  return createLocalStorageProvider(config);
};

module.exports = {
  createStorageProvider,
  getStorageProviderConfig,
  getSupabaseBucketSecurityConfig,
  ensureSupabaseStorageBucket,
  normalizeSupabaseObjectPath,
  resolveLegacyUploadSourcePath,
  __internals: {
    DEFAULT_ALLOWED_IMAGE_MIME_TYPES,
    DEFAULT_MAX_FILE_SIZE_BYTES,
    DEFAULT_LOCAL_UPLOADS_DIRECTORY,
    parsePositiveInteger,
    normalizeSupabaseObjectPath,
    resolveLegacyUploadSourcePath
  }
};
