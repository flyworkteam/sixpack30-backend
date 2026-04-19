import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes';
import contentRoutes from './routes/content.routes';
import trainingRoutes from './routes/training.routes';
import webhookRoutes from './routes/webhook.routes';
import workoutRoutes from './routes/workout.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const port = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(express.json()); // Gelen JSON isteklerini ayrıştırmak için

// Rota tanımlamaları
app.use('/api/user', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/notifications', notificationRoutes);

// Temel Test (Sağlık Kontrolü) Rotası
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'SixPack30 Backend API Çalışıyor!' });
});

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresi üzerinde çalışıyor...`);
});
