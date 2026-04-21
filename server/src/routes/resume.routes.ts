import express, { Response } from 'express';
import Resume from '../models/Resume';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = express.Router();
const schema = z.object({ title: z.string().min(1), content: z.string().min(1) });

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    res.json(await Resume.find({ userId: req.userId }).sort({ createdAt: -1 }));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const r = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = schema.parse(req.body);
    const r = await new Resume({ ...data, userId: req.userId }).save();
    res.status(201).json(r);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = schema.partial().parse(req.body);
    const r = await Resume.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, data, { new: true });
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json(r);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const r = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!r) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

export default router;
