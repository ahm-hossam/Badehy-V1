import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Ensure Prisma client is ready
    await prisma.$connect();
    
    const body = await request.json();
    console.log('=== REGISTRATION API ROUTE ===');
    console.log('Body:', body);
    console.log('Body type:', typeof body);
    console.log('Body keys:', Object.keys(body));
    
    const { fullName, email, phoneNumber, countryCode, countryName, password, confirmPassword } = body;

    console.log('Extracted fields:', {
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      countryName: countryName,
      password: password ? '***' : 'MISSING',
      confirmPassword: confirmPassword ? '***' : 'MISSING'
    });

    // Validate required fields with proper string checks
    if (!fullName || fullName.trim() === '') {
      console.log('Missing fullName');
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    if (!email || email.trim() === '') {
      console.log('Missing email');
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      console.log('Missing phoneNumber');
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    if (!countryCode || countryCode.trim() === '') {
      console.log('Missing countryCode');
      return NextResponse.json({ error: 'Country code is required.' }, { status: 400 });
    }

    if (!countryName || countryName.trim() === '') {
      console.log('Missing countryName');
      return NextResponse.json({ error: 'Country name is required.' }, { status: 400 });
    }

    if (!password || password.trim() === '') {
      console.log('Missing password');
      return NextResponse.json({ error: 'Password is required.' }, { status: 400 });
    }

    if (!confirmPassword || confirmPassword.trim() === '') {
      console.log('Missing confirmPassword');
      return NextResponse.json({ error: 'Please confirm your password.' }, { status: 400 });
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

    // Validate password match
    if (password !== confirmPassword) {
      console.log('Password mismatch');
      return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 });
    }

    console.log('Password match validation passed');

    // Check if user already exists
    const existingUser = await prisma.registered.findUnique({
      where: { email: email.trim() }
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 400 });
    }

    console.log('User does not exist, proceeding with registration...');

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    console.log('Password hashed successfully');

    // Create the user in the database
    const newUser = await prisma.registered.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        countryCode: countryCode.trim(),
        countryName: countryName.trim(),
        passwordHash: passwordHash
      }
    });

    console.log('User created successfully:', { id: newUser.id, email: newUser.email });

    return NextResponse.json({ 
      message: 'Registration successful! Please login.',
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
} 