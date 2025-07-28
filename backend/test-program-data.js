const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgramData() {
  try {
    console.log('Testing program data structure...');
    
    // Get all programs
    const programs = await prisma.program.findMany({
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
    
    console.log(`Found ${programs.length} programs`);
    
    programs.forEach((program, index) => {
      console.log(`\nProgram ${index + 1}:`);
      console.log(`  ID: ${program.id}`);
      console.log(`  Name: ${program.name}`);
      console.log(`  Description: ${program.description}`);
      console.log(`  Trainer ID: ${program.trainerId}`);
      console.log(`  Weeks: ${program.weeks.length}`);
      
      program.weeks.forEach((week, weekIndex) => {
        console.log(`    Week ${weekIndex + 1}:`);
        console.log(`      ID: ${week.id}`);
        console.log(`      Week Number: ${week.weekNumber}`);
        console.log(`      Name: ${week.name}`);
        console.log(`      Days: ${week.days.length}`);
        
        week.days.forEach((day, dayIndex) => {
          console.log(`        Day ${dayIndex + 1}:`);
          console.log(`          ID: ${day.id}`);
          console.log(`          Day Number: ${day.dayNumber}`);
          console.log(`          Name: ${day.name}`);
          console.log(`          Exercises: ${day.exercises.length}`);
          
          day.exercises.forEach((exercise, exerciseIndex) => {
            console.log(`            Exercise ${exerciseIndex + 1}:`);
            console.log(`              ID: ${exercise.id}`);
            console.log(`              Exercise ID: ${exercise.exerciseId}`);
            console.log(`              Order: ${exercise.order}`);
            console.log(`              Sets: ${exercise.sets}`);
            console.log(`              Reps: ${exercise.reps}`);
            console.log(`              Duration: ${exercise.duration}`);
            console.log(`              Rest Time: ${exercise.restTime}`);
            console.log(`              Notes: ${exercise.notes}`);
            console.log(`              Exercise Name: ${exercise.exercise?.name || 'N/A'}`);
          });
        });
      });
    });
    
  } catch (error) {
    console.error('Error testing program data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgramData(); 