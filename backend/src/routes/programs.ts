import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/programs - Get all programs for a trainer
router.get('/', async (req: Request, res: Response) => {
  const trainerId = Number(req.query.trainerId);
  if (!trainerId) return res.status(400).json({ error: 'Missing trainerId' });
  
  try {
    const programs = await prisma.program.findMany({
      where: { trainerId },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { dayNumber: 'asc' }
            }
          },
          orderBy: { weekNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// GET /api/programs/:id - Get a specific program
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Missing id' });
  
  try {
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { dayNumber: 'asc' }
            }
          },
          orderBy: { weekNumber: 'asc' }
        }
      },
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

// POST /api/programs - Create a new program
router.post('/', async (req: Request, res: Response) => {
  const { trainerId, name, description, template, branding, weeks } = req.body;
  
  if (!trainerId || !name) {
    return res.status(400).json({ error: 'Missing trainerId or name' });
  }
  
  try {
    const program = await prisma.program.create({
      data: {
        trainerId: Number(trainerId),
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        template: template ? String(template) : null,
        branding: branding ? JSON.parse(JSON.stringify(branding)) : null,
      },
    });
    
    // If weeks data is provided, create the program structure
    if (weeks && Array.isArray(weeks)) {
      for (const week of weeks) {
        const createdWeek = await prisma.programWeek.create({
          data: {
            programId: program.id,
            weekNumber: week.weekNumber,
            name: week.name,
          },
        });
        
        if (week.days && Array.isArray(week.days)) {
          for (const day of week.days) {
            const createdDay = await prisma.programDay.create({
              data: {
                weekId: createdWeek.id,
                dayNumber: day.dayNumber,
                name: day.name,
              },
            });
            
            if (day.exercises && Array.isArray(day.exercises)) {
              for (const exercise of day.exercises) {
                await prisma.programExercise.create({
                  data: {
                    dayId: createdDay.id,
                    exerciseId: exercise.exerciseId,
                    order: exercise.order,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    weight: exercise.weight,
                    duration: exercise.duration,
                    restTime: exercise.restTime,
                    notes: exercise.notes,
                  },
                });
              }
            }
          }
        }
      }
    }
    
    // Return the complete program with structure
    const completeProgram = await prisma.program.findUnique({
      where: { id: program.id },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  },
                  orderBy: { order: 'asc' }
                }
              },
              orderBy: { dayNumber: 'asc' }
            }
          },
          orderBy: { weekNumber: 'asc' }
        }
      },
    });
    
    res.status(201).json(completeProgram);
  } catch (error) {
    console.error('Program creation error:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// PUT /api/programs/:id - Update a program
router.put('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { name, description, template, branding, pdfUrl } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ error: 'Missing id or name' });
  }
  
  try {
    const program = await prisma.program.update({
      where: { id },
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        template: template ? String(template) : null,
        branding: branding ? JSON.parse(JSON.stringify(branding)) : null,
        pdfUrl: pdfUrl ? String(pdfUrl) : null,
      },
    });
    res.json(program);
  } catch (error) {
    console.error('Program update error:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// DELETE /api/programs/:id - Delete a program
router.delete('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: 'Missing id' });
  
  try {
    await prisma.program.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Program deletion error:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

export default router; 