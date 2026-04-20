import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, '../../sixpack30-f3484-cbf89df3e6b3.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  console.log('Firebase Admin SDK başarıyla başlatıldı.');
} catch (error) {
  console.error('Firebase Admin SDK başlatılırken hata oluştu:', error);
}

export default admin;
