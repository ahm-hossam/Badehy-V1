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

  // First check if it's a main trainer (registered table)
  let user = await prisma.registered.findUnique({ where: { email } });
  let isTeamMember = false;

  // If not found in registered table, check team members table
  if (!user) {
    const teamMember = await prisma.teamMember.findUnique({ where: { email } });
    if (!teamMember) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    
    // Check if team member is active
    if (teamMember.status !== 'active') {
      return res.status(400).json({ error: 'Account is inactive. Please contact your administrator.' });
    }

    const valid = await bcrypt.compare(password, teamMember.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    // Return team member data (without password)
    const { password: passwordHash, ...userData } = teamMember;
    const responseUser = { ...userData, isTeamMember: true };
    isTeamMember = true;
    res.json({ user: responseUser });
  } else {
    // Main trainer login
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }
    // Return user data (without password)
    const { passwordHash, ...userData } = user;
    const responseUser = { ...userData, isTeamMember: false };
    res.json({ user: responseUser });
  }
});

export default router; 