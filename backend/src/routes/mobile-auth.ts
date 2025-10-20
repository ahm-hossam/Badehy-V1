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

// Start auth by email: tells whether first login and optionally returns a short-lived firstLoginToken
router.post('/auth/start', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const cred = await prisma.clientAuth.findUnique({ where: { email } });
    if (!cred) return res.status(404).json({ error: 'Account not found.' });
    const response: any = { firstLogin: !!cred.requiresPasswordReset };
    if (cred.requiresPasswordReset) {
      const firstLoginToken = jwt.sign(
        { clientId: cred.clientId, firstLogin: true },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '15m' }
      );
      response.firstLoginToken = firstLoginToken;
    }
    return res.json(response);
  } catch (e) {
    console.error('auth/start error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// First-time password set using a short-lived token (no current password required)
router.post('/auth/first-set-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required.' });
    if (String(newPassword).length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
    if (!decoded?.firstLogin || !decoded?.clientId) return res.status(401).json({ error: 'Invalid token.' });
    const cred = await prisma.clientAuth.findUnique({ where: { clientId: decoded.clientId } });
    if (!cred) return res.status(400).json({ error: 'Account not found.' });
    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await prisma.clientAuth.update({ where: { clientId: decoded.clientId }, data: { passwordHash, requiresPasswordReset: false } });
    const client = await prisma.trainerClient.findUnique({ where: { id: decoded.clientId } });
    const { accessToken, refreshToken } = createTokens({ clientId: decoded.clientId });
    return res.json({ accessToken, refreshToken, client });
  } catch (e) {
    console.error('auth/first-set-password error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

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
    return res.json({ accessToken, refreshToken, client, requiresPasswordReset: cred.requiresPasswordReset });
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

// Change password for authenticated client
router.post('/auth/change-password', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    const cred = await prisma.clientAuth.findUnique({ where: { clientId } });
    if (!cred) return res.status(400).json({ error: 'Account not found.' });
    const ok = await bcrypt.compare(currentPassword, cred.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect.' });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.clientAuth.update({ where: { clientId }, data: { passwordHash, requiresPasswordReset: false } });
    return res.json({ success: true });
  } catch (e) {
    console.error('change-password error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


