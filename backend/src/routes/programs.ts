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
        OR: [
          { trainerId: Number(trainerId) },
          { isDefault: true }
        ]
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
        },
        customizedFor: {
          select: {
            id: true,
            fullName: true
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
    const { isCustomize } = req.query;
    
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
        },
        customizedFor: isCustomize ? {
          select: {
            id: true,
            fullName: true
          }
        } : undefined
      }
    });

    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Add metadata if program is customized
    if (program.originalProgramId) {
      const originalProgram = await prisma.program.findUnique({
        where: { id: program.originalProgramId },
        select: { name: true }
      });
      
      res.json({
        ...program,
        isCustomized: true,
        originalProgramName: originalProgram?.name
      });
    } else {
      res.json(program);
    }
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

// Clone a program for customization (POST /api/programs/:id/clone)
router.post('/:id/clone', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { trainerId, customizedForClientId } = req.body;

    if (!trainerId || !customizedForClientId) {
      return res.status(400).json({ error: 'Trainer ID and Client ID are required' });
    }

    // Fetch the original program with all its data
    const originalProgram = await prisma.program.findUnique({
      where: { id },
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

    if (!originalProgram) {
      return res.status(404).json({ error: 'Program not found' });
    }

    // Get the client's name for the customized program name
    const client = await prisma.trainerClient.findUnique({
      where: { id: Number(customizedForClientId) },
      select: { fullName: true }
    });

    // Create the cloned program with customization metadata
    const clonedProgram = await prisma.program.create({
      data: {
        trainerId: Number(trainerId),
        name: `${originalProgram.name} (Customized)`,
        description: originalProgram.description,
        pdfUrl: originalProgram.pdfUrl,
        isImported: originalProgram.isImported,
        isDefault: false,
        importedPdfUrl: originalProgram.importedPdfUrl,
        programDuration: originalProgram.programDuration,
        durationUnit: originalProgram.durationUnit,
        originalProgramId: id,
        customizedForClientId: Number(customizedForClientId),
        weeks: {
          create: originalProgram.weeks.map((week: any) => ({
            weekNumber: week.weekNumber,
            name: week.name,
            days: {
              create: week.days.map((day: any) => ({
                dayNumber: day.dayNumber,
                name: day.name,
                exercises: {
                  create: day.exercises.map((ex: any) => ({
                    exerciseId: ex.exerciseId,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest: ex.rest,
                    notes: ex.notes,
                    order: ex.order
                  }))
                }
              }))
            }
          }))
        }
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
      }
    });

    res.json({
      ...clonedProgram,
      isCustomized: true,
      customizedFor: client?.fullName
    });
  } catch (error) {
    console.error('Error cloning program:', error);
    res.status(500).json({ error: 'Failed to clone program' });
  }
});

// Create program with nested weeks/days/exercises
router.post('/', async (req, res) => {
  try {
    const { trainerId, name, description, weeks } = req.body || {};
    if (!trainerId || !name) return res.status(400).json({ error: 'trainerId and name are required' });
    const created = await prisma.program.create({
      data: {
        trainerId: Number(trainerId),
        name,
        description,
        weeks: weeks && Array.isArray(weeks) ? {
          create: weeks.map((w: any, wi: number) => ({
            weekNumber: w.weekNumber ?? wi + 1,
            name: w.name,
            days: w.days && Array.isArray(w.days) ? {
              create: w.days.map((d: any, di: number) => ({
                dayNumber: d.dayNumber ?? di + 1,
                name: d.name,
                dayType: d.dayType ?? 'workout',
                exercises: d.exercises && Array.isArray(d.exercises) ? {
                  create: d.exercises.filter((e: any) => e.exerciseId && Number(e.exerciseId) > 0).map((e: any, ei: number) => ({
                    exerciseId: Number(e.exerciseId),
                    order: e.order ?? ei + 1,
                    sets: e.sets ?? null, // JSON array of per-set data
                    duration: e.duration && e.duration !== '' ? parseInt(e.duration) : null,
                    notes: e.notes ?? null,
                    groupId: e.groupId ?? null,
                    groupType: e.groupType ?? null,
                    videoUrl: e.videoUrl ?? null,
                    dropset: e.dropset ?? false,
                    singleLeg: e.singleLeg ?? false,
                    failure: e.failure ?? false,
                  }))
                } : undefined,
              }))
            } : undefined,
          }))
        } : undefined,
      },
      include: { weeks: { include: { days: { include: { exercises: true } } } } },
    });
    return res.status(201).json(created);
  } catch (e) {
    console.error('Create program error', e);
    return res.status(500).json({ error: 'Failed to create program' });
  }
});

// Update program
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, weeks } = req.body || {};
    // Simple approach: replace nested structure
    // Delete existing nested entities then recreate
    await prisma.programWeek.deleteMany({ where: { programId: Number(id) } });
    const updated = await prisma.program.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        weeks: weeks && Array.isArray(weeks) ? {
          create: weeks.map((w: any, wi: number) => ({
            weekNumber: w.weekNumber ?? wi + 1,
            name: w.name,
            days: w.days && Array.isArray(w.days) ? {
              create: w.days.map((d: any, di: number) => ({
                dayNumber: d.dayNumber ?? di + 1,
                name: d.name,
                dayType: d.dayType ?? 'workout',
                exercises: d.exercises && Array.isArray(d.exercises) ? {
                  create: d.exercises.filter((e: any) => e.exerciseId && Number(e.exerciseId) > 0).map((e: any, ei: number) => ({
                    exerciseId: Number(e.exerciseId),
                    order: e.order ?? ei + 1,
                    sets: e.sets ?? null, // JSON array of per-set data
                    duration: e.duration && e.duration !== '' ? parseInt(e.duration) : null,
                    notes: e.notes ?? null,
                    groupId: e.groupId ?? null,
                    groupType: e.groupType ?? null,
                    videoUrl: e.videoUrl ?? null,
                    dropset: e.dropset ?? false,
                    singleLeg: e.singleLeg ?? false,
                    failure: e.failure ?? false,
                  }))
                } : undefined,
              }))
            } : undefined,
          }))
        } : undefined,
      },
      include: { weeks: { include: { days: { include: { exercises: true } } } } },
    });
    return res.json(updated);
  } catch (e) {
    console.error('Update program error', e);
    return res.status(500).json({ error: 'Failed to update program' });
  }
});

export default router;