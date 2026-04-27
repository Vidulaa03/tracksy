import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';
import { z } from 'zod';

const router = express.Router();

const signupSchema = z.object({
  email:    z.string().email(),
  name:     z.string().min(2),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
});

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function makeToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}

function userPayload(user: any) {
  return { id: user._id, email: user.email, name: user.name, createdAt: user.createdAt };
}

const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  name: 'Demo User',
  createdAt: new Date().toISOString(),
};

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { email, name, password } = signupSchema.parse(req.body);

    if (!process.env.MONGODB_URI) {
      const token = makeToken(DEMO_USER.id, email);
      return res.status(201).json({ token, user: { ...DEMO_USER, email, name: name || DEMO_USER.name } });
    }

    if (await User.findOne({ email: email.toLowerCase() })) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await new User({ email: email.toLowerCase(), name, password: hashed }).save();
    res.status(201).json({ token: makeToken(String(user._id), user.email), user: userPayload(user) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    if (!process.env.MONGODB_URI) {
      const token = makeToken(DEMO_USER.id, email.toLowerCase());
      return res.json({ token, user: { ...DEMO_USER, email: email.toLowerCase() } });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: makeToken(String(user._id), user.email), user: userPayload(user) });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.MONGODB_URI) {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      const decoded = token ? jwt.verify(token, JWT_SECRET) as any : null;
      return res.json({ user: { id: DEMO_USER.id, email: decoded?.email || DEMO_USER.email, name: DEMO_USER.name, createdAt: DEMO_USER.createdAt } });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: userPayload(user) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
});

export default router;
