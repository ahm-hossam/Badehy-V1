import express from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Get all programs for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId } = req.query;
    
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const programs = await prisma.program.findMany({
      where: {
        trainerId: parseInt(trainerId as string)
      },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: true
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

// Get a specific program
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const program = await prisma.program.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: true
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

// Create a new program
router.post('/', async (req, res) => {
  try {
    const { trainerId, name, description, weeks } = req.body;

    if (!trainerId || !name) {
      return res.status(400).json({ error: 'Trainer ID and name are required' });
    }

    const program = await prisma.program.create({
      data: {
        trainerId: parseInt(trainerId),
        name,
        description: description || '',
        weeks: {
          create: weeks.map((week: any) => ({
            weekNumber: week.weekNumber,
            name: week.name || '',
            days: {
              create: week.days.map((day: any) => ({
                dayNumber: day.dayNumber,
                name: day.name || '',
                exercises: {
                  create: day.exercises.map((exercise: any) => ({
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    order: exercise.order,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    duration: exercise.duration,
                    restTime: exercise.restTime,
                    notes: exercise.notes || ''
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
                exercises: true
              }
            }
          }
        }
      }
    });

    res.status(201).json(program);
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ error: 'Failed to create program' });
  }
});

// Update a program
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, weeks } = req.body;

    // First, delete existing program structure
    await prisma.programExercise.deleteMany({
      where: {
        day: {
          week: {
            programId: parseInt(id)
          }
        }
      }
    });

    await prisma.programDay.deleteMany({
      where: {
        week: {
          programId: parseInt(id)
        }
      }
    });

    await prisma.programWeek.deleteMany({
      where: {
        programId: parseInt(id)
      }
    });

    // Then recreate with new data
    const program = await prisma.program.update({
      where: {
        id: parseInt(id)
      },
      data: {
        name,
        description: description || '',
        weeks: {
          create: weeks.map((week: any) => ({
            weekNumber: week.weekNumber,
            name: week.name || '',
            days: {
              create: week.days.map((day: any) => ({
                dayNumber: day.dayNumber,
                name: day.name || '',
                exercises: {
                  create: day.exercises.map((exercise: any) => ({
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    order: exercise.order,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    duration: exercise.duration,
                    restTime: exercise.restTime,
                    notes: exercise.notes || ''
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
                exercises: true
              }
            }
          }
        }
      }
    });

    res.json(program);
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ error: 'Failed to update program' });
  }
});

// Delete a program
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Delete program exercises first
    await prisma.programExercise.deleteMany({
      where: {
        day: {
          week: {
            programId: parseInt(id)
          }
        }
      }
    });

    // Delete program days
    await prisma.programDay.deleteMany({
      where: {
        week: {
          programId: parseInt(id)
        }
      }
    });

    // Delete program weeks
    await prisma.programWeek.deleteMany({
      where: {
        programId: parseInt(id)
      }
    });

    // Delete the program
    await prisma.program.delete({
      where: {
        id: parseInt(id)
      }
    });

    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ error: 'Failed to delete program' });
  }
});

// Export program as PDF with template
router.post('/export', async (req, res) => {
  try {
    const { trainerId, templateId, programName, programDescription, weeks } = req.body;

    if (!trainerId || !templateId || !programName || !weeks) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the template
    const template = await prisma.pDFTemplate.findUnique({
      where: {
        id: parseInt(templateId)
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Get trainer branding
    const branding = await prisma.brandingSettings.findUnique({
      where: {
        trainerId: parseInt(trainerId)
      }
    });

    // For now, return a simple success response
    // In a real implementation, you would:
    // 1. Read the template PDF file
    // 2. Inject the program data into the template
    // 3. Generate a new PDF with the combined data
    // 4. Return the generated PDF as a blob

    const exportData = {
      template: template.name,
      program: programName,
      description: programDescription,
      weeks: weeks.length,
      totalExercises: weeks.reduce((total: number, week: any) => {
        return total + week.days.reduce((dayTotal: number, day: any) => {
          return dayTotal + day.exercises.length;
        }, 0);
      }, 0),
      branding: branding ? {
        companyName: branding.companyName,
        logoUrl: branding.logoUrl
      } : null
    };

    // For now, create a simple text response
    // In production, this would be a PDF file
    const pdfContent = `
Program Export Data:
- Template: ${exportData.template}
- Program: ${exportData.program}
- Weeks: ${exportData.weeks}
- Total Exercises: ${exportData.totalExercises}
- Company: ${exportData.branding?.companyName || 'N/A'}
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${programName.replace(/\s+/g, '_')}_workout_program.txt"`);
    res.send(pdfContent);

  } catch (error) {
    console.error('Error exporting program:', error);
    res.status(500).json({ error: 'Failed to export program' });
  }
});

export default router; 