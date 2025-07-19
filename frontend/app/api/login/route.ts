import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('=== LOGIN API ROUTE ===');
    console.log('Body:', body);
    console.log('Body type:', typeof body);
    console.log('Body keys:', Object.keys(body));
    
    const { email, password, rememberMe } = body;

    console.log('Extracted fields:', {
      email: email,
      password: password ? '***' : 'MISSING',
      rememberMe: rememberMe
    });

    // Validate required fields
    if (!email || email.trim() === '') {
      console.log('Missing email');
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (!password || password.trim() === '') {
      console.log('Missing password');
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    console.log('All required fields present, proceeding with validation...');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Email validation failed:', email);
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    console.log('Email validation passed');

    // Validate password length
    if (password.length < 8) {
      console.log('Password too short:', password.length);
      return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
    }

    console.log('Password length validation passed');

    // Find user by email
    const user = await prisma.registered.findUnique({
      where: { email: email.trim() }
    });

    if (!user) {
      console.log('User not found:', email);
      return NextResponse.json({ error: 'No account found with this email address.' }, { status: 401 });
    }

    console.log('User found:', { id: user.id, email: user.email });

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    console.log('Password verified successfully');

    // Return user data (without password hash)
    const userData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName
    };

    console.log('Login successful, returning user data:', userData);

    // Set response headers for remember me functionality
    const response = NextResponse.json({ 
      message: 'Login successful!',
      user: userData
    }, { status: 200 });

    // If remember me is checked, set a longer session duration
    if (rememberMe) {
      console.log('Remember me enabled - setting longer session');
      // You can add session management here if needed
    }

    return response;
    
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
} 