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

// POST /api/checkins
router.post('/', async (req: Request, res: Response) => {
  const { trainerId, name, questions } = req.body;
  if (!trainerId || !name || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const form = await prisma.checkInForm.create({
      data: {
        trainerId: Number(trainerId),
        name,
        questions: {
          create: questions.map((q: any, idx: number) => ({
            order: idx,
            label: q.question || q.customQuestion || '',
            type: q.answerType,
            required: !!q.required,
            options: q.answerOptions && q.answerOptions.length > 0 ? q.answerOptions : undefined,
            conditionGroup: q.conditionGroup || undefined,
          })),
        },
      },
      include: { questions: true },
    });
    res.status(201).json(form);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save check-in form' });
  }
});

export default router; 