import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

router.put('/update', async (req, res) => {
  const { id, fullName, email, phoneNumber, currentPassword, newPassword } = req.body;
  if (!id || !fullName || !email || !phoneNumber) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  const user = await prisma.registered.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  let passwordHash = user.passwordHash;
  // If changing password, verify current password
  if (newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    passwordHash = await bcrypt.hash(newPassword, 10);
  }
  // Update user
  const updatedUser = await prisma.registered.update({
    where: { id },
    data: {
      fullName,
      email,
      phoneNumber,
      passwordHash,
    },
  });
  const { passwordHash: _, ...userData } = updatedUser;
  res.json({ user: userData });
});

export default router; 