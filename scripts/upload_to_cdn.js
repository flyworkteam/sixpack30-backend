import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadToCdn } from '../src/utils/storage.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 */
async function uploadDirectory(localDir, remoteBaseDir = '') {
  if (!fs.existsSync(localDir)) {
    console.error(`Hata: '${localDir}' klasörü bulunamadı.`);
    return;
  }

  const items = fs.readdirSync(localDir);

  for (const item of items) {
    const localPath = path.join(localDir, item);
    const remotePath = remoteBaseDir ? `${remoteBaseDir}/${item}` : item;
    const stat = fs.statSync(localPath);

    if (stat.isDirectory()) {
      await uploadDirectory(localPath, remotePath);
    } else {
      if (item.startsWith('.')) continue;

      if (item.toLowerCase().endsWith('.svg')) {
        console.log(`Atlanıyor (SVG): ${item}`);
        continue;
      }
      
      const allowedExtensions = ['.png', '.jpg', '.jpeg', '.mp4', '.mov', '.webm', '.gif'];
      const ext = path.extname(item).toLowerCase();
      
      if (!allowedExtensions.includes(ext)) {
        console.log(`Atlanıyor (Desteklenmeyen Uzantı): ${item}`);
        continue;
      }

      console.log(`Yükleniyor: ${localPath} -> ${remotePath}`);
      await uploadToCdn(localPath, remotePath);
    }
  }
}

const args = process.argv.slice(2);
const sourceDir = args[0];
const targetDir = args[1] || '';

if (!sourceDir) {
  console.log('Kullanım: node scripts/upload_to_cdn.js <yerel_klasör> [hedef_cdn_klasörü]');
  console.log('Örnek: node scripts/upload_to_cdn.js ./assets/exercises exercises');
  process.exit(1);
}

console.log('--- BunnyCDN Yükleme İşlemi Başlıyor ---');
uploadDirectory(path.resolve(sourceDir), targetDir)
  .then(() => {
    console.log('--- İşlem Tamamlandı ---');
  })
  .catch(err => {
    console.error('Kritik Hata:', err);
  });
