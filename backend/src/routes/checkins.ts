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
  const { trainerId, name, questions, isMainForm } = req.body;
  if (!trainerId || !name || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const form = await prisma.checkInForm.create({
      data: {
        trainerId: Number(trainerId),
        name,
        isMainForm: !!isMainForm,
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
  const trainerId = req.query.trainerId ? Number(req.query.trainerId) : undefined;
  const formId = req.query.formId ? Number(req.query.formId) : undefined;
  const clientId = req.query.clientId ? Number(req.query.clientId) : undefined;
  const filledBy = req.query.filledBy ? String(req.query.filledBy) : undefined; // Add filledBy filter
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
      if (to) where.submittedAt.lt = to;
    }
    const total = await prisma.checkInSubmission.count({ where });
    const submissions = await prisma.checkInSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        form: { select: { id: true, name: true, trainer: { select: { fullName: true } }, questions: true } },
        client: { select: { id: true, fullName: true, email: true } },
      },
    });
    // Add filledBy info to each submission
    const isPlainObject = (val: any) => val && typeof val === 'object' && !Array.isArray(val);
    const enhanced = submissions.map(sub => {
      let filledBy = 'client';
      let filledByName = sub.client?.fullName || '-';
      if (isPlainObject(sub.answers) && (sub.answers as any).filledByTrainer) {
        filledBy = 'trainer';
        filledByName = sub.form?.trainer?.fullName || 'Trainer';
      }
      return { ...sub, filledBy, filledByName };
    });

    // Filter by filledBy if specified
    const filtered = filledBy ? enhanced.filter(sub => sub.filledBy === filledBy) : enhanced;

    // Recalculate total for filtered results
    const filteredTotal = filledBy ? filtered.length : total;

    res.json({ total: filteredTotal, submissions: filtered });
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
  if (!id || !answers) return res.status(400).json({ error: 'Missing id or answers' });
  try {
    const form = await prisma.checkInForm.findUnique({ where: { id }, include: { questions: true, trainer: true } });
    if (!form) return res.status(404).json({ error: 'Check-in form not found' });
    
    // Map answers to client fields (robust best practice)
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    // Accept a variety of possible name labels
    const nameLabels = [
      'Full Name', 'Name', 'Client Name', 'Client Full Name', 'Fullname', 'Client'
    ];
    const getAnswer = (labels: string[]) => {
      for (const label of labels) {
        const q = form.questions.find(q => normalize(q.label) === normalize(label));
        if (q && answers[q.id] !== undefined) return answers[q.id];
      }
      return '';
    };
    
    // Extract phone number for client identification
    const phoneNumber = getAnswer(['Phone', 'Phone Number', 'Mobile', 'Mobile Number']) || '';
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{7,15}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    let clientIdToUse = clientId;
    
    // If this is NOT a main form, we need to find existing client by phone number
    if (!form.isMainForm) {
      if (!phoneNumber) {
        return res.status(400).json({ 
          error: 'Phone number is required for this form. Please fill the main form first to create your profile.' 
        });
      }
      
      // Search for existing client by phone number
      const existingClient = await prisma.trainerClient.findFirst({
        where: {
          trainerId: form.trainerId,
          phone: phoneNumber
        }
      });
      
      if (!existingClient) {
        return res.status(400).json({ 
          error: 'No client found with this phone number. Please fill the main form first to create your profile.' 
        });
      }
      
      clientIdToUse = existingClient.id;
    } else {
      // This is a main form - create new client
      // Try to get full name from robust label set
      let fullName = getAnswer(nameLabels);
      // Fallback: use first non-empty short/long answer
      if (!fullName) {
        const firstTextQ = form.questions.find(q => (q.type === 'short' || q.type === 'long') && answers[q.id] && String(answers[q.id]).trim() !== '');
        if (firstTextQ) fullName = answers[firstTextQ.id];
      }
      if (!fullName) fullName = 'Unnamed';
      
      const clientData: any = {
        trainerId: form.trainerId,
        fullName,
        phone: phoneNumber,
        email: getAnswer(['Email', 'Email Address']) || '',
        gender: getAnswer(['Gender']) || null,
        age: getAnswer(['Age']) ? Number(getAnswer(['Age'])) : null,
        source: getAnswer(['Source']) || null,
        level: getAnswer(['Level']) || null,
        registrationDate: new Date(),
        injuriesHealthNotes: [],
        goals: [],
      };
      
      // Optionally extract goals and injuries/health notes if present as arrays
      const goalsAnswer = getAnswer(['Goals']);
      if (goalsAnswer) clientData.goals = Array.isArray(goalsAnswer) ? goalsAnswer : [goalsAnswer];
      const injuriesAnswer = getAnswer(['Injuries', 'Health Notes', 'Injuries / Health Notes']);
      if (injuriesAnswer) clientData.injuriesHealthNotes = Array.isArray(injuriesAnswer) ? injuriesAnswer : [injuriesAnswer];
      
      // Create the client
      const createdClient = await prisma.trainerClient.create({ data: clientData });
      clientIdToUse = createdClient.id;
    }
    
    // Create the submission and link to the client
    const submission = await prisma.checkInSubmission.create({
      data: {
        formId: id,
        clientId: clientIdToUse,
        phoneNumber: phoneNumber,
        answers,
      },
    });
    
    res.status(201).json(submission);
  } catch (err) {
    console.error('Submission error:', err);
    res.status(500).json({ error: 'Failed to submit check-in' });
  }
});

// PUT /api/checkins/:id - update a check-in form (with versioning)
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, questions, isMainForm } = req.body;
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
        data: {
        name: form.name,
        questions: form.questions,
        },
      },
    });
    // Delete old questions
    await prisma.checkInQuestion.deleteMany({ where: { formId: id } });
    // Update form and add new questions
    const updated = await prisma.checkInForm.update({
      where: { id },
      data: {
        name,
        isMainForm: !!isMainForm,
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