const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestProgramAssignment() {
  try {
    console.log('Creating test program assignment with today\'s next update date...');
    
    // Get today's date
    const today = new Date();
    const nextUpdateDate = new Date(today);
    nextUpdateDate.setHours(0, 0, 0, 0); // Set to start of day
    
    console.log('Today:', today.toISOString());
    console.log('Next Update Date:', nextUpdateDate.toISOString());
    
    // Create a test program assignment
    const assignment = await prisma.clientProgramAssignment.create({
      data: {
        trainerId: 1,
        clientId: 1, // Assuming client with ID 1 exists
        programId: 1, // Assuming program with ID 1 exists
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        nextUpdateDate: nextUpdateDate,
        isActive: true,
        status: 'active'
      },
      include: {
        client: true,
        program: true
      }
    });
    
    console.log('Created test assignment:', {
      id: assignment.id,
      clientName: assignment.client.fullName,
      programName: assignment.program.name,
      nextUpdateDate: assignment.nextUpdateDate,
      isActive: assignment.isActive
    });
    
    // Now test task generation
    console.log('\nTesting task generation...');
    
    // Simulate the task generation logic
    const programUpdatesDueToday = await prisma.clientProgramAssignment.findMany({
      where: {
        trainerId: 1,
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
    
    console.log('Found assignments with nextUpdateDate:', programUpdatesDueToday.length);
    
    const updatesDueToday = programUpdatesDueToday.filter(assignment => {
      if (!assignment.nextUpdateDate) return false;
      
      const updateDate = new Date(assignment.nextUpdateDate);
      
      const isSameDate = updateDate.getFullYear() === today.getFullYear() &&
                        updateDate.getMonth() === today.getMonth() &&
                        updateDate.getDate() === today.getDate();
      
      console.log('Checking assignment:', {
        id: assignment.id,
        nextUpdateDate: assignment.nextUpdateDate,
        updateDate: updateDate.toISOString(),
        isSameDate
      });
      
      return isSameDate;
    });
    
    console.log('Assignments due today:', updatesDueToday.length);
    
    if (updatesDueToday.length > 0) {
      console.log('Should create tasks for:', updatesDueToday.map(a => a.client.fullName));
    }
    
  } catch (error) {
    console.error('Error creating test assignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProgramAssignment(); 