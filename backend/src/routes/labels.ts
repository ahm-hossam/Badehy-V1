import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/labels?trainerId=...
router.get('/', async (req: Request, res: Response) => {
  const trainerId = Number(req.query.trainerId);
  if (!trainerId) return res.status(400).json({ error: 'Missing trainerId' });
  const labels = await prisma.label.findMany({
    where: { trainerId },
    orderBy: { name: 'asc' },
  });
  res.json(labels);
});

// POST /api/labels
router.post('/', async (req: Request, res: Response) => {
  const { trainerId, name } = req.body;
  if (!trainerId || !name) return res.status(400).json({ error: 'Missing trainerId or name' });
  try {
    const label = await prisma.label.create({
      data: { trainerId: Number(trainerId), name: String(name).trim() },
    });
    res.status(201).json(label);
  } catch (err: any) {
    console.error('Label creation error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Label name must be unique per trainer' });
    }
    res.status(500).json({ error: 'Failed to create label' });
  }
});

// PUT /api/labels/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, trainerId } = req.body;
  if (!id || !name || !trainerId) return res.status(400).json({ error: 'Missing id, name, or trainerId' });
  try {
    const label = await prisma.label.update({
      where: { id },
      data: { name: String(name).trim() },
    });
    res.json(label);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Label name must be unique per trainer' });
    }
    res.status(500).json({ error: 'Failed to update label' });
  }
});

// DELETE /api/labels/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    await prisma.label.delete({ where: { id } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete label' });
  }
});

export default router; 