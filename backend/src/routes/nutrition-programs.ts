import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all nutrition programs for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId, search, page = 1, limit = 50 } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where: any = {
      trainerId: Number(trainerId),
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.nutritionProgram.findMany({
        where,
        include: {
          weeks: {
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
          },
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
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),
      prisma.nutritionProgram.count({ where }),
    ]);

    // Calculate nutritional totals for each program
    const programsWithTotals = programs.map(program => {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFats = 0;

      // Calculate from weeks structure
      program.weeks.forEach(week => {
        week.days.forEach(day => {
          day.meals.forEach(programMeal => {
            const meal = programMeal.meal;
            const quantity = programMeal.customQuantity || 1;
            
            totalCalories += meal.totalCalories * quantity;
            totalProtein += meal.totalProtein * quantity;
            totalCarbs += meal.totalCarbs * quantity;
            totalFats += meal.totalFats * quantity;
          });
        });
      });

      // Calculate from direct meals (fallback)
      if (program.weeks.length === 0) {
        program.meals.forEach(programMeal => {
          const meal = programMeal.meal;
          const quantity = programMeal.customQuantity || 1;
          
          totalCalories += meal.totalCalories * quantity;
          totalProtein += meal.totalProtein * quantity;
          totalCarbs += meal.totalCarbs * quantity;
          totalFats += meal.totalFats * quantity;
        });
      }

      return {
        ...program,
        calculatedCalories: Math.round(totalCalories),
        calculatedProtein: Math.round(totalProtein),
        calculatedCarbs: Math.round(totalCarbs),
        calculatedFats: Math.round(totalFats),
      };
    });

    res.json({
      programs: programsWithTotals,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error('Error fetching nutrition programs:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition programs' });
  }
});

// Get a single nutrition program
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const program = await prisma.nutritionProgram.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
        isActive: true,
      },
      include: {
        weeks: {
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
        },
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

    if (!program) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    res.json(program);
  } catch (error) {
    console.error('Error fetching nutrition program:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition program' });
  }
});

// Create a new nutrition program
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      programDuration,
      repeatCount,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      proteinPercentage,
      carbsPercentage,
      fatsPercentage,
      usePercentages,
      trainerId,
      weeks,
    } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Program name is required' });
    }

    // Create the program
    const program = await prisma.nutritionProgram.create({
      data: {
        trainerId: Number(trainerId),
        name,
        description,
        programDuration: programDuration || 1,
        repeatCount: repeatCount || 1,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFats,
        proteinPercentage,
        carbsPercentage,
        fatsPercentage,
        usePercentages: usePercentages || false,
      },
    });

    // Create weeks and days if provided
    if (weeks && weeks.length > 0) {
      for (const weekData of weeks) {
        const week = await prisma.nutritionProgramWeek.create({
          data: {
            nutritionProgramId: program.id,
            weekNumber: weekData.weekNumber,
            name: weekData.name,
          },
        });

        // Create days for this week
        if (weekData.days && weekData.days.length > 0) {
          for (const dayData of weekData.days) {
            await prisma.nutritionProgramDay.create({
              data: {
                nutritionProgramWeekId: week.id,
                dayOfWeek: dayData.dayOfWeek,
                name: dayData.name,
              },
            });
          }
        }
      }
    } else {
      // Create default week with 7 days
      const week = await prisma.nutritionProgramWeek.create({
        data: {
          nutritionProgramId: program.id,
          weekNumber: 1,
          name: 'Week 1',
        },
      });

      // Create 7 days (Monday to Sunday)
      for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
        await prisma.nutritionProgramDay.create({
          data: {
            nutritionProgramWeekId: week.id,
            dayOfWeek,
            name: getDayName(dayOfWeek),
          },
        });
      }
    }

    // Fetch the created program with all relations
    const createdProgram = await prisma.nutritionProgram.findUnique({
      where: { id: program.id },
      include: {
        weeks: {
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
        },
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

    res.json(createdProgram);
  } catch (error) {
    console.error('Error creating nutrition program:', error);
    res.status(500).json({ error: 'Failed to create nutrition program' });
  }
});

// Update a nutrition program
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      programDuration,
      repeatCount,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      proteinPercentage,
      carbsPercentage,
      fatsPercentage,
      usePercentages,
      trainerId,
    } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const program = await prisma.nutritionProgram.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
        isActive: true,
      },
    });

    if (!program) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    const updatedProgram = await prisma.nutritionProgram.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        programDuration,
        repeatCount,
        targetCalories,
        targetProtein,
        targetCarbs,
        targetFats,
        proteinPercentage,
        carbsPercentage,
        fatsPercentage,
        usePercentages,
      },
      include: {
        weeks: {
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
        },
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

    res.json(updatedProgram);
  } catch (error) {
    console.error('Error updating nutrition program:', error);
    res.status(500).json({ error: 'Failed to update nutrition program' });
  }
});

// Delete a nutrition program
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const program = await prisma.nutritionProgram.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
        isActive: true,
      },
    });

    if (!program) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    await prisma.nutritionProgram.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    res.json({ message: 'Nutrition program deleted successfully' });
  } catch (error) {
    console.error('Error deleting nutrition program:', error);
    res.status(500).json({ error: 'Failed to delete nutrition program' });
  }
});

// Duplicate a nutrition program
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Get the original program with all relations
    const originalProgram = await prisma.nutritionProgram.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
        isActive: true,
      },
      include: {
        weeks: {
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
        },
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

    if (!originalProgram) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    // Create duplicated program
    const duplicatedProgram = await prisma.nutritionProgram.create({
      data: {
        trainerId: Number(trainerId),
        name: `Copy of ${originalProgram.name}`,
        description: originalProgram.description,
        programDuration: originalProgram.programDuration,
        repeatCount: originalProgram.repeatCount,
        targetCalories: originalProgram.targetCalories,
        targetProtein: originalProgram.targetProtein,
        targetCarbs: originalProgram.targetCarbs,
        targetFats: originalProgram.targetFats,
        proteinPercentage: originalProgram.proteinPercentage,
        carbsPercentage: originalProgram.carbsPercentage,
        fatsPercentage: originalProgram.fatsPercentage,
        usePercentages: originalProgram.usePercentages,
      },
    });

    // Duplicate weeks and days
    for (const week of originalProgram.weeks) {
      const duplicatedWeek = await prisma.nutritionProgramWeek.create({
        data: {
          nutritionProgramId: duplicatedProgram.id,
          weekNumber: week.weekNumber,
          name: week.name,
        },
      });

      // Duplicate days
      for (const day of week.days) {
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
              nutritionProgramId: duplicatedProgram.id,
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
    }

    // Fetch the duplicated program with all relations
    const createdProgram = await prisma.nutritionProgram.findUnique({
      where: { id: duplicatedProgram.id },
      include: {
        weeks: {
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
        },
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

    res.json(createdProgram);
  } catch (error) {
    console.error('Error duplicating nutrition program:', error);
    res.status(500).json({ error: 'Failed to duplicate nutrition program' });
  }
});

// Helper function to get day name
function getDayName(dayOfWeek: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayOfWeek - 1];
}

export default router;