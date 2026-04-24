import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { validateSignUp } from '@/lib/utils/validation';
import { isDemoMode, getServiceUnavailableResponse } from '@/lib/utils/demoMode';

export async function POST(request: NextRequest) {
  try {
    // Check if database is configured
    if (isDemoMode()) {
      return getServiceUnavailableResponse(
        'Demo mode active. Configure MONGODB_URI in .env.local to enable authentication.'
      );
    }

    await connectDB();

    const { email, password, name } = await request.json();

    // Validate input
    const validationErrors = validateSignUp(email, password, name);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    if (isDemoMode()) {
      const demoEmail = email.toLowerCase();
      const token = createToken('demo-user-123', demoEmail);
      await setAuthCookie(token);

      return NextResponse.json(
        {
          success: true,
          message: 'Demo account created successfully',
          user: {
            id: 'demo-user-123',
            email: demoEmail,
            name: name || 'Demo User',
          },
        },
        { status: 201 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email already registered',
          errors: [{ field: 'email', message: 'This email is already in use' }],
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      name,
    });

    await user.save();

    // Create JWT token
    const token = createToken(user._id.toString(), user.email);

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during signup',
      },
      { status: 500 }
    );
  }
}
