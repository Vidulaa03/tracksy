import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Resume from '@/lib/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import mongoose from 'mongoose';
import { isDemoMode, getServiceUnavailableResponse } from '@/lib/utils/demoMode';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      return getServiceUnavailableResponse();
    }

    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return NextResponse.json({ success: false, message: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId.toString() !== user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(
      {
        success: true,
        data: resume,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch resume',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      return getServiceUnavailableResponse();
    }

    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
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

    const resume = await Resume.findById(id);

    if (!resume) {
      return NextResponse.json({ success: false, message: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId.toString() !== user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    resume.content = content;
    if (typeof title === 'string') resume.title = title;
    if (typeof version === 'string') resume.version = version;
    resume.structuredData = structuredData || null;
    await resume.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Resume updated successfully',
        data: resume,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update resume error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update resume',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (isDemoMode()) {
      return getServiceUnavailableResponse();
    }

    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    }

    const resume = await Resume.findById(id);

    if (!resume) {
      return NextResponse.json({ success: false, message: 'Resume not found' }, { status: 404 });
    }

    if (resume.userId.toString() !== user.userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await Resume.deleteOne({ _id: id });

    return NextResponse.json(
      {
        success: true,
        message: 'Resume deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete resume',
      },
      { status: 500 }
    );
  }
}
