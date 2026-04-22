import express, { Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import Resume from '../models/Resume';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = express.Router();

// ── Multer config ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'resumes');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// ── GET /resumes ─────────────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET /resumes/:id ─────────────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── POST /resumes/upload ─────────────────────────────────────────────────────
router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const title = req.body.title || req.file.originalname.replace(/\.pdf$/i, '');

    const resume = new Resume({
      userId:       req.userId,
      title,
      filename:     req.file.filename,
      originalName: req.file.originalname,
      filepath:     `uploads/resumes/${req.file.filename}`,
      size:         req.file.size,
      mimeType:     req.file.mimetype,
      isDefault:    false,
    });

    await resume.save();
    res.status(201).json(resume);
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// ── POST /resumes (legacy text create) ──────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({ title: z.string().min(1), content: z.string().min(1) }).parse(req.body);
    const resume = new Resume({ ...data, userId: req.userId });
    await resume.save();
    res.status(201).json(resume);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PATCH /resumes/:id (rename) ──────────────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title } = z.object({ title: z.string().min(1) }).parse(req.body);
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title },
      { new: true }
    );
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input' });
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PUT /resumes/:id (legacy full update) ───────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({ title: z.string().optional(), content: z.string().optional() }).parse(req.body);
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      data,
      { new: true }
    );
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── PATCH /resumes/:id/default ───────────────────────────────────────────────
router.patch('/:id/default', async (req: AuthRequest, res: Response) => {
  try {
    // unset current default
    await Resume.updateMany({ userId: req.userId }, { isDefault: false });
    // set new default
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isDefault: true },
      { new: true }
    );
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// ── DELETE /resumes/:id ──────────────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // delete file from disk if it exists
    if (resume.filename) {
      const filePath = path.join(process.cwd(), 'uploads', 'resumes', resume.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
