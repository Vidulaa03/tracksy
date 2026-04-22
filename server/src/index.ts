import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';

import authRoutes        from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import resumeRoutes      from './routes/resume.routes';
import aiRoutes          from './routes/ai.routes';

import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler }   from './middleware/error.middleware';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Serve uploaded files as static ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ── Database ─────────────────────────────────────────────────────────────────
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('MongoDB URI not configured. Running in demo mode.');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

connectDB();

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth',          authRoutes);
app.use('/applications',  authMiddleware, applicationRoutes);
app.use('/resumes',       authMiddleware, resumeRoutes);
app.use('/ai',            aiRoutes);

app.get('/health', (_req: Request, res: Response) => res.json({ status: 'ok' }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
