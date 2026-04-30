import fs from 'fs';
import path from 'path';

const STORAGE_ZONE = process.env.CDN_STORAGE_ZONE || 'sixpack30';
const ACCESS_KEY = process.env.CDN_ACCESS_KEY;
const STORAGE_ENDPOINT = 'https://storage.bunnycdn.com';

/**
 */
export async function uploadToCdn(localFilePath, remotePath) {
  if (!ACCESS_KEY) {
    console.error('Hata: CDN_ACCESS_KEY .env dosyasında bulunamadı.');
    return false;
  }

  try {
    const fileBuffer = fs.readFileSync(localFilePath);
    
    const cleanRemotePath = remotePath
      .split('/')
      .map(segment => segment.trim())
      .filter(segment => segment.length > 0)
      .map(segment => encodeURIComponent(segment))
      .join('/');
      
    const url = `${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${cleanRemotePath}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'AccessKey': ACCESS_KEY,
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer
    });

    if (response.ok) {
      console.log(`✅ Başarıyla yüklendi: ${remotePath}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Yükleme hatası (${response.status}): ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Beklenmedik hata:`, error);
    return false;
  }
}
