const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgramTaskGeneration() {
  try {
    console.log('Testing program update task generation...');
    
    // 1. Check all program assignments
    const allAssignments = await prisma.clientProgramAssignment.findMany({
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

    console.log('Total program assignments:', allAssignments.length);
    
    for (const assignment of allAssignments) {
      console.log('Assignment:', {
        id: assignment.id,
        clientName: assignment.client.fullName,
        programName: assignment.program.name,
        isActive: assignment.isActive,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        nextUpdateDate: assignment.nextUpdateDate,
        status: assignment.status
      });
    }

    // 2. Check active assignments with nextUpdateDate
    const activeAssignmentsWithUpdateDate = await prisma.clientProgramAssignment.findMany({
      where: {
        isActive: true,
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

    console.log('\nActive assignments with nextUpdateDate:', activeAssignmentsWithUpdateDate.length);
    
    for (const assignment of activeAssignmentsWithUpdateDate) {
      console.log('Active Assignment:', {
        id: assignment.id,
        clientName: assignment.client.fullName,
        programName: assignment.program.name,
        nextUpdateDate: assignment.nextUpdateDate,
        trainerId: assignment.trainerId
      });
    }

    // 3. Check for assignments due today
    const today = new Date();
    console.log('\nToday\'s date:', today.toISOString());
    
    const assignmentsDueToday = activeAssignmentsWithUpdateDate.filter(assignment => {
      if (!assignment.nextUpdateDate) return false;
      
      const updateDate = new Date(assignment.nextUpdateDate);
      
      const isSameDate = updateDate.getFullYear() === today.getFullYear() &&
                        updateDate.getMonth() === today.getMonth() &&
                        updateDate.getDate() === today.getDate();
      
      console.log('Checking assignment:', {
        id: assignment.id,
        nextUpdateDate: assignment.nextUpdateDate,
        updateDate: updateDate.toISOString(),
        today: today.toISOString(),
        isSameDate
      });
      
      return isSameDate;
    });

    console.log('\nAssignments due today:', assignmentsDueToday.length);

    // 4. Check existing tasks
    const existingTasks = await prisma.task.findMany({
      where: {
        category: 'Program',
        taskType: 'automatic',
      },
      include: {
        client: true
      }
    });

    console.log('\nExisting program tasks:', existingTasks.length);
    for (const task of existingTasks) {
      console.log('Task:', {
        id: task.id,
        title: task.title,
        clientName: task.client?.fullName,
        dueDate: task.dueDate,
        status: task.status
      });
    }

    // 5. Check all assignments regardless of active status
    console.log('\n=== Checking ALL assignments for today ===');
    const allAssignmentsForToday = allAssignments.filter(assignment => {
      if (!assignment.nextUpdateDate) return false;
      
      const updateDate = new Date(assignment.nextUpdateDate);
      
      const isSameDate = updateDate.getFullYear() === today.getFullYear() &&
                        updateDate.getMonth() === today.getMonth() &&
                        updateDate.getDate() === today.getDate();
      
      console.log('Checking ALL assignment:', {
        id: assignment.id,
        clientName: assignment.client.fullName,
        isActive: assignment.isActive,
        nextUpdateDate: assignment.nextUpdateDate,
        updateDate: updateDate.toISOString(),
        isSameDate
      });
      
      return isSameDate;
    });

    console.log('\nALL assignments due today (regardless of active status):', allAssignmentsForToday.length);

  } catch (error) {
    console.error('Error testing program task generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgramTaskGeneration(); 