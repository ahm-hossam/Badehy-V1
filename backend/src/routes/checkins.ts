import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/checkins?trainerId=...
router.get('/', async (req: Request, res: Response) => {
  const trainerId = Number(req.query.trainerId);
  if (!trainerId) return res.status(400).json({ error: 'Missing trainerId' });
  try {
    const forms = await prisma.checkInForm.findMany({
      where: { trainerId },
      orderBy: { createdAt: 'desc' },
      include: { questions: true },
    });
    res.json(forms);
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

// GET /api/checkins/responses?trainerId=...&formId=...&clientId=...&from=...&to=...&page=...&pageSize=...
router.get('/responses', async (req: Request, res: Response) => {
  const trainerIdRaw = req.query.trainerId;
  const trainerId = Number(trainerIdRaw);
  console.log('Received trainerId:', trainerIdRaw, 'Parsed:', trainerId);
  const formId = req.query.formId ? Number(req.query.formId) : undefined;
  const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
  if (!trainerId || isNaN(trainerId) || trainerId <= 0) {
    return res.status(400).json({ error: `Missing or invalid trainerId: received '${trainerIdRaw}' (parsed: ${trainerId})` });
  }
  try {
    const where: any = {
      form: { trainerId },
    };
    if (formId) where.formId = formId;
    if (clientId) where.clientId = clientId;
    if (from || to) {
      where.submittedAt = {};
      if (from) where.submittedAt.gte = from;
      if (to) where.submittedAt.lte = to;
    }
    const total = await prisma.checkInSubmission.count({ where });
    const submissions = await prisma.checkInSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        form: { select: { id: true, name: true } },
        client: { select: { id: true, fullName: true, email: true } },
      },
    });
    res.json({ total, submissions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// GET /api/checkins/responses/:id - get details for a single submission
router.get('/responses/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id) || id <= 0) return res.status(404).json({ error: 'Missing or invalid response id' });
  try {
    const submission = await prisma.checkInSubmission.findUnique({
      where: { id },
      include: {
        form: { select: { id: true, name: true, questions: true } },
        client: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!submission) return res.status(404).json({ error: 'Response not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch response details' });
  }
});

// GET /api/checkins/:id - fetch a single check-in form with questions
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    const form = await prisma.checkInForm.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!form) return res.status(404).json({ error: 'Check-in form not found' });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch check-in form' });
  }
});

// POST /api/checkins/:id/submit - public submission
router.post('/:id/submit', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { answers, clientId } = req.body;
  if (!id || !answers || !clientId) return res.status(400).json({ error: 'Missing id, answers, or clientId' });
  try {
    const form = await prisma.checkInForm.findUnique({ where: { id } });
    if (!form) return res.status(404).json({ error: 'Check-in form not found' });
    const submission = await prisma.checkInSubmission.create({
      data: {
        formId: id,
        clientId: Number(clientId),
        answers,
      },
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit check-in' });
  }
});

// PUT /api/checkins/:id - update a check-in form (with versioning)
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, questions } = req.body;
  if (!id || !name || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // Get current form and questions for history
    const form = await prisma.checkInForm.findUnique({
      where: { id },
      include: { questions: true },
    });
    if (!form) return res.status(404).json({ error: 'Check-in form not found' });
    // Save history
    const latestVersion = await prisma.checkInFormHistory.findFirst({
      where: { formId: id },
      orderBy: { version: 'desc' },
    });
    await prisma.checkInFormHistory.create({
      data: {
        formId: id,
        version: latestVersion ? latestVersion.version + 1 : 1,
        name: form.name,
        questions: form.questions,
      },
    });
    // Delete old questions
    await prisma.checkInQuestion.deleteMany({ where: { formId: id } });
    // Update form and add new questions
    const updated = await prisma.checkInForm.update({
      where: { id },
      data: {
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
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update check-in form' });
  }
});

// DELETE /api/checkins/:id - delete a check-in form and its questions (not submissions)
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Missing id' });
  try {
    // Delete questions first (due to FK)
    await prisma.checkInQuestion.deleteMany({ where: { formId: id } });
    // Delete form
    await prisma.checkInForm.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete check-in form' });
  }
});

export default router; 