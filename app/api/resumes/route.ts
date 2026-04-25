import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resume from '@/lib/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import { isDemoMode, getServiceUnavailableResponse } from '@/lib/utils/demoMode';

export async function GET(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return getServiceUnavailableResponse();
    }

    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const resumes = await Resume.find({ userId: user.userId }).sort({ createdAt: -1 });

    return NextResponse.json(
      {
        success: true,
        data: resumes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get resumes error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch resumes',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (isDemoMode()) {
      return getServiceUnavailableResponse();
    }

    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { content, title, version, structuredData } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Resume content is required',
          errors: [{ field: 'content', message: 'Resume content cannot be empty' }],
        },
        { status: 400 }
      );
    }

    const resume = new Resume({
      userId: user.userId,
      content,
      title: title || 'General Resume',
      version: version || 'v1',
      structuredData: structuredData || null,
    });

    await resume.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Resume created successfully',
        data: resume,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create resume error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create resume',
      },
      { status: 500 }
    );
  }
}
