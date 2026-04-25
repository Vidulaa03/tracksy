import crypto from 'crypto';
import express, { Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { z } from 'zod';

import Resume from '../models/Resume';
import JobApplication from '../models/JobApplication';
import { AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and DOC/DOCX files are allowed'));
  },
});

const metadataSchema = z.object({
  targetRole: z.string().trim().optional().or(z.literal('')),
  skills: z.array(z.string().trim()).optional(),
  experienceLevel: z.enum(['student', 'fresher', 'junior', 'mid', 'senior', 'lead']).optional(),
  tags: z.array(z.string().trim()).optional(),
});

const renameSchema = z.object({ title: z.string().trim().min(1) });

const resumeUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  content: z.string().optional(),
  targetRole: z.string().trim().optional().or(z.literal('')),
  skills: z.array(z.string().trim()).optional(),
  experienceLevel: z.enum(['student', 'fresher', 'junior', 'mid', 'senior', 'lead']).optional().nullable(),
  tags: z.array(z.string().trim()).optional(),
});

function parseMetadata(input: unknown) {
  if (!input) return {};
  if (typeof input === 'string') {
    try {
      return metadataSchema.parse(JSON.parse(input));
    } catch {
      return {};
    }
  }
  try {
    return metadataSchema.parse(input);
  } catch {
    return {};
  }
}

function normalizeList(items?: string[]) {
  return [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))];
}

