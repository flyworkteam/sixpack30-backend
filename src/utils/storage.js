import fs from 'fs';
import path from 'path';

const STORAGE_ZONE = process.env.CDN_STORAGE_ZONE || 'sixpack30';
const ACCESS_KEY = process.env.CDN_ACCESS_KEY;
const STORAGE_ENDPOINT = 'https://storage.bunnycdn.com';

const EXT_CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

export function contentTypeFromExtension(ext) {
  return EXT_CONTENT_TYPES[ext.toLowerCase()] || 'application/octet-stream';
}

function encodeRemotePath(remotePath) {
  return remotePath
    .split('/')
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/**
 * Buffer'ı BunnyCDN Storage'a yükler. Başarılıysa CDN'deki göreli path döner.
 */
export async function uploadBufferToCdn(buffer, remotePath, contentType) {
  if (!ACCESS_KEY) {
    throw new Error('CDN_ACCESS_KEY tanımlı değil.');
  }

  const cleanRemotePath = encodeRemotePath(remotePath);
  const url = `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${cleanRemotePath}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      AccessKey: ACCESS_KEY,
      'Content-Type': contentType,
    },
    body: buffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CDN yükleme hatası (${response.status}): ${errorText}`);
  }

  return remotePath.replace(/^\/+/, '');
}

/**
 * Yerel dosyayı BunnyCDN'e yükler.
 */
export async function uploadToCdn(localFilePath, remotePath) {
  const fileBuffer = fs.readFileSync(localFilePath);
  const ext = path.extname(localFilePath);
  const contentType = contentTypeFromExtension(ext);
  await uploadBufferToCdn(fileBuffer, remotePath, contentType);
  return true;
}
