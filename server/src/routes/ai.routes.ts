import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ── Shared OpenAI helper ────────────────────────────────────────────────────
async function callOpenAI(
  messages: { role: 'system' | 'user'; content: string }[],
  temperature = 0.3
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature,
      max_tokens: 1500,
    }),
  });
  if (!response.ok) {
    const err: any = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error ${response.status}`);
  }
  const data: any = await response.json();
  return data.choices[0]?.message?.content ?? '';
}

// ── POST /ai/parse-job ──────────────────────────────────────────────────────
router.post('/parse-job', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { jobDescription } = z.object({ jobDescription: z.string().min(1) }).parse(req.body);

    const content = await callOpenAI([
      {
        role: 'system',
        content: `You are a precise job description parser. Extract these fields and return ONLY valid JSON (no markdown):
{
  "companyName": "string",
  "role": "string",
  "requiredSkills": ["string"],
  "niceToHaveSkills": ["string"],
  "seniority": "string",
  "location": "string",
  "salaryRange": "string or null"
}
Use empty strings/arrays for missing fields.`,
      },
      { role: 'user', content: jobDescription },
    ]);

    const cleaned = content.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleaned);
    res.json({ success: true, parsedData });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Job description required' });
    res.status(500).json({ message: err.message || 'Failed to parse job description' });
  }
});

// ── POST /ai/resume-suggestions ─────────────────────────────────────────────
router.post('/resume-suggestions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { jobDescription, resumeContent } = z
      .object({ jobDescription: z.string().min(1), resumeContent: z.string().optional() })
      .parse(req.body);

    const resumeCtx = resumeContent
      ? `\n\nCandidate's existing resume:\n${resumeContent.slice(0, 1500)}`
      : '';

    const content = await callOpenAI(
      [
        {
          role: 'system',
          content: `You are an elite resume writer. Generate exactly 4 tailored resume bullet points.
Rules:
- Start each with a strong action verb (e.g. "Architected", "Reduced", "Owned")
- Be specific to this role's tech stack and seniority
- Include plausible metrics where appropriate
- Return ONLY a JSON array of 4 strings — no markdown, no preamble
Example: ["Built X using Y, reducing Z by 40%", ...]`,
        },
        { role: 'user', content: `Job Description:\n${jobDescription}${resumeCtx}` },
      ],
      0.7
    );

    const cleaned = content.replace(/```json|```/g, '').trim();
    const bullets = JSON.parse(cleaned);
    if (!Array.isArray(bullets)) throw new Error('Unexpected response format');
    res.json({ success: true, bullets });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Job description required' });
    res.status(500).json({ message: err.message || 'Failed to generate bullets' });
  }
});

export default router;
