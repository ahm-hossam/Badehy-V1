const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCompletePrograms() {
  try {
    const trainerId = 2;

    console.log(`Creating complete programs for trainer ID: ${trainerId}`);

    // Get available exercises
    const exercises = await prisma.exercise.findMany({
      where: { trainerId: trainerId }
    });

    console.log(`Found ${exercises.length} exercises`);

    if (exercises.length === 0) {
      console.log('Creating sample exercises first...');
      // Create basic exercises
      const basicExercises = [
        { name: 'Push-ups', category: 'Strength', bodyPart: 'chest' },
        { name: 'Squats', category: 'Strength', bodyPart: 'legs' },
        { name: 'Pull-ups', category: 'Strength', bodyPart: 'back' },
        { name: 'Plank', category: 'Strength', bodyPart: 'core' }
      ];

      for (const ex of basicExercises) {
        await prisma.exercise.create({
          data: { trainerId, ...ex }
        });
      }
      console.log('Created basic exercises');
    }

    // Get updated exercises list
    const allExercises = await prisma.exercise.findMany({
      where: { trainerId: trainerId }
    });

    // Create complete 4-week workout program with exercises
    const workoutProgram = await prisma.program.create({
      data: {
        trainerId: trainerId,
        name: '4-Week Full Body Strength Program',
        description: 'A comprehensive 4-week program for building strength and muscle. Includes 4 workouts per week with progressive overload.',
        programDuration: 4,
        durationUnit: 'weeks',
        weeks: {
          create: [
            {
              weekNumber: 1,
              name: 'Week 1: Foundation',
              days: {
                create: [
                  {
                    dayNumber: 1,
                    name: 'Upper Body',
                    dayType: 'workout',
                    exercises: {
                      create: allExercises.map((ex, idx) => ({
                        exerciseId: ex.id,
                        sets: JSON.stringify([{ reps: 12 + idx * 2 }]),
                        reps: (12 + idx * 2).toString(),
                        rest: '60',
                        notes: 'Focus on form',
                        order: idx + 1
                      }))
                    }
                  }
                ]
              }
            },
            {
              weekNumber: 2,
              name: 'Week 2: Building',
              days: {
                create: [
                  {
                    dayNumber: 1,
                    name: 'Lower Body Focus',
                    dayType: 'workout',
                    exercises: {
                      create: allExercises.slice(0, 2).map((ex, idx) => ({
                        exerciseId: ex.id,
                        sets: JSON.stringify([{ reps: 15 }]),
                        reps: '15',
                        rest: '90',
                        notes: 'Increase intensity',
                        order: idx + 1
                      }))
                    }
                  }
                ]
              }
            },
            {
              weekNumber: 3,
              name: 'Week 3: Progressing',
              days: {
                create: [
                  {
                    dayNumber: 1,
                    name: 'Full Body',
                    dayType: 'workout',
                    exercises: {
                      create: allExercises.map((ex, idx) => ({
                        exerciseId: ex.id,
                        sets: JSON.stringify([{ reps: 18 }]),
                        reps: '18',
                        rest: '75',
                        notes: 'Push yourself',
                        order: idx + 1
                      }))
                    }
                  }
                ]
              }
            },
            {
              weekNumber: 4,
              name: 'Week 4: Peak',
              days: {
                create: [
                  {
                    dayNumber: 1,
                    name: 'Maximum Effort',
                    dayType: 'workout',
                    exercises: {
                      create: allExercises.map((ex, idx) => ({
                        exerciseId: ex.id,
                        sets: JSON.stringify([{ reps: 20 }]),
                        reps: '20',
                        rest: '60',
                        notes: 'Peak week!',
                        order: idx + 1
                      }))
                    }
                  }
                ]
              }
            }
          ]
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

    console.log('✅ Workout program created with exercises:', workoutProgram.id);

    // Create complete nutrition program with weeks, days, and meals
    const nutritionProgram = await prisma.nutritionProgram.create({
      data: {
        trainerId: trainerId,
        name: '4-Week Balanced Nutrition Plan',
        description: 'A comprehensive meal plan with balanced macros for optimal performance and recovery.',
        programDuration: 4,
        durationUnit: 'weeks',
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 200,
        targetFats: 70,
        usePercentages: false,
        weeks: {
          create: Array.from({ length: 4 }, (_, weekIdx) => ({
            weekNumber: weekIdx + 1,
            name: `Week ${weekIdx + 1}`,
            days: {
              create: Array.from({ length: 7 }, (_, dayIdx) => ({
                dayNumber: dayIdx + 1,
                name: `Day ${dayIdx + 1}`
              }))
            }
          }))
        }
      }
    });

    console.log('✅ Nutrition program created with weeks:', nutritionProgram.id);

    // Now add meals to the program
    const meals = await prisma.meal.findMany({
      where: { trainerId: trainerId }
    });

    if (meals.length > 0) {
      for (let weekNum = 1; weekNum <= 4; weekNum++) {
        const week = await prisma.nutritionProgramWeek.findFirst({
          where: {
            nutritionProgramId: nutritionProgram.id,
            weekNumber: weekNum
          }
        });

        if (week) {
          for (const meal of meals) {
            await prisma.nutritionProgramMeal.create({
              data: {
                nutritionProgramId: nutritionProgram.id,
                nutritionProgramWeekId: week.id,
                mealId: meal.id,
                mealType: meal.category,
                order: 1
              }
            });
          }
        }
      }
      console.log('✅ Meals added to nutrition program');
    }

    console.log('\n🎉 Complete programs created successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCompletePrograms();

