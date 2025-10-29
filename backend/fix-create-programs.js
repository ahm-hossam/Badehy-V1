const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPrograms() {
  try {
    // Delete existing programs
    await prisma.program.deleteMany({ where: { trainerId: 2, id: { in: [1] } } });
    await prisma.nutritionProgram.deleteMany({ where: { trainerId: 2, id: { in: [1] } } });
    console.log('Deleted old programs');

    // Get exercises
    const exercises = await prisma.exercise.findMany({ where: { trainerId: 2 } });

    // Create complete workout program
    const program = await prisma.program.create({
      data: {
        trainerId: 2,
        name: '4-Week Full Body Strength',
        description: 'Complete 4-week strength program with progressive overload',
        programDuration: 4,
        durationUnit: 'weeks',
        weeks: {
          create: exercises.slice(0, 1).map(ex => ({
            weekNumber: 1,
            name: 'Week 1',
            days: {
              create: [{
                dayNumber: 1,
                name: 'Full Body',
                exercises: {
                  create: [{
                    exerciseId: ex.id,
                    sets: [{ reps: 12, rest: 60 }],
                    notes: 'Focus on form',
                    order: 1
                  }]
                }
              }]
            }
          }))
        }
      }
    });

    console.log('✅ Workout program created:', program.id);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

fixPrograms();

