import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// GET /mobile/forms/main - Get main form for client's trainer
router.get('/main', authMiddleware, async (req: any, res: any) => {
  try {
    const clientId = req.user.clientId;
    
    // Get client to find trainer
    const client = await prisma.trainerClient.findUnique({
      where: { id: clientId },
      include: { trainer: true }
    });
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    // Get main form for this trainer
    const mainForm = await prisma.checkInForm.findFirst({
      where: { 
        trainerId: client.trainerId,
        isMainForm: true,
        published: true
      },
      include: { questions: { orderBy: { order: 'asc' } } }
    });
    
    if (!mainForm) {
      return res.status(404).json({ error: 'No main form found for this trainer' });
    }
    
    // Check if client has already completed this form
    const existingSubmission = await prisma.checkInSubmission.findFirst({
      where: { 
        formId: mainForm.id,
        clientId: clientId
      }
    });
    
    if (existingSubmission) {
      return res.status(200).json({ 
        form: mainForm, 
        completed: true,
        submission: existingSubmission
      });
    }
    
    res.json({ 
      form: mainForm, 
      completed: false 
    });
  } catch (error) {
    console.error('Error fetching main form:', error);
    res.status(500).json({ error: 'Failed to fetch main form' });
  }
});

// POST /mobile/forms/submit - Submit form responses
router.post('/submit', authMiddleware, async (req: any, res: any) => {
  try {
    const clientId = req.user.clientId;
    const { formId, answers } = req.body;
    
    if (!formId || !answers) {
      return res.status(400).json({ error: 'Form ID and answers are required' });
    }
    
    // Get form to validate
    const form = await prisma.checkInForm.findUnique({
      where: { id: formId },
      include: { questions: true }
    });
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Validate required fields
    const requiredQuestions = form.questions.filter(q => q.required);
    const missingFields = [];
    
    for (const question of requiredQuestions) {
      const answer = answers[question.id];
      if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
        missingFields.push(question.label);
      }
    }
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Required fields missing', 
        missingFields 
      });
    }
    
    // Check if already submitted
    const existingSubmission = await prisma.checkInSubmission.findFirst({
      where: { 
        formId: formId,
        clientId: clientId
      }
    });
    
    if (existingSubmission) {
      return res.status(400).json({ error: 'Form already submitted' });
    }
    
    // Create submission
    const submission = await prisma.checkInSubmission.create({
      data: {
        formId: formId,
        clientId: clientId,
        answers: answers,
        submittedAt: new Date()
      }
    });
    
    res.json({ 
      success: true, 
      submissionId: submission.id,
      message: 'Form submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// GET /mobile/forms/draft - Get saved draft
router.get('/draft', authMiddleware, async (req: any, res: any) => {
  try {
    const clientId = req.user.clientId;
    
    // For now, we'll use localStorage on the client side for drafts
    // In the future, we could store drafts in the database
    res.json({ draft: null });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

// POST /mobile/forms/draft - Save draft
router.post('/draft', authMiddleware, async (req: any, res: any) => {
  try {
    const clientId = req.user.clientId;
    const { formId, answers } = req.body;
    
    // For now, we'll use localStorage on the client side for drafts
    // In the future, we could store drafts in the database
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

export default router;
