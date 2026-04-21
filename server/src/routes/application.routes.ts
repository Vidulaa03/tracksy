import express, { Response } from 'express';
import JobApplication from '../models/JobApplication';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = express.Router();

const createSchema = z.object({
  companyName:         z.string().min(1),
  position:            z.string().min(1),
  description:         z.string().optional().default(''),
  jobDescriptionLink:  z.string().optional(),
  notes:               z.string().optional().default(''),
  salaryRange:         z.string().optional(),
  appliedDate:         z.string().optional(),
  resumeBullets:       z.array(z.string()).optional(),
  parsedData:          z.object({
    companyName:      z.string().optional(),
    role:             z.string().optional(),
    requiredSkills:   z.array(z.string()).optional(),
    niceToHaveSkills: z.array(z.string()).optional(),
    seniority:        z.string().optional(),
    location:         z.string().optional(),
    salaryRange:      z.string().optional(),
  }).optional(),
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(['applied', 'phone_screen', 'interview', 'offer', 'rejected']).optional(),
});

// GET all
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const apps = await JobApplication.find({ userId: req.userId }).sort({ appliedDate: -1 });
    res.json(apps);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET one
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const app = await JobApplication.findOne({ _id: req.params.id, userId: req.userId });
    if (!app) return res.status(404).json({ message: 'Not found' });
    res.json(app);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST create
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const app = new JobApplication({ ...data, userId: req.userId });
    await app.save();
    res.status(201).json(app);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT update (supports partial — used for drag-and-drop status change)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);
    const app = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { ...data, lastUpdated: new Date() } },
      { new: true }
    );
    if (!app) return res.status(404).json({ message: 'Not found' });
    res.json(app);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const app = await JobApplication.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!app) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
