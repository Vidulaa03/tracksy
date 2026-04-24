import OpenAI from 'openai';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const groqClient = GROQ_API_KEY
  ? new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: GROQ_BASE_URL,
    })
  : null;

interface ParseJobResponse {
  keyRequirements: string[];
  skills: string[];
  experience: string;
  salaryRange: string;
}

interface ResumeSuggestionResponse {
  keySkills: string[];
  recommendedChanges: string[];
  strengthAreas: string[];
}

export async function parseJobDescription(
  jobDescription: string
): Promise<ParseJobResponse> {
  if (!groqClient) {
    return {
      keyRequirements: [
        'Proficiency in React or similar framework',
        '3+ years of professional experience',
        'Strong problem-solving skills',
        'Experience with REST APIs',
        'Knowledge of Git and version control',
      ],
      skills: ['React', 'JavaScript', 'TypeScript', 'Node.js', 'CSS', 'HTML', 'Git'],
      experience: '3+ years in software development',
      salaryRange: '$80,000 - $120,000 per year',
    };
  }

  try {
    const response = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content:
            'Extract structured information from job descriptions. Return valid JSON with keyRequirements, skills, experience, and salaryRange.',
        },
        {
          role: 'user',
          content: `Parse this job description and extract:\n1. Key requirements\n2. Required skills\n3. Experience level\n4. Salary range\n\n${jobDescription}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected Groq response format');
    }

    return parseJobResponse(content);
  } catch (error) {
    console.error('Error parsing job description:', error);
    throw error;
  }
}

export async function getResumeSuggestions(
  resumeContent: string,
  jobDescription: string
): Promise<ResumeSuggestionResponse> {
  if (!groqClient) {
    return {
      keySkills: ['React', 'TypeScript', 'Node.js', 'REST APIs', 'Git'],
      recommendedChanges: [
        'Highlight your React and TypeScript projects more prominently in the experience section',
        'Add specific achievements with metrics (e.g., performance improvements, bug reduction %)',
        'Include examples of REST API design and implementation',
        'Emphasize leadership and teamwork experiences',
        'Add any certifications or continuous learning',
      ],
      strengthAreas: [
        'Strong full-stack development experience',
        'Good variety of project types and technologies',
        'Clear explanation of technical accomplishments',
      ],
    };
  }

  try {
    const response = await groqClient.chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert resume writer and career coach. Return valid JSON with keySkills, recommendedChanges, and strengthAreas.',
        },
        {
          role: 'user',
          content: `Analyze this resume against the job description and provide suggestions:\n\nResume:\n${resumeContent}\n\nJob Description:\n${jobDescription}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Unexpected Groq response format');
    }

    return parseResumeSuggestions(content);
  } catch (error) {
    console.error('Error generating resume suggestions:', error);
    throw error;
  }
}

function parseJobResponse(content: string): ParseJobResponse {
  const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());

  return {
    keyRequirements: Array.isArray(parsed.keyRequirements) ? parsed.keyRequirements : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    experience: typeof parsed.experience === 'string' ? parsed.experience : 'Not specified',
    salaryRange: typeof parsed.salaryRange === 'string' ? parsed.salaryRange : 'Not specified',
  };
}

function parseResumeSuggestions(content: string): ResumeSuggestionResponse {
  const parsed = JSON.parse(content.replace(/```json|```/g, '').trim());

  return {
    keySkills: Array.isArray(parsed.keySkills) ? parsed.keySkills : [],
    recommendedChanges: Array.isArray(parsed.recommendedChanges)
      ? parsed.recommendedChanges
      : [],
    strengthAreas: Array.isArray(parsed.strengthAreas) ? parsed.strengthAreas : [],
  };
}
