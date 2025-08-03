import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/programs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'program-' + uniqueSuffix + path.extname(file.originalname));
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

// Get all programs for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId } = req.query;
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    console.log('Fetching programs for trainer ID:', trainerId);

    const programs = await prisma.program.findMany({
      where: {
        trainerId: Number(trainerId)
      },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Debug endpoint to check trainers
router.get('/debug/trainers', async (req, res) => {
  try {
    const trainers = await prisma.registered.findMany({
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });
    res.json({ trainers });
  } catch (error) {
    console.error('Error fetching trainers:', error);
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
});

// Import PDF program
router.post('/import', upload.single('pdf'), async (req, res) => {
  try {
    const { trainerId, programName, programDuration, durationUnit } = req.body;
    
    console.log('Import request data:', { trainerId, programName, programDuration, durationUnit });
    
    if (!trainerId || !req.file) {
      return res.status(400).json({ error: 'Trainer ID and PDF file are required' });
    }

    // Check if trainer exists
    const trainer = await prisma.registered.findUnique({
      where: { id: Number(trainerId) }
    });

    if (!trainer) {
      console.error('Trainer not found:', trainerId);
      return res.status(404).json({ error: 'Trainer not found' });
    }

    console.log('Trainer found:', trainer.id, trainer.fullName);

    // Create the program record
    const program = await prisma.program.create({
      data: {
        trainerId: Number(trainerId),
        name: programName || req.file.originalname.replace('.pdf', ''),
        description: `Imported program: ${req.file.originalname}`,
        isImported: true,
        importedPdfUrl: `/uploads/programs/${req.file.filename}`,
        programDuration: programDuration ? Number(programDuration) : null,
        durationUnit: durationUnit || null
      }
    });

    console.log('Program created successfully:', program.id);
    res.json(program);
  } catch (error) {
    console.error('Error importing program:', error);
    res.status(500).json({ error: 'Failed to import program' });
  }
});

// Get program by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const program = await prisma.program.findUnique({
      where: { id: Number(id) },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    res.json(program);
  } catch (error) {
    console.error('Error fetching program:', error);
    res.status(500).json({ error: 'Failed to fetch program' });
  }
});

// Delete program
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if program is assigned to any clients
    const assignments = await prisma.clientProgramAssignment.findMany({
      where: { programId: Number(id) }
    });

    if (assignments.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete program. It is currently assigned to clients.' 
      });
    }

    // Delete the program and all related data
    await prisma.program.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

export default router; 