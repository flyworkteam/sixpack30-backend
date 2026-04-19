# SixPack30 Backend

Bu depo, SixPack30 mobil uygulamasının sadece backend (sunucu tarafı) kodlarını içermektedir.

## Teknolojiler
- Node.js
- TypeScript
- Express
- Prisma (MySQL)
- Firebase Admin SDK

## Kurulum
1. Gerekli paketleri yükleyin:
   ```bash
   npm install
   ```
2. `.env` dosyasını yapılandırın.
3. Prisma istemcisini oluşturun:
   ```bash
   npx prisma generate
   ```
4. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```
