const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCurrentTaskGeneration() {
  try {
    console.log('Testing current task generation logic...');
    
    const trainerId = 1;
    const today = new Date();
    
    console.log('Today:', today.toISOString());
    console.log('Trainer ID:', trainerId);
    
    // Get all program assignments with nextUpdateDate
    const programUpdatesDueToday = await prisma.clientProgramAssignment.findMany({
      where: {
        trainerId: trainerId,
        nextUpdateDate: {
          not: null,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    
    console.log('Total assignments with nextUpdateDate:', programUpdatesDueToday.length);
    
    // Filter for assignments due today
    const updatesDueToday = programUpdatesDueToday.filter(assignment => {
      if (!assignment.nextUpdateDate) return false;
      
      const updateDate = new Date(assignment.nextUpdateDate);
      
      const isSameDate = updateDate.getFullYear() === today.getFullYear() &&
                        updateDate.getMonth() === today.getMonth() &&
                        updateDate.getDate() === today.getDate();
      
      console.log('Checking assignment:', {
        id: assignment.id,
        clientName: assignment.client.fullName,
        programName: assignment.program.name,
        isActive: assignment.isActive,
        nextUpdateDate: assignment.nextUpdateDate,
        updateDate: updateDate.toISOString(),
        isSameDate
      });
      
      return isSameDate;
    });
    
    console.log('\nAssignments due today:', updatesDueToday.length);
    
    if (updatesDueToday.length > 0) {
      console.log('\nShould create tasks for:');
      for (const assignment of updatesDueToday) {
        console.log(`- ${assignment.client.fullName} (${assignment.program.name})`);
      }
      
      // Check if tasks already exist
      for (const assignment of updatesDueToday) {
        const existingTask = await prisma.task.findFirst({
          where: {
            trainerId: trainerId,
            clientId: assignment.clientId,
            category: 'Program',
            taskType: 'automatic',
            status: 'open',
          },
        });
        
        if (existingTask) {
          console.log(`Task already exists for ${assignment.client.fullName}`);
        } else {
          console.log(`No task exists for ${assignment.client.fullName} - should create one`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error testing task generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCurrentTaskGeneration(); 