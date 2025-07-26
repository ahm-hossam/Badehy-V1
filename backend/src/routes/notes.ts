import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/notes?clientId=...
router.get('/', async (req: Request, res: Response) => {
  const clientId = Number(req.query.clientId);
  if (!clientId) return res.status(400).json({ error: 'Missing clientId' });
  
  try {
    const notes = await prisma.note.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' }, // Newest first
    });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes
router.post('/', async (req: Request, res: Response) => {
  const { clientId, content } = req.body;
  if (!clientId || !content) return res.status(400).json({ error: 'Missing clientId or content' });
  
  try {
    const note = await prisma.note.create({
      data: { 
        clientId: Number(clientId), 
        content: String(content).trim() 
      },
    });
    res.status(201).json(note);
  } catch (error) {
    console.error('Note creation error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT /api/notes/:id
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { content } = req.body;
  if (!id || !content) return res.status(400).json({ error: 'Missing id or content' });
  
  try {
    const note = await prisma.note.update({
      where: { id },
      data: { content: String(content).trim() },
    });
    res.json(note);
  } catch (error) {
    console.error('Note update error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Missing id' });
  
  try {
    await prisma.note.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Note deletion error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router; 