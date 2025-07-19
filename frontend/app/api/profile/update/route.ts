import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    // Ensure Prisma client is ready
    await prisma.$connect();
    
    const body = await request.json();
    console.log('=== PROFILE UPDATE API ROUTE ===');
    console.log('Body:', body);
    
    const { 
      userId, 
      fullName, 
      email, 
      phoneNumber, 
      countryCode, 
      countryName, 
      currentPassword, 
      newPassword 
    } = body;

    console.log('Extracted fields:', {
      userId,
      fullName,
      email,
      phoneNumber,
      countryCode,
      countryName,
      currentPassword: currentPassword ? '***' : 'NOT_PROVIDED',
      newPassword: newPassword ? '***' : 'NOT_PROVIDED'
    });

    // Validate required fields
    if (!userId || isNaN(userId)) {
      console.log('Invalid user ID');
      return NextResponse.json({ error: 'Invalid user ID.' }, { status: 400 });
    }

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

    console.log('All required fields present, proceeding with validation...');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Email validation failed:', email);
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    console.log('Email validation passed');

    // Find user by ID
    const user = await prisma.registered.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('User not found:', userId);
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    console.log('User found:', { id: user.id, email: user.email });

    // Check if email is being changed and if it's already taken
    if (email !== user.email) {
      const existingUser = await prisma.registered.findUnique({
        where: { email: email.trim() }
      });

      if (existingUser) {
        console.log('Email already taken:', email);
        return NextResponse.json({ error: 'This email address is already in use.' }, { status: 400 });
      }
    }

    // If changing password, validate current password
    let passwordHash = user.passwordHash;
    if (newPassword) {
      if (!currentPassword) {
        console.log('Current password required for password change');
        return NextResponse.json({ error: 'Current password is required to change password.' }, { status: 400 });
      }

      // Validate current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        console.log('Invalid current password');
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
      }

      // Validate new password length
      if (newPassword.length < 8) {
        console.log('New password too short:', newPassword.length);
        return NextResponse.json({ error: 'New password must be at least 8 characters long.' }, { status: 400 });
      }

      // Hash new password
      const saltRounds = 12;
      passwordHash = await bcrypt.hash(newPassword, saltRounds);
      console.log('New password hashed successfully');
    }

    // Update user profile
    const updatedUser = await prisma.registered.update({
      where: { id: userId },
      data: {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        countryCode: countryCode.trim(),
        countryName: countryName.trim(),
        passwordHash: passwordHash,
      }
    });

    console.log('Profile updated successfully:', { id: updatedUser.id, email: updatedUser.email });

    // Return updated user data (without password hash)
    const userData = {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName
    };

    return NextResponse.json({ 
      message: 'Profile updated successfully!',
      user: userData
    }, { status: 200 });
    
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
} 