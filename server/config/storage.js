const fs = require('node:fs');
const path = require('node:path');
const { v4: uuidv4 } = require('uuid');

const getStorageProviderConfig = (env = process.env) => {
  const explicitProvider = env.UPLOAD_PROVIDER?.trim().toLowerCase();
  const hasSupabaseCredentials =
    Boolean(env.SUPABASE_URL) &&
    Boolean(env.SUPABASE_SERVICE_ROLE_KEY) &&
    Boolean(env.SUPABASE_STORAGE_BUCKET);

  if (explicitProvider === 'supabase' || (!explicitProvider && hasSupabaseCredentials)) {
    return {
      provider: 'supabase',
      url: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      bucket: env.SUPABASE_STORAGE_BUCKET
    };
  }

  return {
    provider: 'local',
    uploadPath: env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads')
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
  const { createClient } = require('@supabase/supabase-js');
  const client = createClient(config.url, config.serviceRoleKey, {
    auth: { persistSession: false }
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
  getStorageProviderConfig
};
