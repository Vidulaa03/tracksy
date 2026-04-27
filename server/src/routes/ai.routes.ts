import OpenAI from 'openai';
import express, { Response } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware.js';

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const groqClient = GROQ_API_KEY
  ? new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: GROQ_BASE_URL,
    })
  : null;

async function callGroq(
  messages: { role: 'system' | 'user'; content: string }[],
  temperature = 0.3
): Promise<string> {
  if (!groqClient) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  const response = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  return typeof content === 'string' ? content : '';
}

function buildMockParseResult() {
  return {
    companyName: 'Acme Cloud',
    role: 'Senior Frontend Engineer',
    requiredSkills: ['React', 'TypeScript', 'Next.js', 'REST APIs'],
    niceToHaveSkills: ['GraphQL', 'Docker', 'AWS'],
    seniority: 'Senior',
    location: 'Remote',
    salaryRange: '$110,000 - $135,000',
    keyRequirements: ['React expertise', '3+ years experience', 'TypeScript knowledge', 'REST API experience', 'Git version control'],
    skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'CSS', 'HTML'],
    experience: '3+ years in web development',
  };
}

function buildMockResumeBullets() {
  return [
    'Built responsive React applications using TypeScript and Next.js, improving developer efficiency by 30%',
    'Implemented REST API integrations with Node.js to support dynamic data sync across platforms',
    'Optimized UI performance and reduced load times through component memoization and lazy loading',
    'Collaborated with cross-functional teams to deliver scalable features and mentor junior engineers',
  ];
}

router.post('/parse-job', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { jobDescription } = z.object({ jobDescription: z.string().min(1) }).parse(req.body);

    if (!groqClient) {
      return res.json({ success: true, parsedData: buildMockParseResult() });
    }

    const content = await callGroq([
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
    res.json({
      success: true,
      parsedData: {
        ...parsedData,
        keyRequirements: parsedData.requiredSkills ?? [],
        skills: [...(parsedData.requiredSkills ?? []), ...(parsedData.niceToHaveSkills ?? [])].slice(0, 10),
        experience: parsedData.experience ?? 'Experience details unavailable',
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Job description required' });
    }

    res.status(500).json({ message: err.message || 'Failed to parse job description' });
  }
});

router.post('/resume-suggestions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { jobDescription, resumeContent } = z
      .object({ jobDescription: z.string().min(1), resumeContent: z.string().optional() })
      .parse(req.body);

    if (!groqClient) {
      return res.json({ success: true, bullets: buildMockResumeBullets() });
    }

    const resumeCtx = resumeContent
      ? `\n\nCandidate's existing resume:\n${resumeContent.slice(0, 1500)}`
      : '';

    const content = await callGroq(
      [
        {
          role: 'system',
          content: `You are an elite resume writer. Generate exactly 4 tailored resume bullet points.
Rules:
- Start each with a strong action verb (e.g. "Architected", "Reduced", "Owned")
- Be specific to this role's tech stack and seniority
- Include plausible metrics where appropriate
- Return ONLY a JSON array of 4 strings - no markdown, no preamble
Example: ["Built X using Y, reducing Z by 40%", ...]`,
        },
        { role: 'user', content: `Job Description:\n${jobDescription}${resumeCtx}` },
      ],
      0.7
    );

    const cleaned = content.replace(/```json|```/g, '').trim();
    const bullets = JSON.parse(cleaned);
    if (!Array.isArray(bullets)) {
      throw new Error('Unexpected response format');
    }

    res.json({ success: true, bullets });
  } catch (error: any) {
    console.error('AI ROUTE ERROR:', error);
    res.status(500).json({
      message: error.message || 'Failed to generate bullets',
    });
  }
});

export default router;
