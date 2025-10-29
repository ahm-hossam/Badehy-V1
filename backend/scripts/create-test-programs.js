const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPrograms() {
  try {
    // Find the trainer
    const trainer = await prisma.registered.findUnique({
      where: { email: 'trainer@test.com' },
      select: { id: true, fullName: true }
    });

    if (!trainer) {
      console.error('Trainer not found');
      return;
    }

    console.log(`Creating programs for trainer: ${trainer.fullName} (ID: ${trainer.id})`);

    // Get exercises for the trainer
    const exercises = await prisma.exercise.findMany({
      where: { trainerId: trainer.id },
      select: { id: true, name: true }
    });

    if (exercises.length === 0) {
      console.log('No exercises found. Creating sample exercises first...');
      // You might want to create sample exercises here or use existing ones
      return;
    }

    console.log(`Found ${exercises.length} exercises`);

    // Create 4-week workout program
    const workoutProgram = await prisma.program.create({
      data: {
        trainerId: trainer.id,
        name: '4-Week Strength & Conditioning',
        description: 'A comprehensive 4-week program focusing on strength building and cardiovascular conditioning',
        programDuration: 4,
        durationUnit: 'weeks',
        weeks: {
          create: [
            // Week 1
            {
              weekNumber: 1,
              name: 'Week 1: Foundation',
              days: {
                create: [
                  {
                    dayNumber: 1,
                    name: 'Upper Body Strength',
                    dayType: 'workout',
                    exercises: {
                      create: [
                        {
                          exerciseId: exercises[0].id,
                          sets: JSON.stringify([{ reps: 12, weight: null }]),
                          reps: '12',
                          rest: '60',
                          notes: 'Focus on form',
                          order: 1
                        },
                        {
                          exerciseId: exercises[1].id,
                          sets: JSON.stringify([{ reps: 10, weight: null }]),
                          reps: '10',
                          rest: '60',
                          notes: 'Full range of motion',
                          order: 2
                        }
                      ]
                    }
                  },
                  {
                    dayNumber: 2,
                    name: 'Lower Body Power',
                    dayType: 'workout',
                    exercises: {
                      create: [
                        {
                          exerciseId: exercises[1].id,
                          sets: JSON.stringify([{ reps: 15, weight: null }]),
                          reps: '15',
                          rest: '90',
                          notes: 'Explosive movement',
                          order: 1
                        }
                      ]
                    }
                  },
                  {
                    dayNumber: 3,
                    name: 'Cardio & Core',
                    dayType: 'workout',
                    exercises: {
                      create: []
                    }
                  }
                ]
              }
            },
            // Week 2
            {
              weekNumber: 2,
              name: 'Week 2: Building',
              days: {
                create: [
                  {
                    dayNumber: 1,
                    name: 'Push Day',
                    dayType: 'workout',
                    exercises: {
                      create: [
                        {
                          exerciseId: exercises[0].id,
                          sets: JSON.stringify([{ reps: 15, weight: null }]),
                          reps: '15',
                          rest: '60',
                          notes: 'Increase intensity',
                          order: 1
                        }
                      ]
                    }
                  }
                ]
              }
            },
            // Week 3 & 4 similar structure...
          ]
        }
      }
    });

    console.log('Workout program created:', workoutProgram.id);

    // Create 4-week nutrition program
    const nutritionProgram = await prisma.nutritionProgram.create({
      data: {
        trainerId: trainer.id,
        name: '4-Week Balanced Nutrition Plan',
        description: 'A structured meal plan focusing on balanced macros and nutrient timing',
        programDuration: 4,
        durationUnit: 'weeks',
        targetCalories: 2000,
        targetProtein: 150,
        targetCarbs: 200,
        targetFats: 70,
        usePercentages: false,
        meals: {
          create: []
        }
      }
    });

    console.log('Nutrition program created:', nutritionProgram.id);

    console.log('Test programs created successfully!');
  } catch (error) {
    console.error('Error creating test programs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPrograms();

