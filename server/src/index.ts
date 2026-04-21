import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
console.log("ENV KEY:", !!process.env.OPENAI_API_KEY);
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import resumeRoutes from './routes/resume.routes';
import aiRoutes from './routes/ai.routes';

// Middleware
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('MongoDB URI not configured. Running in demo mode.');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', authMiddleware, applicationRoutes);
app.use('/api/resumes', authMiddleware, resumeRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
