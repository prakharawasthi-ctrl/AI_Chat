import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.routes';
import { initSchema } from './db/client';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json({ limit: '10kb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use('/chat', chatRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  },
);

app.listen(PORT, async () => {
  try {
    await initSchema();
    console.log(`[${new Date().toISOString()}] Database schema initialized`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Schema init failed:`, err);
  }
  console.log(`[${new Date().toISOString()}] Server running on http://localhost:${PORT}`);
});
