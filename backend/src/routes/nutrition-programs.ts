import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/nutrition-programs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// GET /api/nutrition-programs - Get all nutrition programs for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId } = req.query;
    
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const nutritionPrograms = await prisma.nutritionProgram.findMany({
      where: {
        trainerId: Number(trainerId)
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(nutritionPrograms);
  } catch (error) {
    console.error('Error fetching nutrition programs:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition programs' });
  }
});

// POST /api/nutrition-programs/import - Import nutrition program PDF
router.post('/import', upload.single('pdf'), async (req, res) => {
  try {
    const { trainerId, programName, programDuration, durationUnit } = req.body;
    
    if (!trainerId || !req.file) {
      return res.status(400).json({ error: 'Trainer ID and PDF file are required' });
    }

    // Check if trainer exists
    const trainer = await prisma.registered.findUnique({
      where: { id: Number(trainerId) }
    });

    if (!trainer) {
      return res.status(404).json({ error: 'Trainer not found' });
    }

    // Use program name from form data, fallback to filename if not provided
    const finalProgramName = programName || path.parse(req.file.originalname).name;
    
    // Create nutrition program record
    const nutritionProgram = await prisma.nutritionProgram.create({
      data: {
        trainerId: Number(trainerId),
        name: finalProgramName,
        isImported: true,
        importedPdfUrl: `/uploads/nutrition-programs/${req.file.filename}`,
        programDuration: programDuration ? Number(programDuration) : null,
        durationUnit: durationUnit || null
      }
    });

    console.log('Nutrition program imported successfully:', {
      id: nutritionProgram.id,
      name: nutritionProgram.name,
      trainerId: nutritionProgram.trainerId
    });

    res.json(nutritionProgram);
  } catch (error) {
    console.error('Error importing nutrition program:', error);
    res.status(500).json({ error: 'Failed to import nutrition program' });
  }
});

// DELETE /api/nutrition-programs/:id - Delete nutrition program
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Check if nutrition program is assigned to any clients
    const assignments = await prisma.clientNutritionAssignment.findMany({
      where: {
        nutritionProgramId: Number(id)
      }
    });

    if (assignments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete nutrition program that is assigned to clients' 
      });
    }

    // Get nutrition program to delete PDF file
    const nutritionProgram = await prisma.nutritionProgram.findUnique({
      where: { id: Number(id) }
    });

    if (nutritionProgram && nutritionProgram.importedPdfUrl) {
      const filePath = path.join(__dirname, '..', nutritionProgram.importedPdfUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.nutritionProgram.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Nutrition program deleted successfully' });
  } catch (error) {
    console.error('Error deleting nutrition program:', error);
    res.status(500).json({ error: 'Failed to delete nutrition program' });
  }
});

export default router; 