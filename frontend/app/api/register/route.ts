import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, password, countryCode, countryName } = body;

    // Validate required fields
    if (!fullName || !email || !phoneNumber || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.registered.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.registered.create({
      data: {
        fullName,
        email,
        phoneNumber,
        passwordHash,
        countryCode: countryCode || 'EG',
        countryName: countryName || 'Egypt',
      },
    });

    // Return user data without password
    const { passwordHash: _, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      success: true,
      message: 'Registration successful!',
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
} 