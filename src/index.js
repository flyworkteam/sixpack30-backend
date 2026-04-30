import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import contentRoutes from './routes/content.routes.js';
import trainingRoutes from './routes/training.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import workoutRoutes from './routes/workout.routes.js';
import notificationRoutes from './routes/notification.routes.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`>>> ${req.method} ${req.url}`);
  next();
});

app.use('/api/user', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'SixPack30 Backend API Çalışıyor!' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}...`);
});
