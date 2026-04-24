import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/lib/models/User';
import { comparePassword, createToken, setAuthCookie } from '@/lib/auth';
import { validateEmail, validatePassword } from '@/lib/utils/validation';
import { isDemoMode, getServiceUnavailableResponse } from '@/lib/utils/demoMode';

export async function POST(request: NextRequest) {
  try {
    // Check if database is configured
    if (isDemoMode()) {
      return getServiceUnavailableResponse(
        'Demo mode active. Configure MONGODB_URI in .env.local to enable authentication.'
      );
    }

    const { email, password } = await request.json();

    // Validate input
    const emailErrors = validateEmail(email);
    const passwordErrors = validatePassword(password);
    const allErrors = [...emailErrors, ...passwordErrors];

    if (allErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation failed',
          errors: allErrors,
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
          message: 'Demo login successful',
          user: {
            id: 'demo-user-123',
            email: demoEmail,
            name: 'Demo User',
          },
        },
        { status: 200 }
      );
    }

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
          errors: [{ field: 'email', message: 'No account found with this email' }],
        },
        { status: 401 }
      );
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email or password',
          errors: [{ field: 'password', message: 'Password is incorrect' }],
        },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = createToken(user._id.toString(), user.email);

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login',
      },
      { status: 500 }
    );
  }
}
