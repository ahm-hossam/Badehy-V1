import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

function createTokens(payload: object) {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '30m' });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'dev-refresh', { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Email/phone + password login for clients
router.post('/auth/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body || {};
    if (!password || (!email && !phone)) {
      return res.status(400).json({ error: 'Email or phone and password are required.' });
    }

    const where: any = email ? { email } : { phone };
    const cred = await prisma.clientAuth.findUnique({ where });
    if (!cred) return res.status(401).json({ error: 'Invalid credentials.' });

    const ok = await bcrypt.compare(password, cred.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials.' });

    const client = await prisma.trainerClient.findUnique({ where: { id: cred.clientId } });
    if (!client) return res.status(401).json({ error: 'Account not found.' });

    const { accessToken, refreshToken } = createTokens({ clientId: cred.clientId });
    return res.json({ accessToken, refreshToken, client });
  } catch (e) {
    console.error('Login error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const client = await prisma.trainerClient.findUnique({ where: { id: clientId } });
    return res.json({ client });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


