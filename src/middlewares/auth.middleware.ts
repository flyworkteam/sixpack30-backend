import type { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';

// Express isteğine (req) user nesnesini ekleyebilmek için arayüzü genişletiyoruz
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       res.status(401).json({ error: 'Yetkilendirme token\'ı bulunamadı. Lütfen giriş yapın.' });
       return;
    }

    const token = authHeader.split('Bearer ')[1];

    // Token'ı Firebase Admin üzerinden doğruluyoruz
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Doğrulanan kullanıcı bilgilerini (uid, email vb.) req.user içine atıyoruz
    req.user = decodedToken;
    
    // Her şey yolundaysa işlemi bir sonraki katmana (controller) geçir
    next();
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token.' });
  }
};
