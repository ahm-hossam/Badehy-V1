import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

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

// Get the active program for the authenticated client with nested weeks/days/exercises
router.get('/programs/active', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const assignment = await prisma.clientProgramAssignment.findFirst({
      where: { clientId, isActive: true },
      include: {
        program: {
          include: {
            weeks: {
              include: {
                days: {
                  include: {
                    exercises: {
                      include: { exercise: true },
                      orderBy: { order: 'asc' },
                    },
                  },
                  orderBy: { dayNumber: 'asc' },
                },
              },
              orderBy: { weekNumber: 'asc' },
            },
          },
        },
      },
    });

    return res.json({ assignment });
  } catch (e) {
    console.error('Active program error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


