import express, { Response } from 'express';
import { z } from 'zod';

import JobApplication from '../models/JobApplication';
import Resume from '../models/Resume';
import ResumeUsageHistory from '../models/ResumeUsageHistory';
import { AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

const parsedDataSchema = z.object({
  companyName: z.string().optional(),
  role: z.string().optional(),
  requiredSkills: z.array(z.string()).optional(),
  niceToHaveSkills: z.array(z.string()).optional(),
  seniority: z.string().optional(),
  location: z.string().optional(),
  salaryRange: z.string().optional(),
}).optional();

const createSchema = z.object({
  companyName: z.string().min(1),
  position: z.string().min(1),
  description: z.string().optional().default(''),
  jobDescriptionLink: z.string().optional(),
  notes: z.string().optional().default(''),
  salaryRange: z.string().optional(),
  appliedDate: z.string().optional(),
  linkedResumeId: z.string().nullable().optional(),
  events: z.array(z.object({
    stage: z.enum(['Phone Screen', 'Interview', 'Offer', 'Custom']),
    title: z.string().min(1),
    scheduledAt: z.string(),
    notes: z.string().optional(),
  })).optional(),
  resumeBullets: z.array(z.string()).optional(),
  parsedData: parsedDataSchema,
});

const updateSchema = createSchema.partial().extend({
  status: z.enum(['applied', 'phone_screen', 'interview', 'offer', 'rejected']).optional(),
});

async function ensureLinkedResume(userId: string, linkedResumeId?: string | null) {
  if (!linkedResumeId) return null;
  const resume = await Resume.findOne({ _id: linkedResumeId, userId }).lean();
  if (!resume) throw new Error('Selected resume was not found');
  return resume;
}

async function updateResumeLastUsed(userId: string, resumeId?: string | null) {
  if (!resumeId) return;
  const latestApp = await JobApplication.findOne({ userId, linkedResumeId: resumeId })
    .sort({ lastUpdated: -1, appliedDate: -1 })
    .select('lastUpdated appliedDate')
    .lean();

  await Resume.findOneAndUpdate(
    { _id: resumeId, userId },
    { lastUsedAt: latestApp ? new Date(latestApp.lastUpdated ?? latestApp.appliedDate) : null }
  );
}

async function serializeApplication(app: any, includeHistory = false) {
  const linkedResume = app.linkedResumeId && typeof app.linkedResumeId === 'object'
    ? {
        _id: String(app.linkedResumeId._id),
        title: app.linkedResumeId.title,
        originalName: app.linkedResumeId.originalName,
        filepath: app.linkedResumeId.filepath,
        updatedAt: app.linkedResumeId.updatedAt,
        tags: app.linkedResumeId.tags ?? [],
        targetRole: app.linkedResumeId.targetRole,
      }
    : null;

  const base = {
    ...app,
    linkedResumeId: linkedResume?._id ?? (typeof app.linkedResumeId === 'string' ? app.linkedResumeId : null),
    linkedResume,
    events: (app.events ?? []).map((event: any) => ({
      stage: event.stage,
      title: event.title,
      scheduledAt: event.scheduledAt,
      notes: event.notes ?? '',
    })),
  };

  if (!includeHistory) return base;

  const history = await ResumeUsageHistory.find({ applicationId: app._id })
    .populate('oldResumeId', 'title')
    .populate('newResumeId', 'title')
    .sort({ changedAt: -1 })
    .lean();

  return {
    ...base,
    resumeHistory: history.map((entry: any) => ({
      _id: String(entry._id),
      changedAt: entry.changedAt,
      oldResume: entry.oldResumeId ? { _id: String(entry.oldResumeId._id), title: entry.oldResumeId.title } : null,
      newResume: entry.newResumeId ? { _id: String(entry.newResumeId._id), title: entry.newResumeId.title } : null,
    })),
  };
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const apps = await JobApplication.find({ userId: req.userId })
      .sort({ appliedDate: -1 })
      .populate('linkedResumeId', 'title originalName filepath updatedAt tags targetRole')
      .lean();
    res.json(await Promise.all(apps.map((app) => serializeApplication(app))));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const app = await JobApplication.findOne({ _id: req.params.id, userId: req.userId })
      .populate('linkedResumeId', 'title originalName filepath updatedAt tags targetRole')
      .lean();
    if (!app) return res.status(404).json({ message: 'Not found' });
    res.json(await serializeApplication(app, true));
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    await ensureLinkedResume(req.userId!, data.linkedResumeId);

    const app = new JobApplication({
      ...data,
      userId: req.userId,
      linkedResumeId: data.linkedResumeId || null,
    });
    await app.save();

    if (data.linkedResumeId) {
      await ResumeUsageHistory.create({
        userId: req.userId,
        applicationId: app._id,
        oldResumeId: null,
        newResumeId: data.linkedResumeId,
      });
      await updateResumeLastUsed(req.userId!, data.linkedResumeId);
    }

    const saved = await JobApplication.findById(app._id)
      .populate('linkedResumeId', 'title originalName filepath updatedAt tags targetRole')
      .lean();
    res.status(201).json(await serializeApplication(saved, true));
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(400).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await JobApplication.findOne({ _id: req.params.id, userId: req.userId });
    if (!existing) return res.status(404).json({ message: 'Not found' });

    await ensureLinkedResume(req.userId!, data.linkedResumeId);

    const previousResumeId = existing.linkedResumeId ? String(existing.linkedResumeId) : null;
    const nextResumeId = data.linkedResumeId === undefined ? previousResumeId : data.linkedResumeId;

    const updated = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        $set: {
          ...data,
          linkedResumeId: nextResumeId || null,
          lastUpdated: new Date(),
        },
      },
      { new: true }
    )
      .populate('linkedResumeId', 'title originalName filepath updatedAt tags targetRole')
      .lean();

    if (previousResumeId !== (nextResumeId || null)) {
      await ResumeUsageHistory.create({
        userId: req.userId,
        applicationId: req.params.id,
        oldResumeId: previousResumeId,
        newResumeId: nextResumeId || null,
      });
      await updateResumeLastUsed(req.userId!, previousResumeId);
      await updateResumeLastUsed(req.userId!, nextResumeId || null);
    }

    res.json(await serializeApplication(updated, true));
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', errors: err.errors });
    res.status(400).json({ message: err instanceof Error ? err.message : 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const app = await JobApplication.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!app) return res.status(404).json({ message: 'Not found' });

    await updateResumeLastUsed(req.userId!, app.linkedResumeId ? String(app.linkedResumeId) : null);
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
