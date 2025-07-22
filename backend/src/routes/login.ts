import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const user = await prisma.registered.findUnique({ where: { email } });
  if (!user) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }
  // Return user data (without password)
  const { passwordHash, ...userData } = user;
  res.json({ user: userData });
});

export default router; 