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

// Get a specific program
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('GET /api/programs/:id - Fetching program with ID:', id);
    
    const program = await prisma.program.findUnique({
      where: {
        id: parseInt(id)
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

    if (!program) {
      console.log('GET /api/programs/:id - Program not found for ID:', id);
      return res.status(404).json({ error: 'Program not found' });
    }

    console.log('GET /api/programs/:id - Found program:', {
      id: program.id,
      name: program.name,
      weeksCount: program.weeks?.length || 0,
      weeks: program.weeks?.map(w => ({
        id: w.id,
        weekNumber: w.weekNumber,
        name: w.name,
        daysCount: w.days?.length || 0,
        days: w.days?.map(d => ({
          id: d.id,
          dayNumber: d.dayNumber,
          name: d.name,
          exercisesCount: d.exercises?.length || 0,
          exercises: d.exercises?.map(e => ({
            id: e.id,
            exerciseId: e.exerciseId,
            exerciseName: e.exercise?.name,
            sets: e.sets,
            reps: e.reps,
            duration: e.duration,
            notes: e.notes
          }))
        }))
      }))
    });

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
    
    console.log('POST /api/programs - Creating new program');
    console.log('POST /api/programs - Request body:', { trainerId, name, description, weeksCount: weeks?.length });
    console.log('POST /api/programs - Full weeks data:', JSON.stringify(weeks, null, 2));

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
                  create: day.exercises.map((exercise: any) => {
                    console.log('POST /api/programs - Creating exercise:', {
                      exerciseId: exercise.exerciseId,
                      order: exercise.order,
                      sets: exercise.sets,
                      reps: exercise.reps,
                      duration: exercise.duration,
                      notes: exercise.notes
                    });
                    return {
                      exerciseId: exercise.exerciseId,
                      order: exercise.order,
                      sets: exercise.sets,
                      reps: exercise.reps,
                      duration: exercise.duration,
                      restTime: exercise.restTime,
                      notes: exercise.notes || ''
                    };
                  })
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

    console.log('POST /api/programs - Created program successfully:', {
      id: program.id,
      name: program.name,
      weeksCount: program.weeks?.length || 0,
      weeks: program.weeks?.map(w => ({
        id: w.id,
        weekNumber: w.weekNumber,
        name: w.name,
        daysCount: w.days?.length || 0,
        days: w.days?.map(d => ({
          id: d.id,
          dayNumber: d.dayNumber,
          name: d.name,
          exercisesCount: d.exercises?.length || 0,
          exercises: d.exercises?.map(e => ({
            id: e.id,
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            duration: e.duration,
            notes: e.notes
          }))
        }))
      }))
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
    
    console.log('PUT /api/programs/:id - Updating program with ID:', id);
    console.log('PUT /api/programs/:id - Request body:', { name, description, weeksCount: weeks?.length });

    // Fetch the existing program structure
    const existingProgram = await prisma.program.findUnique({
      where: { id: parseInt(id) },
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
    if (!existingProgram) {
      console.log('PUT /api/programs/:id - Program not found for ID:', id);
      return res.status(404).json({ error: 'Program not found' });
    }

    console.log('PUT /api/programs/:id - Existing program structure:', {
      id: existingProgram.id,
      name: existingProgram.name,
      weeksCount: existingProgram.weeks?.length || 0
    });

    // Update program name/description
    await prisma.program.update({
      where: { id: parseInt(id) },
      data: { name, description: description || '' }
    });

    // Build a map of existing weeks by weekNumber
    const existingWeeksMap = new Map();
    existingProgram.weeks.forEach((w) => {
      existingWeeksMap.set(w.weekNumber, w);
    });

    // Track weekNumbers that are updated
    const updatedWeekNumbers = new Set();

    // Update or create weeks
    for (const week of weeks) {
      let dbWeek = existingWeeksMap.get(week.weekNumber);
      if (dbWeek) {
        // Update week name
        await prisma.programWeek.update({
          where: { id: dbWeek.id },
          data: { name: week.name || '' }
        });
        // Build a map of existing days by dayNumber
        const existingDaysMap = new Map();
        dbWeek.days.forEach((d: { dayNumber: number; id: number }) => {
          existingDaysMap.set(d.dayNumber, d);
        });
        // Track dayNumbers that are updated
        const updatedDayNumbers = new Set();
        // Update or create days
        for (const day of week.days) {
          let dbDay = existingDaysMap.get(day.dayNumber);
          if (dbDay) {
            // Update day name
            await prisma.programDay.update({
              where: { id: dbDay.id },
              data: { name: day.name || '' }
            });
            // Delete all exercises for this day
            await prisma.programExercise.deleteMany({ where: { dayId: dbDay.id } });
            // Create new exercises
            for (const exercise of day.exercises) {
              await prisma.programExercise.create({
                data: {
                  dayId: dbDay.id,
                  exerciseId: exercise.exerciseId,
                  order: exercise.order,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  duration: exercise.duration,
                  restTime: exercise.restTime,
                  notes: exercise.notes || ''
                }
              });
            }
          } else {
            // Create new day and exercises
            const newDay = await prisma.programDay.create({
              data: {
                weekId: dbWeek.id,
                dayNumber: day.dayNumber,
                name: day.name || '',
                exercises: {
                  create: day.exercises.map((exercise: any) => ({
                    exerciseId: exercise.exerciseId,
                    order: exercise.order,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    duration: exercise.duration,
                    restTime: exercise.restTime,
                    notes: exercise.notes || ''
                  }))
                }
              }
            });
          }
          updatedDayNumbers.add(day.dayNumber);
        }
        // Delete days that were not updated
        const daysArr = dbWeek.days as Array<any>;
        for (let i = 0; i < daysArr.length; i++) {
          const d = daysArr[i] as { dayNumber: number; id: number };
          if (!updatedDayNumbers.has(d.dayNumber)) {
            await prisma.programDay.delete({ where: { id: d.id } });
          }
        }
      } else {
        // Create new week, days, and exercises
        const newWeek = await prisma.programWeek.create({
          data: {
            programId: existingProgram.id,
            weekNumber: week.weekNumber,
            name: week.name || '',
            days: {
              create: week.days.map((day: any) => ({
                dayNumber: day.dayNumber,
                name: day.name || '',
                exercises: {
                  create: day.exercises.map((exercise: any) => ({
                    exerciseId: exercise.exerciseId,
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
          }
        });
      }
      updatedWeekNumbers.add(week.weekNumber);
    }
    // Do NOT delete weeks that are not in the update payload (preserve empty weeks)

    // Return the updated program with full structure
    const updatedProgram = await prisma.program.findUnique({
      where: { id: parseInt(id) },
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
    
    console.log('PUT /api/programs/:id - Updated program structure:', {
      id: updatedProgram?.id,
      name: updatedProgram?.name,
      weeksCount: updatedProgram?.weeks?.length || 0,
      weeks: updatedProgram?.weeks?.map(w => ({
        id: w.id,
        weekNumber: w.weekNumber,
        name: w.name,
        daysCount: w.days?.length || 0,
        days: w.days?.map(d => ({
          id: d.id,
          dayNumber: d.dayNumber,
          name: d.name,
          exercisesCount: d.exercises?.length || 0
        }))
      }))
    });
    
    res.json(updatedProgram);
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