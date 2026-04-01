#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');

const { db, initialize, close } = require('../config/database');
const { createSupabaseServiceClient } = require('../config/supabase');
const {
  normalizeSupabaseObjectPath,
  resolveLegacyUploadSourcePath
} = require('../config/storage');

dotenv.config({
  path: path.join(__dirname, '..', '.env')
});

const parseArgs = (argv) => ({
  dryRun: argv.includes('--dry-run')
});

const guessContentType = (uploadRecord) => {
  if (uploadRecord.mimetype) {
    return uploadRecord.mimetype;
  }

  const extension = path.extname(uploadRecord.filename || '').toLowerCase();

  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};

const syncLegacyUploadsToStorage = async ({ dryRun = false } = {}) => {
  const supabase = createSupabaseServiceClient();
  await initialize();

  try {
    const uploads = await db().all(
      `
        SELECT id, filename, path, url, mimetype
        FROM uploads
        ORDER BY id ASC
      `
    );

    let synced = 0;
    let skipped = 0;

    for (const uploadRecord of uploads) {
      const sourceFilePath = resolveLegacyUploadSourcePath(uploadRecord);

      if (!sourceFilePath) {
        skipped += 1;
        console.warn(`Archivo local no encontrado para upload ${uploadRecord.id}: ${uploadRecord.filename}`);
        continue;
      }

      const objectPath = normalizeSupabaseObjectPath(uploadRecord);
      const bucket = supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET);
      const fileBuffer = fs.readFileSync(sourceFilePath);
      const uploadResult = dryRun
        ? { error: null }
        : await bucket.upload(objectPath, fileBuffer, {
            contentType: guessContentType(uploadRecord),
            upsert: true
          });

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      const publicUrl = bucket.getPublicUrl(objectPath).data.publicUrl;

      if (!dryRun) {
        await db().run(
          `
            UPDATE uploads
            SET path = ?, url = ?
            WHERE id = ?
          `,
          [objectPath, publicUrl, uploadRecord.id]
        );
      }

      synced += 1;
    }

    console.log(
      JSON.stringify(
        {
          dryRun,
          total: uploads.length,
          synced,
          skipped
        },
        null,
        2
      )
    );
  } finally {
    await close();
  }
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  await syncLegacyUploadsToStorage({ dryRun: args.dryRun });
};

if (require.main === module) {
  main().catch((error) => {
    console.error('Error al sincronizar uploads legacy hacia Supabase Storage:', error);
    process.exitCode = 1;
  });
}

module.exports = {
  syncLegacyUploadsToStorage
};