function getFileHash(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function serializeResume(resume: any, userId: string) {
  const linkedApps = await JobApplication.find({ userId, linkedResumeId: resume._id })
    .select('status appliedDate lastUpdated companyName position')
    .lean();

  const interviews = linkedApps.filter((app) => ['interview', 'offer'].includes(app.status)).length;
  const offers = linkedApps.filter((app) => app.status === 'offer').length;
  const lastUsedAt = linkedApps.reduce<Date | null>((latest, app) => {
    const candidate = new Date(app.lastUpdated ?? app.appliedDate);
    if (!latest || candidate > latest) return candidate;
    return latest;
  }, resume.lastUsedAt ? new Date(resume.lastUsedAt) : null);

  return {
    ...resume,
    linkedApplicationsCount: linkedApps.length,
    applicationsUsedIn: linkedApps.length,
    interviewCount: interviews,
    offerCount: offers,
    successRate: linkedApps.length ? Math.round((offers / linkedApps.length) * 100) : 0,
    lastUsedAt: lastUsedAt?.toISOString() ?? null,
  };
}

async function updateResumeLastUsed(resumeId: string | null | undefined, userId: string) {
  if (!resumeId) return;
  const latestUsage = await JobApplication.findOne({ userId, linkedResumeId: resumeId })
    .sort({ lastUpdated: -1, appliedDate: -1 })
    .select('lastUpdated appliedDate')
    .lean();

  await Resume.findOneAndUpdate(
    { _id: resumeId, userId },
    { lastUsedAt: latestUsage ? new Date(latestUsage.lastUpdated ?? latestUsage.appliedDate) : null }
  );
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const resumes = await Resume.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();
    const enriched = await Promise.all(resumes.map((resume) => serializeResume(resume, req.userId!)));
    res.json(enriched);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(await serializeResume(resume, req.userId!));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const metadata = parseMetadata(req.body.metadata);
    const title = (req.body.title || req.file.originalname.replace(/\.(pdf|docx|doc)$/i, '')).trim();
    const fileHash = getFileHash(req.file.path);
    const existing = await Resume.findOne({ userId: req.userId, fileHash });

    if (existing) {
      fs.unlinkSync(req.file.path);
      return res.status(409).json({ message: 'This resume already exists.', duplicateResumeId: existing._id });
    }

    const resume = new Resume({
      userId: req.userId,
      title,
      targetRole: metadata.targetRole || undefined,
      skills: normalizeList(metadata.skills),
      experienceLevel: metadata.experienceLevel,
      tags: normalizeList(metadata.tags),
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: `uploads/resumes/${req.file.filename}`,
      size: req.file.size,
      mimeType: req.file.mimetype,
      fileHash,
      isDefault: (await Resume.countDocuments({ userId: req.userId })) === 0,
    });

    await resume.save();
    res.status(201).json(await serializeResume(resume.toObject(), req.userId!));
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({ title: z.string().min(1), content: z.string().min(1) }).parse(req.body);
    const resume = new Resume({
      ...data,
      userId: req.userId,
      isDefault: (await Resume.countDocuments({ userId: req.userId })) === 0,
    });
    await resume.save();
    res.status(201).json(await serializeResume(resume.toObject(), req.userId!));
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const source = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!source) return res.status(404).json({ message: 'Resume not found' });

    const duplicate = new Resume({
      userId: req.userId,
      title: `${source.title} Copy`,
      targetRole: source.targetRole,
      skills: source.skills,
      experienceLevel: source.experienceLevel,
      tags: source.tags,
      content: source.content,
      filename: source.filename,
      originalName: source.originalName,
      filepath: source.filepath,
      size: source.size,
      mimeType: source.mimeType,
      fileHash: source.fileHash ? `${source.fileHash}-copy-${Date.now()}` : undefined,
      isDefault: false,
    });

    await duplicate.save();
    res.status(201).json(await serializeResume(duplicate.toObject(), req.userId!));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title } = renameSchema.parse(req.body);
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { title },
      { new: true, lean: true }
    );
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(await serializeResume(resume, req.userId!));
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/default', async (req: AuthRequest, res: Response) => {
  try {
    await Resume.updateMany({ userId: req.userId }, { isDefault: false });
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isDefault: true },
      { new: true, lean: true }
    );
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(await serializeResume(resume, req.userId!));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/replace', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Resume not found' });
    }

    const fileHash = getFileHash(req.file.path);
    const duplicate = await Resume.findOne({ userId: req.userId, fileHash, _id: { $ne: req.params.id } });
    if (duplicate) {
      fs.unlinkSync(req.file.path);
      return res.status(409).json({ message: 'This resume already exists.', duplicateResumeId: duplicate._id });
    }

    if (resume.filename) {
      const oldPath = path.join(process.cwd(), 'uploads', 'resumes', resume.filename);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    resume.filename = req.file.filename;
    resume.originalName = req.file.originalname;
    resume.filepath = `uploads/resumes/${req.file.filename}`;
    resume.size = req.file.size;
    resume.mimeType = req.file.mimetype;
    resume.fileHash = fileHash;
    await resume.save();

    res.json(await serializeResume(resume.toObject(), req.userId!));
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Replace failed' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = resumeUpdateSchema.parse(req.body);
    const normalized = {
      ...data,
      skills: data.skills ? normalizeList(data.skills) : undefined,
      tags: data.tags ? normalizeList(data.tags) : undefined,
      experienceLevel: data.experienceLevel === null ? undefined : data.experienceLevel,
    };

    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        ...normalized,
      },
      { new: true, lean: true }
    );
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(await serializeResume(resume, req.userId!));
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input' });
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.userId });
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    const linkedCount = await JobApplication.countDocuments({ userId: req.userId, linkedResumeId: resume._id });
    if (linkedCount > 0) {
      return res.status(409).json({ message: `This resume is still linked to ${linkedCount} application(s). Replace it before deleting.`, linkedCount });
    }

    await Resume.deleteOne({ _id: resume._id });

    if (resume.filename) {
      const filePath = path.join(process.cwd(), 'uploads', 'resumes', resume.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    if (resume.isDefault) {
      const fallback = await Resume.findOne({ userId: req.userId }).sort({ createdAt: -1 });
      if (fallback) {
        fallback.isDefault = true;
        await fallback.save();
      }
    }

    await updateResumeLastUsed(req.params.id, req.userId!);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
