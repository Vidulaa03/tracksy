import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// Placeholder AI parsing endpoint
// This can be connected to Groq via the OpenAI-compatible SDK when needed
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { jobDescription } = await request.json();

    if (!jobDescription || jobDescription.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Job description is required',
        },
        { status: 400 }
      );
    }

    // Mock response - replace with a Groq API call when key is available
    const mockParsedData = {
      companyName: 'Acme Cloud',
      role: 'Senior Frontend Engineer',
      requiredSkills: ['React', 'TypeScript', 'Next.js', 'REST APIs'],
      niceToHaveSkills: ['GraphQL', 'Docker', 'AWS'],
      seniority: 'Senior',
      location: 'Remote',
      salaryRange: '$110,000 - $135,000',
      keyRequirements: [
        'React expertise',
        '3+ years experience',
        'TypeScript knowledge',
        'REST API experience',
        'Git version control',
      ],
      skills: ['React', 'TypeScript', 'JavaScript', 'Node.js', 'CSS', 'HTML'],
      experience: '3+ years in web development',
    };

    return NextResponse.json(
      {
        success: true,
        message: 'Job description parsed successfully (mock data)',
        parsedData: mockParsedData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Parse job error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to parse job description',
      },
      { status: 500 }
    );
  }
}
