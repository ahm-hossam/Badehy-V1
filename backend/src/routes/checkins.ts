import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/checkins?trainerId=...
router.get('/', async (req: Request, res: Response) => {
  const trainerId = Number(req.query.trainerId);
  if (!trainerId) return res.status(400).json({ error: 'Missing trainerId' });
  try {
    const checkIns = await prisma.checkIn.findMany({
      where: { trainerId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(checkIns);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch check-ins' });
  }
});

export default router; 