import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { fullName, email, phone, countryCode, countryName, password, confirmPassword } = req.body;

  if (!fullName || !email || !phone || !countryCode || !countryName || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const existingEmail = await prisma.registered.findUnique({ where: { email } });
  if (existingEmail) {
    return res.status(400).json({ error: 'Email already registered.' });
  }
  const existingPhone = await prisma.registered.findUnique({ where: { phone } });
  if (existingPhone) {
    return res.status(400).json({ error: 'Phone already registered.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.registered.create({
    data: {
      fullName,
      email,
      phone,
      countryCode,
      countryName,
      passwordHash,
    },
  });

  return res.status(201).json({ message: 'Registration successful. Please login.' });
});

export default router; 