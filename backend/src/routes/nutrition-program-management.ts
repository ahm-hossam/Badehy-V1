import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Add a week to a nutrition program
router.post('/:programId/weeks', async (req, res) => {
  try {
    const { programId } = req.params;
    const { weekNumber, name, trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Verify program ownership
    const program = await prisma.nutritionProgram.findFirst({
      where: {
        id: Number(programId),
        trainerId: Number(trainerId),
        isActive: true,
      },
    });

    if (!program) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    // Create the week
    const week = await prisma.nutritionProgramWeek.create({
      data: {
        nutritionProgramId: Number(programId),
        weekNumber: weekNumber || 1,
        name: name || `Week ${weekNumber || 1}`,
      },
    });

    // Create 7 days for the week
    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      await prisma.nutritionProgramDay.create({
        data: {
          nutritionProgramWeekId: week.id,
          dayOfWeek,
          name: getDayName(dayOfWeek),
        },
      });
    }

    // Fetch the created week with days
    const createdWeek = await prisma.nutritionProgramWeek.findUnique({
      where: { id: week.id },
      include: {
        days: {
          include: {
            meals: {
              include: {
                meal: {
                  include: {
                    mealIngredients: {
                      include: {
                        ingredient: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(createdWeek);
  } catch (error) {
    console.error('Error adding week:', error);
    res.status(500).json({ error: 'Failed to add week' });
  }
});

// Duplicate a week
router.post('/:programId/weeks/:weekId/duplicate', async (req, res) => {
  try {
    const { programId, weekId } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Get the original week with all relations
    const originalWeek = await prisma.nutritionProgramWeek.findFirst({
      where: {
        id: Number(weekId),
        nutritionProgramId: Number(programId),
        nutritionProgram: {
          trainerId: Number(trainerId),
          isActive: true,
        },
      },
      include: {
        days: {
          include: {
            meals: {
              include: {
                meal: {
                  include: {
                    mealIngredients: {
                      include: {
                        ingredient: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!originalWeek) {
      return res.status(404).json({ error: 'Week not found' });
    }

    // Get the next week number
    const maxWeek = await prisma.nutritionProgramWeek.findFirst({
      where: { nutritionProgramId: Number(programId) },
      orderBy: { weekNumber: 'desc' },
    });

    const nextWeekNumber = maxWeek ? maxWeek.weekNumber + 1 : 1;

    // Create duplicated week
    const duplicatedWeek = await prisma.nutritionProgramWeek.create({
      data: {
        nutritionProgramId: Number(programId),
        weekNumber: nextWeekNumber,
        name: `Copy of ${originalWeek.name}`,
      },
    });

    // Duplicate days and meals
    for (const day of originalWeek.days) {
      const duplicatedDay = await prisma.nutritionProgramDay.create({
        data: {
          nutritionProgramWeekId: duplicatedWeek.id,
          dayOfWeek: day.dayOfWeek,
          name: day.name,
        },
      });

      // Duplicate meals
      for (const programMeal of day.meals) {
        await prisma.nutritionProgramMeal.create({
          data: {
            nutritionProgramId: Number(programId),
            nutritionProgramWeekId: duplicatedWeek.id,
            nutritionProgramDayId: duplicatedDay.id,
            mealId: programMeal.mealId,
            mealType: programMeal.mealType,
            order: programMeal.order,
            isCheatMeal: programMeal.isCheatMeal,
            cheatDescription: programMeal.cheatDescription,
            cheatImageUrl: programMeal.cheatImageUrl,
            customQuantity: programMeal.customQuantity,
            customNotes: programMeal.customNotes,
          },
        });
      }
    }

    // Fetch the duplicated week with all relations
    const createdWeek = await prisma.nutritionProgramWeek.findUnique({
      where: { id: duplicatedWeek.id },
      include: {
        days: {
          include: {
            meals: {
              include: {
                meal: {
                  include: {
                    mealIngredients: {
                      include: {
                        ingredient: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(createdWeek);
  } catch (error) {
    console.error('Error duplicating week:', error);
    res.status(500).json({ error: 'Failed to duplicate week' });
  }
});

// Duplicate a day
router.post('/:programId/weeks/:weekId/days/:dayId/duplicate', async (req, res) => {
  try {
    const { programId, weekId, dayId } = req.params;
    const { targetDayOfWeek, trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Get the original day with meals
    const originalDay = await prisma.nutritionProgramDay.findFirst({
      where: {
        id: Number(dayId),
        nutritionProgramWeekId: Number(weekId),
        nutritionProgramWeek: {
          nutritionProgramId: Number(programId),
          nutritionProgram: {
            trainerId: Number(trainerId),
            isActive: true,
          },
        },
      },
      include: {
        meals: {
          include: {
            meal: {
              include: {
                mealIngredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!originalDay) {
      return res.status(404).json({ error: 'Day not found' });
    }

    // Create duplicated day
    const duplicatedDay = await prisma.nutritionProgramDay.create({
      data: {
        nutritionProgramWeekId: Number(weekId),
        dayOfWeek: targetDayOfWeek || originalDay.dayOfWeek,
        name: `Copy of ${originalDay.name}`,
      },
    });

    // Duplicate meals
    for (const programMeal of originalDay.meals) {
      await prisma.nutritionProgramMeal.create({
        data: {
          nutritionProgramId: Number(programId),
          nutritionProgramWeekId: Number(weekId),
          nutritionProgramDayId: duplicatedDay.id,
          mealId: programMeal.mealId,
          mealType: programMeal.mealType,
          order: programMeal.order,
          isCheatMeal: programMeal.isCheatMeal,
          cheatDescription: programMeal.cheatDescription,
          cheatImageUrl: programMeal.cheatImageUrl,
          customQuantity: programMeal.customQuantity,
          customNotes: programMeal.customNotes,
        },
      });
    }

    // Fetch the duplicated day with meals
    const createdDay = await prisma.nutritionProgramDay.findUnique({
      where: { id: duplicatedDay.id },
      include: {
        meals: {
          include: {
            meal: {
              include: {
                mealIngredients: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(createdDay);
  } catch (error) {
    console.error('Error duplicating day:', error);
    res.status(500).json({ error: 'Failed to duplicate day' });
  }
});

// Add a meal to a program day
router.post('/:programId/meals', async (req, res) => {
  try {
    const { programId } = req.params;
    const {
      mealId,
      nutritionProgramWeekId,
      nutritionProgramDayId,
      mealType,
      order,
      isCheatMeal,
      cheatDescription,
      cheatImageUrl,
      customQuantity,
      customNotes,
      trainerId,
    } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    if (!mealId || !mealType) {
      return res.status(400).json({ error: 'Meal ID and meal type are required' });
    }

    // Verify program ownership
    const program = await prisma.nutritionProgram.findFirst({
      where: {
        id: Number(programId),
        trainerId: Number(trainerId),
        isActive: true,
      },
    });

    if (!program) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    // Verify meal ownership
    const meal = await prisma.meal.findFirst({
      where: {
        id: Number(mealId),
        trainerId: Number(trainerId),
        isActive: true,
      },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Create the program meal
    const programMeal = await prisma.nutritionProgramMeal.create({
      data: {
        nutritionProgramId: Number(programId),
        nutritionProgramWeekId: nutritionProgramWeekId ? Number(nutritionProgramWeekId) : null,
        nutritionProgramDayId: nutritionProgramDayId ? Number(nutritionProgramDayId) : null,
        mealId: Number(mealId),
        mealType,
        order: order || 0,
        isCheatMeal: isCheatMeal || false,
        cheatDescription,
        cheatImageUrl,
        customQuantity: customQuantity || 1,
        customNotes,
      },
      include: {
        meal: {
          include: {
            mealIngredients: {
              include: {
                ingredient: true,
              },
            },
          },
        },
      },
    });

    res.json(programMeal);
  } catch (error) {
    console.error('Error adding meal to program:', error);
    res.status(500).json({ error: 'Failed to add meal to program' });
  }
});

// Update a program meal
router.put('/:programId/meals/:mealId', async (req, res) => {
  try {
    const { programId, mealId } = req.params;
    const {
      mealType,
      order,
      isCheatMeal,
      cheatDescription,
      cheatImageUrl,
      customQuantity,
      customNotes,
      trainerId,
    } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Verify program meal ownership
    const programMeal = await prisma.nutritionProgramMeal.findFirst({
      where: {
        id: Number(mealId),
        nutritionProgramId: Number(programId),
        nutritionProgram: {
          trainerId: Number(trainerId),
          isActive: true,
        },
      },
    });

    if (!programMeal) {
      return res.status(404).json({ error: 'Program meal not found' });
    }

    // Update the program meal
    const updatedProgramMeal = await prisma.nutritionProgramMeal.update({
      where: { id: Number(mealId) },
      data: {
        mealType,
        order,
        isCheatMeal,
        cheatDescription,
        cheatImageUrl,
        customQuantity,
        customNotes,
      },
      include: {
        meal: {
          include: {
            mealIngredients: {
              include: {
                ingredient: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedProgramMeal);
  } catch (error) {
    console.error('Error updating program meal:', error);
    res.status(500).json({ error: 'Failed to update program meal' });
  }
});

// Remove a meal from a program
router.delete('/:programId/meals/:mealId', async (req, res) => {
  try {
    const { programId, mealId } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Verify program meal ownership
    const programMeal = await prisma.nutritionProgramMeal.findFirst({
      where: {
        id: Number(mealId),
        nutritionProgramId: Number(programId),
        nutritionProgram: {
          trainerId: Number(trainerId),
          isActive: true,
        },
      },
    });

    if (!programMeal) {
      return res.status(404).json({ error: 'Program meal not found' });
    }

    // Delete the program meal
    await prisma.nutritionProgramMeal.delete({
      where: { id: Number(mealId) },
    });

    res.json({ message: 'Meal removed from program successfully' });
  } catch (error) {
    console.error('Error removing meal from program:', error);
    res.status(500).json({ error: 'Failed to remove meal from program' });
  }
});

// Helper function to get day name
function getDayName(dayOfWeek: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayOfWeek - 1];
}

export default router;
