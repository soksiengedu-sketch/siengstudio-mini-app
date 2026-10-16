import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'siengstudio';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || 'https://pub-4b78689722284f9d94a646dcd8cff942.r2.dev').replace(/\/+$/, '');

export function isR2Configured() {
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

let s3Client = null;
function getS3Client() {
  if (!s3Client && isR2Configured()) {
    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

/**
 * Generate Presigned Upload URL for direct browser PUT to Cloudflare R2
 */
export async function generatePresignedUploadUrl(fileName, contentType = 'video/mp4', folder = 'uploads') {
  if (!isR2Configured()) {
    return {
      configured: false,
      message: 'R2 credentials (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) not set in environment.'
    };
  }

  const client = getS3Client();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = folder ? `${folder}/${Date.now()}_${cleanFileName}` : `${Date.now()}_${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // URL valid for 1 hour (3600 seconds)
  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  return {
    configured: true,
    presignedUrl,
    publicUrl,
    key,
    bucket: R2_BUCKET_NAME
  };
}

/**
 * Direct server-side upload of buffer to Cloudflare R2
 */
export async function uploadBufferToR2(buffer, fileName, contentType = 'video/mp4', folder = 'uploads') {
  if (!isR2Configured()) {
    return {
      configured: false,
      message: 'R2 credentials not configured'
    };
  }

  const client = getS3Client();
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = folder ? `${folder}/${Date.now()}_${cleanFileName}` : `${Date.now()}_${cleanFileName}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  return {
    configured: true,
    publicUrl,
    key,
    bucket: R2_BUCKET_NAME
  };
}
