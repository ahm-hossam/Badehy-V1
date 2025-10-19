import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Simple test endpoint to see what's being received
router.post('/test', (req, res) => {
  console.log('=== TEST ENDPOINT ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body));
  res.json({ 
    message: 'Test received', 
    body: req.body,
    bodyKeys: Object.keys(req.body),
    contentType: req.headers['content-type']
  });
});

router.post('/', async (req, res) => {
  console.log('=== REGISTRATION ENDPOINT ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body));
  
  const { fullName, email, phoneNumber, countryCode, countryName, password, confirmPassword } = req.body;

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
    return res.status(400).json({ error: 'Full name is required.' });
  }

  if (!email || email.trim() === '') {
    console.log('Missing email');
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!phoneNumber || phoneNumber.trim() === '') {
    console.log('Missing phoneNumber');
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  if (!countryCode || countryCode.trim() === '') {
    console.log('Missing countryCode');
    return res.status(400).json({ error: 'Country code is required.' });
  }

  if (!countryName || countryName.trim() === '') {
    console.log('Missing countryName');
    return res.status(400).json({ error: 'Country name is required.' });
  }

  if (!password || password.trim() === '') {
    console.log('Missing password');
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (!confirmPassword || confirmPassword.trim() === '') {
    console.log('Missing confirmPassword');
    return res.status(400).json({ error: 'Please confirm your password.' });
  }

  console.log('All required fields present, proceeding with validation...');

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('Email validation failed:', email);
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  console.log('Email validation passed');

  // Validate password length
  if (password.length < 8) {
    console.log('Password too short:', password.length);
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  console.log('Password length validation passed');

  // Validate password match
  if (password !== confirmPassword) {
    console.log('Password mismatch');
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  console.log('Password match validation passed');

  try {
    // Check if email already exists
    const existingEmail = await prisma.registered.findUnique({ where: { email } });
    if (existingEmail) {
      console.log('Email already exists:', email);
      return res.status(400).json({ error: 'Email already registered.' });
    }

    console.log('Email uniqueness check passed');

    // Check if phone number already exists (with country code)
    const existingPhone = await prisma.registered.findFirst({ 
      where: { 
        phoneNumber,
        countryCode 
      } 
    });
    if (existingPhone) {
      console.log('Phone already exists:', { phoneNumber, countryCode });
      return res.status(400).json({ error: 'Phone number already registered.' });
    }

    console.log('Phone uniqueness check passed');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.registered.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        countryCode: countryCode.trim(),
        countryName: countryName.trim(),
        passwordHash,
      },
    });

    console.log('User created successfully:', { id: newUser.id, email: newUser.email });
    // Return user payload so the frontend can hydrate immediately if desired
    const { passwordHash: _pwd, ...safeUser } = newUser as any;
    return res.status(201).json({ message: 'Registration successful!', user: safeUser });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

export default router; 