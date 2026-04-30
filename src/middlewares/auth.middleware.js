import admin from '../config/firebase.js';

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
       res.status(401).json({ error: 'Yetkilendirme token\'ı bulunamadı. Lütfen giriş yapın.' });
       return;
    }

    const token = authHeader.split('Bearer ')[1];

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    res.status(403).json({ error: 'Geçersiz veya süresi dolmuş token.' });
  }
};
