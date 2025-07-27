import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const router = Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/videos';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is a video
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// GET /api/exercises - Get all exercises for a trainer
router.get('/', async (req: Request, res: Response) => {
  const trainerId = Number(req.query.trainerId);
  if (!trainerId) return res.status(400).json({ error: 'Missing trainerId' });
  
  try {
    // First check if the trainer exists
    const trainer = await prisma.registered.findUnique({
      where: { id: trainerId },
    });
    
    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    const exercises = await prisma.exercise.findMany({
      where: { trainerId },
      orderBy: { name: 'asc' },
    });
    
    // Always return an array, even if empty
    res.json(exercises);
  } catch (error) {
    console.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// POST /api/exercises - Create a new exercise
router.post('/', async (req: Request, res: Response) => {
  const { 
    trainerId, 
    name, 
    videoUrl, 
    description, 
    category,
    bodyPart,
    equipment,
    target,
    secondaryMuscles,
    instructions,
    gifUrl,
    source
  } = req.body;
  
  if (!trainerId || !name) {
    return res.status(400).json({ error: 'Missing trainerId or name' });
  }
  
  try {
    const exercise = await prisma.exercise.create({
      data: {
        trainerId: Number(trainerId),
        name: String(name).trim(),
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        description: description ? String(description).trim() : null,
        category: category ? String(category).trim() : null,
        bodyPart: bodyPart ? String(bodyPart).trim() : null,
        equipment: equipment ? String(equipment).trim() : null,
        target: target ? String(target).trim() : null,
        secondaryMuscles: secondaryMuscles ? secondaryMuscles : [],
        instructions: instructions ? instructions : [],
        gifUrl: gifUrl ? String(gifUrl).trim() : null,
        source: source ? String(source).trim() : null,
      },
    });
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Exercise creation error:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// POST /api/exercises/upload - Create exercise with video file upload
router.post('/upload', upload.single('video'), async (req: Request, res: Response) => {
  try {
    const { trainerId, name, description, category } = req.body;
    const videoFile = req.file;

    if (!trainerId || !name) {
      return res.status(400).json({ error: 'Missing trainerId or name' });
    }

    if (!videoFile) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Generate video URL (you might want to use a CDN or cloud storage in production)
    const videoUrl = `/uploads/videos/${videoFile.filename}`;

    const exercise = await prisma.exercise.create({
      data: {
        trainerId: Number(trainerId),
        name: String(name).trim(),
        videoUrl: videoUrl,
        description: description ? String(description).trim() : null,
        category: category ? String(category).trim() : null,
      },
    });

    res.status(201).json(exercise);
  } catch (error) {
    console.error('Exercise upload error:', error);
    res.status(500).json({ error: 'Failed to create exercise with video' });
  }
});

// PUT /api/exercises/:id - Update an exercise
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { 
    name, 
    videoUrl, 
    description, 
    category,
    bodyPart,
    equipment,
    target,
    secondaryMuscles,
    instructions,
    gifUrl,
    source
  } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ error: 'Missing id or name' });
  }
  
  try {
    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        name: String(name).trim(),
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        description: description ? String(description).trim() : null,
        category: category ? String(category).trim() : null,
        bodyPart: bodyPart ? String(bodyPart).trim() : null,
        equipment: equipment ? String(equipment).trim() : null,
        target: target ? String(target).trim() : null,
        secondaryMuscles: secondaryMuscles ? secondaryMuscles : undefined,
        instructions: instructions ? instructions : undefined,
        gifUrl: gifUrl ? String(gifUrl).trim() : null,
        source: source ? String(source).trim() : null,
      },
    });
    res.json(exercise);
  } catch (error) {
    console.error('Exercise update error:', error);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
});

// DELETE /api/exercises/:id - Delete an exercise
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Missing id' });
  
  try {
    await prisma.exercise.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Exercise deletion error:', error);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

export default router; 