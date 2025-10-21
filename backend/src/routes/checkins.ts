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
    console.log('Check-ins POST: received form payload with', Array.isArray(questions) ? questions.length : 0, 'questions')
    // Create form with nested questions (without reliable condition references yet)
    const form = await prisma.checkInForm.create({
      data: {
        trainerId: Number(trainerId),
        name,
        isMainForm: !!isMainForm,
        questions: {
          create: questions.map((q: any, idx: number) => {
            try { console.log('Question', idx, 'keys:', Object.keys(q || {})) } catch {}
            // Normalize options
            let options: any = undefined;
            const rawOptions = q?.answerOptions ?? q?.options;
            if (Array.isArray(rawOptions) && rawOptions.length > 0) options = rawOptions;
            else if (typeof rawOptions === 'string' && rawOptions.trim() !== '') {
              try { options = JSON.parse(rawOptions); } catch {}
            }
            // Normalize conditional logic into conditionGroup (JSON)
            let conditionGroup: any = q?.conditionGroup ?? q?.conditions ?? q?.condition ?? q?.showIf ?? q?.visibilityConditions ?? q?.visibility ?? q?.conditionalLogic ?? q?.logic ?? q?.rules ?? q?.advancedLogic ?? q?.advanced ?? q?.conditional ?? q?.when ?? q?.if ?? undefined;
            if (typeof conditionGroup === 'string' && conditionGroup.trim() !== '') {
              try { conditionGroup = JSON.parse(conditionGroup); } catch {}
            }
            // Final fallback: if the question is marked conditional in any way, store the raw conditional fields
            if (!conditionGroup) {
              const candidate = {} as any
              ;['conditionGroup','conditions','condition','showIf','visibilityConditions','visibility','conditionalLogic','logic','rules','advancedLogic','advanced','conditional','when','if']
                .forEach(k => { if (q && q[k] !== undefined) candidate[k] = q[k] })
              if (Object.keys(candidate).length > 0) conditionGroup = candidate
            }
            return {
              order: idx,
              label: q.question || q.customQuestion || q.label || '',
              type: q.answerType || q.type,
              required: !!q.required,
              options,
              conditionGroup,
            };
          }),
        },
      },
      include: { questions: true },
    });
    // Remap client-side questionIds in conditionGroup to DB IDs
    try {
      const createdSorted = [...(form.questions || [])].sort((a, b) => a.order - b.order)
      const inputSorted = [...questions]
      const idMap: Record<string, number> = {}
      inputSorted.forEach((q: any, idx: number) => {
        const created = createdSorted[idx]
        if (created && q && q.id !== undefined && q.id !== null) idMap[String(q.id)] = created.id
      })
      const transformIds = (obj: any): any => {
        if (!obj) return obj
        if (Array.isArray(obj)) return obj.map(transformIds)
        if (typeof obj === 'object') {
          const out: any = {}
          for (const [k, v] of Object.entries(obj)) {
            if (k === 'questionId') {
              const key = typeof v === 'number' ? String(v) : String(v)
              out[k] = idMap[key] ?? v
            } else {
              out[k] = transformIds(v)
            }
          }
          return out
        }
        return obj
      }
      await Promise.all(createdSorted.map((created, idx) => {
        const rawGroup = inputSorted[idx]?.conditionGroup ?? inputSorted[idx]?.conditions ?? null
        if (!rawGroup) return Promise.resolve(null)
        let group = rawGroup
        if (typeof group === 'string') { try { group = JSON.parse(group) } catch {} }
        const transformed = transformIds(group)
        return prisma.checkInQuestion.update({ where: { id: created.id }, data: { conditionGroup: transformed } })
      }))
    } catch (e) {
      console.warn('Condition remap failed (create):', e)
    }
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
    
    // Determine client to associate the submission with
    let clientIdToUse: number | undefined = undefined;
    if (clientId) {
      // If a clientId is explicitly provided (e.g., from a conversion link), use it and validate ownership
      const forcedClient = await prisma.trainerClient.findUnique({ where: { id: Number(clientId) } });
      if (!forcedClient || forcedClient.trainerId !== form.trainerId) {
        return res.status(400).json({ error: 'Invalid client specified for this form.' });
      }
      clientIdToUse = forcedClient.id;
    } else if (!form.isMainForm) {
      // Secondary forms: require phone to find existing client
      if (!phoneNumber) {
        return res.status(400).json({ 
          error: 'Phone number is required for this form. Please fill the main form first to create your profile.' 
        });
      }
      const existingClient = await prisma.trainerClient.findFirst({
        where: { trainerId: form.trainerId, phone: phoneNumber }
      });
      if (!existingClient) {
        return res.status(400).json({ 
          error: 'No client found with this phone number. Please fill the main form first to create your profile.' 
        });
      }
      clientIdToUse = existingClient.id;
    } else {
      // Main form without explicit clientId: create new client
      let fullName = getAnswer(nameLabels);
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

      const goalsAnswer = getAnswer(['Goals']);
      if (goalsAnswer) clientData.goals = Array.isArray(goalsAnswer) ? goalsAnswer : [goalsAnswer];
      const injuriesAnswer = getAnswer(['Injuries', 'Health Notes', 'Injuries / Health Notes']);
      if (injuriesAnswer) clientData.injuriesHealthNotes = Array.isArray(injuriesAnswer) ? injuriesAnswer : [injuriesAnswer];

      const createdClient = await prisma.trainerClient.create({ data: clientData });
      clientIdToUse = createdClient.id;
    }
    
    // If linked to an existing client, optionally backfill core fields from answers
    if (clientIdToUse) {
      try {
        const current = await prisma.trainerClient.findUnique({ where: { id: clientIdToUse }, select: { fullName: true, email: true, phone: true, gender: true, age: true, source: true } });
        if (current) {
          // Derive candidate values from answers
          const candidateFullNameRaw = (() => {
            let nm = getAnswer(nameLabels);
            if (!nm) {
              const firstTextQ = form.questions.find(q => (q.type === 'short' || q.type === 'long') && answers[q.id] && String(answers[q.id]).trim() !== '');
              if (firstTextQ) nm = answers[firstTextQ.id];
            }
            return nm;
          })();
          const candidateFullName = candidateFullNameRaw && typeof candidateFullNameRaw === 'string' ? String(candidateFullNameRaw).trim() : '';
          const candidateEmail = getAnswer(['Email', 'Email Address']);
          const candidatePhone = phoneNumber;
          const candidateGender = getAnswer(['Gender']);
          const candidateAgeRaw = getAnswer(['Age']);
          const candidateAge = candidateAgeRaw && !isNaN(Number(candidateAgeRaw)) ? Number(candidateAgeRaw) : undefined;
          const candidateSource = getAnswer(['Source']);

          // Determine if current fullName is low quality and should be replaced
          const lowQualityNames = new Set(['', 'Unknown Client', 'Unnamed', 'Male', 'Female', 'Other']);
          const isLowQuality = lowQualityNames.has((current.fullName || '').trim());
          const isCandidateLikelyName = candidateFullName &&
            !['male','female','other'].includes(candidateFullName.toLowerCase()) &&
            !candidateFullName.includes('@') &&
            !(candidateFullName.match(/^\d+$/));

          const updates: any = {};
          if (isCandidateLikelyName && (isLowQuality || current.fullName === null || current.fullName === undefined)) {
            updates.fullName = candidateFullName;
          }
          if ((!current.email || current.email.trim() === '') && candidateEmail) {
            updates.email = String(candidateEmail);
          }
          if ((!current.phone || current.phone.trim() === '') && candidatePhone) {
            updates.phone = String(candidatePhone);
          }
          if ((current.gender == null || String(current.gender).trim() === '') && candidateGender) {
            updates.gender = String(candidateGender);
          }
          if ((current.age == null || Number.isNaN(Number(current.age))) && candidateAge !== undefined) {
            updates.age = candidateAge;
          }
          if ((current.source == null || String(current.source).trim() === '') && candidateSource) {
            updates.source = String(candidateSource);
          }
          if (Object.keys(updates).length > 0) {
            await prisma.trainerClient.update({ where: { id: clientIdToUse }, data: updates });
          }
        }
      } catch (e) {
        console.warn('Backfill from submission failed:', e);
      }
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
  const { name, questions, isMainForm, published } = req.body;
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
    console.log('Check-ins PUT: updating form', id, 'with', Array.isArray(questions) ? questions.length : 0, 'questions')
    const updated = await prisma.checkInForm.update({
      where: { id },
      data: {
        name,
        isMainForm: !!isMainForm,
        published: published !== undefined ? !!published : undefined,
        questions: {
          create: questions.map((q: any, idx: number) => {
            try { console.log('Question', idx, 'keys:', Object.keys(q || {})) } catch {}
            // Normalize options
            let options: any = undefined;
            const rawOptions = q?.answerOptions ?? q?.options;
            if (Array.isArray(rawOptions) && rawOptions.length > 0) options = rawOptions;
            else if (typeof rawOptions === 'string' && rawOptions.trim() !== '') {
              try { options = JSON.parse(rawOptions); } catch {}
            }
            // Normalize conditional logic into conditionGroup (JSON)
            let conditionGroup: any = q?.conditionGroup ?? q?.conditions ?? q?.condition ?? q?.showIf ?? q?.visibilityConditions ?? q?.visibility ?? q?.conditionalLogic ?? q?.logic ?? q?.rules ?? q?.advancedLogic ?? q?.advanced ?? q?.conditional ?? q?.when ?? q?.if ?? undefined;
            if (typeof conditionGroup === 'string' && conditionGroup.trim() !== '') {
              try { conditionGroup = JSON.parse(conditionGroup); } catch {}
            }
            if (!conditionGroup) {
              const candidate = {} as any
              ;['conditionGroup','conditions','condition','showIf','visibilityConditions','visibility','conditionalLogic','logic','rules','advancedLogic','advanced','conditional','when','if']
                .forEach(k => { if (q && q[k] !== undefined) candidate[k] = q[k] })
              if (Object.keys(candidate).length > 0) conditionGroup = candidate
            }
            return {
              order: idx,
              label: q.question || q.customQuestion || q.label || '',
              type: q.answerType || q.type,
              required: !!q.required,
              options,
              conditionGroup,
            };
          }),
        },
      },
      include: { questions: true },
    });
    // Remap questionIds in condition groups after update too
    try {
      const createdSorted = [...(updated.questions || [])].sort((a, b) => a.order - b.order)
      const inputSorted = [...questions]
      const idMap: Record<string, number> = {}
      inputSorted.forEach((q: any, idx: number) => {
        const created = createdSorted[idx]
        if (created && q && q.id !== undefined && q.id !== null) idMap[String(q.id)] = created.id
      })
      const transformIds = (obj: any): any => {
        if (!obj) return obj
        if (Array.isArray(obj)) return obj.map(transformIds)
        if (typeof obj === 'object') {
          const out: any = {}
          for (const [k, v] of Object.entries(obj)) {
            if (k === 'questionId') {
              const key = typeof v === 'number' ? String(v) : String(v)
              out[k] = idMap[key] ?? v
            } else {
              out[k] = transformIds(v)
            }
          }
          return out
        }
        return obj
      }
      await Promise.all(createdSorted.map((created, idx) => {
        const rawGroup = inputSorted[idx]?.conditionGroup ?? inputSorted[idx]?.conditions ?? null
        if (!rawGroup) return Promise.resolve(null)
        let group = rawGroup
        if (typeof group === 'string') { try { group = JSON.parse(group) } catch {} }
        const transformed = transformIds(group)
        return prisma.checkInQuestion.update({ where: { id: created.id }, data: { conditionGroup: transformed } })
      }))
    } catch (e) {
      console.warn('Condition remap failed (update):', e)
    }
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