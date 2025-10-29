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
          clientAssignments: {
            include: {
              client: {
                select: {
                  id: true,
                  fullName: true
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
            
            // Skip cheat meals (they don't have meal data)
            if (meal) {
              totalCalories += (meal.totalCalories || 0) * quantity;
              totalProtein += (meal.totalProtein || 0) * quantity;
              totalCarbs += (meal.totalCarbs || 0) * quantity;
              totalFats += (meal.totalFats || 0) * quantity;
            }
          });
        });
      });

      // Calculate from direct meals (fallback)
      if (program.weeks.length === 0) {
        program.meals.forEach(programMeal => {
          const meal = programMeal.meal;
          const quantity = programMeal.customQuantity || 1;
          
          // Skip cheat meals (they don't have meal data)
          if (meal) {
            totalCalories += (meal.totalCalories || 0) * quantity;
            totalProtein += (meal.totalProtein || 0) * quantity;
            totalCarbs += (meal.totalCarbs || 0) * quantity;
            totalFats += (meal.totalFats || 0) * quantity;
          }
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

// Clone a nutrition program for customization (POST /api/nutrition-programs/:id/clone)
router.post('/:id/clone', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { trainerId, customizedForClientId } = req.body;

    if (!trainerId || !customizedForClientId) {
      return res.status(400).json({ error: 'Trainer ID and Client ID are required' });
    }

    // Fetch the original program with all its data
    const originalProgram = await prisma.nutritionProgram.findUnique({
      where: { id },
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
                            ingredient: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        meals: {
          include: {
            meal: {
              include: {
                mealIngredients: {
                  include: {
                    ingredient: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!originalProgram) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    // Get the client's name for the customized program name
    const client = await prisma.trainerClient.findUnique({
      where: { id: Number(customizedForClientId) },
      select: { fullName: true }
    });

    // Create the cloned program with customization metadata using a transaction
    const clonedProgram = await prisma.$transaction(async (tx) => {
      // Step 1: Create program with weeks and days (without meals)
      const program = await tx.nutritionProgram.create({
        data: {
          trainerId: Number(trainerId),
          name: `${originalProgram.name} (Customized)`,
          description: originalProgram.description,
          pdfUrl: originalProgram.pdfUrl,
          isImported: originalProgram.isImported,
          importedPdfUrl: originalProgram.importedPdfUrl,
          programDuration: originalProgram.programDuration,
          durationUnit: originalProgram.durationUnit,
          repeatCount: originalProgram.repeatCount,
          targetCalories: originalProgram.targetCalories,
          targetProtein: originalProgram.targetProtein,
          targetCarbs: originalProgram.targetCarbs,
          targetFats: originalProgram.targetFats,
          proteinPercentage: originalProgram.proteinPercentage,
          carbsPercentage: originalProgram.carbsPercentage,
          fatsPercentage: originalProgram.fatsPercentage,
          usePercentages: originalProgram.usePercentages,
          isActive: originalProgram.isActive,
          originalNutritionProgramId: id,
          customizedForClientId: Number(customizedForClientId),
          weeks: {
            create: originalProgram.weeks.map((week: any) => ({
              weekNumber: week.weekNumber,
              name: week.name,
              days: {
                create: week.days.map((day: any, dayIndex: number) => ({
                  dayOfWeek: day.dayOfWeek ?? ((dayIndex % 7) + 1),
                  name: day.name
                }))
              }
            }))
          }
        },
        include: {
          weeks: {
            include: {
              days: true
            }
          }
        }
      });

      // Step 2: Create meals for each day
      for (const week of originalProgram.weeks) {
        const createdWeek = program.weeks.find(w => w.weekNumber === week.weekNumber);
        if (!createdWeek) continue;

        for (const day of week.days) {
          const dayOfWeekValue = day.dayOfWeek ?? 1;
          const createdDay = createdWeek.days.find(d => d.dayOfWeek === dayOfWeekValue);
          if (!createdDay || !day.meals || day.meals.length === 0) continue;

          await tx.nutritionProgramMeal.createMany({
            data: day.meals.map((mealEntry: any) => ({
              nutritionProgramId: program.id,
              nutritionProgramWeekId: createdWeek.id,
              nutritionProgramDayId: createdDay.id,
              mealId: mealEntry.mealId,
              mealType: mealEntry.mealType,
              order: mealEntry.order,
              customNotes: mealEntry.customNotes || mealEntry.notes || null,
              isCheatMeal: mealEntry.isCheatMeal || false,
              cheatDescription: mealEntry.cheatDescription || null
            }))
          });
        }
      }

      // Step 3: Create top-level meals (not associated with specific days)
      const topLevelMeals = originalProgram.meals.filter((mealEntry: any) => !mealEntry.nutritionProgramDayId);
      if (topLevelMeals.length > 0) {
        await tx.nutritionProgramMeal.createMany({
          data: topLevelMeals.map((mealEntry: any) => {
            let weekId = null;
            if (mealEntry.nutritionProgramWeekId) {
              // Find the original week to get its weekNumber, then find the created week
              const originalWeek = originalProgram.weeks.find((w: any) => w.id === mealEntry.nutritionProgramWeekId);
              if (originalWeek) {
                const createdWeek = program.weeks.find((w: any) => w.weekNumber === originalWeek.weekNumber);
                weekId = createdWeek?.id || null;
              }
            }
            return {
              nutritionProgramId: program.id,
              nutritionProgramWeekId: weekId,
              mealId: mealEntry.mealId,
              mealType: mealEntry.mealType,
              order: mealEntry.order,
              isCheatMeal: mealEntry.isCheatMeal || false,
              cheatDescription: mealEntry.cheatDescription || null
            };
          })
        });
      }

      // Step 4: Fetch the complete program with all relations
      return await tx.nutritionProgram.findUnique({
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
                              ingredient: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          meals: {
            include: {
              meal: {
                include: {
                  mealIngredients: {
                    include: {
                      ingredient: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    });

    if (!clonedProgram) {
      return res.status(500).json({ error: 'Failed to create cloned program' });
    }

    res.json({
      ...clonedProgram,
      isCustomized: true,
      customizedFor: client?.fullName
    });
  } catch (error) {
    console.error('Error cloning nutrition program:', error);
    res.status(500).json({ error: 'Failed to clone nutrition program' });
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
            const day = await prisma.nutritionProgramDay.create({
              data: {
                nutritionProgramWeekId: week.id,
                dayOfWeek: dayData.dayOfWeek,
                name: dayData.name,
              },
            });

            // Create meals for this day
            if (dayData.meals && dayData.meals.length > 0) {
              for (const mealData of dayData.meals) {
                await prisma.nutritionProgramMeal.create({
                  data: {
                    nutritionProgramId: program.id,
                    nutritionProgramWeekId: week.id,
                    nutritionProgramDayId: day.id,
                    mealId: mealData.isCheatMeal ? null : mealData.mealId,
                    mealType: mealData.mealType,
                    order: mealData.order || 0,
                    isCheatMeal: mealData.isCheatMeal || false,
                    cheatDescription: mealData.cheatDescription,
                    cheatImageUrl: mealData.cheatImageUrl,
                    customQuantity: mealData.customQuantity,
                    customNotes: mealData.customNotes,
                  },
                });
              }
            }
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
      weeks,
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

    // Update the basic program fields
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
    });

    // Handle weeks, days, and meals updates
    if (weeks && weeks.length > 0) {
      // Delete existing weeks, days, and meals
      await prisma.nutritionProgramMeal.deleteMany({
        where: { nutritionProgramId: Number(id) }
      });
      await prisma.nutritionProgramDay.deleteMany({
        where: { 
          nutritionProgramWeek: {
            nutritionProgramId: Number(id)
          }
        }
      });
      await prisma.nutritionProgramWeek.deleteMany({
        where: { nutritionProgramId: Number(id) }
      });

      // Create new weeks and days
      for (const weekData of weeks) {
        const week = await prisma.nutritionProgramWeek.create({
          data: {
            nutritionProgramId: Number(id),
            weekNumber: weekData.weekNumber,
            name: weekData.name,
          },
        });

        // Create days for this week
        if (weekData.days && weekData.days.length > 0) {
          for (const dayData of weekData.days) {
            const day = await prisma.nutritionProgramDay.create({
              data: {
                nutritionProgramWeekId: week.id,
                dayOfWeek: dayData.dayOfWeek,
                name: dayData.name,
              },
            });

            // Create meals for this day
            if (dayData.meals && dayData.meals.length > 0) {
              for (const mealData of dayData.meals) {
                await prisma.nutritionProgramMeal.create({
                  data: {
                    nutritionProgramId: Number(id),
                    nutritionProgramWeekId: week.id,
                    nutritionProgramDayId: day.id,
                    // Only set mealId for non-cheat meals
                    ...(!(mealData.isCheatMeal) && { mealId: mealData.mealId }),
                    mealType: mealData.mealType,
                    order: mealData.order || 0,
                    isCheatMeal: mealData.isCheatMeal || false,
                    cheatDescription: mealData.cheatDescription,
                    cheatImageUrl: mealData.cheatImageUrl,
                    customQuantity: mealData.customQuantity,
                    customNotes: mealData.customNotes,
                  },
                });
              }
            }
          }
        }
      }
    }

    // Fetch the updated program with all relations
    const finalProgram = await prisma.nutritionProgram.findUnique({
      where: { id: Number(id) },
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

    res.json(finalProgram);
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

// Create a new nutrition program
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      programDuration,
      durationUnit,
      repeatCount,
      targetCalories,
      targetProtein,
      targetCarbs,
      targetFats,
      proteinPercentage,
      carbsPercentage,
      fatsPercentage,
      usePercentages,
      weeks,
      trainerId
    } = req.body;

    if (!trainerId || !name) {
      return res.status(400).json({ error: 'Trainer ID and program name are required' });
    }

    // Create the nutrition program
    const program = await prisma.nutritionProgram.create({
      data: {
        trainerId: Number(trainerId),
        name,
        description: description || '',
        programDuration: programDuration || 1,
        durationUnit: durationUnit || 'weeks',
        repeatCount: repeatCount || 1,
        targetCalories: targetCalories || 2000,
        targetProtein: targetProtein || 150,
        targetCarbs: targetCarbs || 200,
        targetFats: targetFats || 80,
        proteinPercentage: proteinPercentage || 30,
        carbsPercentage: carbsPercentage || 40,
        fatsPercentage: fatsPercentage || 30,
        usePercentages: usePercentages || false,
      },
    });

    // Create weeks, days, and meals if provided
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
            const day = await prisma.nutritionProgramDay.create({
              data: {
                nutritionProgramWeekId: week.id,
                dayOfWeek: dayData.dayOfWeek,
                name: dayData.name,
              },
            });

            // Create meals for this day
            if (dayData.meals && dayData.meals.length > 0) {
              for (const mealData of dayData.meals) {
                await prisma.nutritionProgramMeal.create({
                  data: {
                    nutritionProgramId: program.id,
                    nutritionProgramWeekId: week.id,
                    nutritionProgramDayId: day.id,
                    // Only set mealId for non-cheat meals
                    ...(!(mealData.isCheatMeal) && { mealId: mealData.mealId }),
                    mealType: mealData.mealType,
                    order: mealData.order || 0,
                    isCheatMeal: mealData.isCheatMeal || false,
                    cheatDescription: mealData.cheatDescription,
                    cheatImageUrl: mealData.cheatImageUrl,
                    customQuantity: mealData.customQuantity,
                    customNotes: mealData.customNotes,
                  },
                });
              }
            }
          }
        }
      }
    }

    // Fetch the complete program with all relations
    const finalProgram = await prisma.nutritionProgram.findUnique({
      where: { id: program.id },
      include: {
        weeks: {
          orderBy: { weekNumber: 'asc' },
          include: {
            days: {
              orderBy: { dayOfWeek: 'asc' },
              include: {
                meals: {
                  orderBy: { order: 'asc' },
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

    res.status(201).json(finalProgram);
  } catch (error) {
    console.error('Error creating nutrition program:', error);
    res.status(500).json({ error: 'Failed to create nutrition program' });
  }
});

// Helper function to get day name
function getDayName(dayOfWeek: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayOfWeek - 1];
}

// POST /:id/export-pdf - Export nutrition program as PDF
router.post('/:id/export-pdf', async (req, res) => {
  try {
    const programId = parseInt(req.params.id);
    
    console.log('Exporting nutrition program PDF for ID:', programId);
    
    // Fetch nutrition program with all related data
    const program = await prisma.nutritionProgram.findUnique({
      where: { id: programId },
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
      },
    });

    console.log('Found nutrition program:', program ? program.name : 'null');

    if (!program) {
      return res.status(404).json({ error: 'Nutrition program not found' });
    }

    // Generate HTML content for the PDF
    const htmlContent = generateNutritionProgramHTML(program);

    // Set response headers for HTML content that can be printed to PDF
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${program.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_nutrition_program.html"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.send(htmlContent);

  } catch (error) {
    console.error('Error generating nutrition program PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// Helper function to generate HTML content for nutrition programs
function generateNutritionProgramHTML(program: any): string {
  const currentDate = new Date().toLocaleDateString();
  
  // Calculate program totals
  let totalMeals = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  program.weeks.forEach((week: any) => {
    week.days.forEach((day: any) => {
      day.meals.forEach((programMeal: any) => {
        totalMeals++;
        if (programMeal.meal && !programMeal.isCheatMeal) {
          const quantity = programMeal.customQuantity || 1;
          totalCalories += (programMeal.meal.totalCalories || 0) * quantity;
          totalProtein += (programMeal.meal.totalProtein || 0) * quantity;
          totalCarbs += (programMeal.meal.totalCarbs || 0) * quantity;
          totalFats += (programMeal.meal.totalFats || 0) * quantity;
        }
      });
    });
  });
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${program.name} - Nutrition Program</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
          padding: 0 20px;
        }
        
        .header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 40px 0;
          text-align: center;
          margin-bottom: 40px;
          border-radius: 10px;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
        }
        
        .program-info {
          background: #f0fdf4;
          padding: 30px;
          border-radius: 10px;
          margin-bottom: 40px;
          border-left: 5px solid #10b981;
        }
        
        .program-info h2 {
          color: #059669;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        
        .program-info p {
          font-size: 1.1rem;
          line-height: 1.8;
          margin-bottom: 10px;
        }
        
        .week-section {
          margin-bottom: 50px;
          page-break-inside: avoid;
        }
        
        .week-header {
          background: #10b981;
          color: white;
          padding: 20px;
          border-radius: 8px 8px 0 0;
          font-size: 1.3rem;
          font-weight: 600;
        }
        
        .day-section {
          border: 1px solid #e5e7eb;
          border-top: none;
          margin-bottom: 20px;
        }
        
        .day-header {
          background: #f9fafb;
          padding: 15px 20px;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          font-size: 1.1rem;
          color: #374151;
        }
        
        .meals-list {
          padding: 20px;
        }
        
        .meal-item {
          margin-bottom: 25px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fafafa;
        }
        
        .meal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .meal-name {
          font-weight: 600;
          font-size: 1.1rem;
          color: #059669;
        }
        
        .meal-type {
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        
        .cheat-meal {
          background: #f59e0b;
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-weight: 600;
          margin-bottom: 15px;
        }
        
        .meal-nutrition {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 15px;
          padding: 10px;
          background: white;
          border-radius: 6px;
        }
        
        .nutrition-item {
          text-align: center;
        }
        
        .nutrition-label {
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        .nutrition-value {
          font-weight: 600;
          color: #059669;
        }
        
        .ingredients-list {
          margin-top: 10px;
        }
        
        .ingredients-title {
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }
        
        .ingredient-item {
          font-size: 0.9rem;
          color: #6b7280;
          margin-bottom: 4px;
          padding-left: 15px;
          position: relative;
        }
        
        .ingredient-item:before {
          content: "•";
          color: #10b981;
          position: absolute;
          left: 0;
        }
        
        .footer {
          margin-top: 50px;
          padding: 20px;
          text-align: center;
          color: #6b7280;
          font-size: 0.9rem;
          border-top: 1px solid #e5e7eb;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .header {
            background: #10b981 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            page-break-inside: avoid;
          }
          
          .week-header {
            background: #10b981 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            page-break-inside: avoid;
          }
          
          .week-section {
            page-break-inside: avoid;
            margin-bottom: 20px;
          }
          
          .day-section {
            page-break-inside: avoid;
            margin-bottom: 15px;
          }
          
          .meal-item {
            page-break-inside: avoid;
            margin-bottom: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${program.name}</h1>
        <div class="subtitle">Professional Nutrition Program</div>
      </div>
      
      <div class="program-info">
        <h2>Program Overview</h2>
        <p>${program.description || 'A comprehensive nutrition program designed to help you achieve your health and fitness goals.'}</p>
        <p><strong>Duration:</strong> ${program.weeks.length} weeks | <strong>Total Meals:</strong> ${totalMeals} meals</p>
        <p><strong>Program Totals:</strong> ${Math.round(totalCalories)} calories | ${Math.round(totalProtein)}g protein | ${Math.round(totalCarbs)}g carbs | ${Math.round(totalFats)}g fats</p>
      </div>
      
      ${program.weeks.map((week: any, weekIndex: number) => `
        <div class="week-section">
          <div class="week-header">
            Week ${weekIndex + 1} - ${week.name}
          </div>
          
          ${week.days.map((day: any, dayIndex: number) => `
            <div class="day-section">
              <div class="day-header">
                ${day.name}
              </div>
              
              <div class="meals-list">
                ${day.meals.length === 0 ? `
                  <p style="text-align: center; color: #6b7280; font-style: italic; padding: 20px;">No meals planned for this day</p>
                ` : day.meals.map((programMeal: any) => {
                  if (programMeal.isCheatMeal) {
                    return `
                      <div class="cheat-meal">
                        🍕 Cheat Meal: ${programMeal.cheatDescription || 'Enjoy your favorite meal!'}
                      </div>
                    `;
                  } else if (programMeal.meal) {
                    const meal = programMeal.meal;
                    const quantity = programMeal.customQuantity || 1;
                    const calories = Math.round((meal.totalCalories || 0) * quantity);
                    const protein = Math.round((meal.totalProtein || 0) * quantity);
                    const carbs = Math.round((meal.totalCarbs || 0) * quantity);
                    const fats = Math.round((meal.totalFats || 0) * quantity);
                    
                    return `
                      <div class="meal-item">
                        <div class="meal-header">
                          <div class="meal-name">${meal.name}</div>
                          <div class="meal-type">${programMeal.mealType}</div>
                        </div>
                        
                        <div class="meal-nutrition">
                          <div class="nutrition-item">
                            <div class="nutrition-label">Calories</div>
                            <div class="nutrition-value">${calories}</div>
                          </div>
                          <div class="nutrition-item">
                            <div class="nutrition-label">Protein</div>
                            <div class="nutrition-value">${protein}g</div>
                          </div>
                          <div class="nutrition-item">
                            <div class="nutrition-label">Carbs</div>
                            <div class="nutrition-value">${carbs}g</div>
                          </div>
                          <div class="nutrition-item">
                            <div class="nutrition-label">Fats</div>
                            <div class="nutrition-value">${fats}g</div>
                          </div>
                        </div>
                        
                        ${meal.mealIngredients && meal.mealIngredients.length > 0 ? `
                          <div class="ingredients-list">
                            <div class="ingredients-title">Ingredients:</div>
                            ${meal.mealIngredients.map((mealIngredient: any) => {
                              const ingredient = mealIngredient.ingredient;
                              const amount = mealIngredient.quantity * quantity;
                              const unit = mealIngredient.unit || ingredient.unitType || 'g';
                              return `
                                <div class="ingredient-item">
                                  ${ingredient.name} - ${amount}${unit}
                                </div>
                              `;
                            }).join('')}
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }
                  return '';
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
      
      <div class="footer">
        <p>Generated on ${currentDate} | TRAINZY Nutrition Program Builder</p>
        <p>For personal use only. Professional nutrition programs.</p>
      </div>
    </body>
    </html>
  `;
}

export default router;