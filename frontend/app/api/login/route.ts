import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.registered.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Return user data without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      success: true,
      message: 'Login successful!',
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
} 