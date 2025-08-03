const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProgramTaskGeneration() {
  try {
    console.log('=== Testing Program Task Generation ===');
    
    const trainerId = 1;
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    console.log('Today:', today.toISOString());
    console.log('Three days from now:', threeDaysFromNow.toISOString());
    console.log('Trainer ID:', trainerId);
    
    // 1. Get all program assignments
    const allAssignments = await prisma.clientProgramAssignment.findMany({
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
    
    console.log('\n=== All Program Assignments ===');
    console.log('Total assignments with nextUpdateDate:', allAssignments.length);
    
    for (const assignment of allAssignments) {
      console.log('Assignment:', {
        id: assignment.id,
        clientName: assignment.client.fullName,
        programName: assignment.program.name,
        isActive: assignment.isActive,
        nextUpdateDate: assignment.nextUpdateDate,
        status: assignment.status
      });
    }
    
    // 2. Filter for assignments due in next 3 days
    const assignmentsDueSoon = allAssignments.filter(assignment => {
      if (!assignment.nextUpdateDate) return false;
      
      const updateDate = new Date(assignment.nextUpdateDate);
      
      // Compare only the date part (ignore time)
      const updateDateOnly = new Date(updateDate.getFullYear(), updateDate.getMonth(), updateDate.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const threeDaysFromNowOnly = new Date(threeDaysFromNow.getFullYear(), threeDaysFromNow.getMonth(), threeDaysFromNow.getDate());
      
      // Check if the update date is within the next 3 days
      const isWithinNextThreeDays = updateDateOnly >= todayOnly && updateDateOnly <= threeDaysFromNowOnly;
      
      console.log('\nChecking assignment:', {
        id: assignment.id,
        clientName: assignment.client.fullName,
        nextUpdateDate: assignment.nextUpdateDate,
        updateDate: updateDate.toISOString(),
        updateDateOnly: updateDateOnly.toISOString(),
        todayOnly: todayOnly.toISOString(),
        threeDaysFromNowOnly: threeDaysFromNowOnly.toISOString(),
        isWithinNextThreeDays
      });
      
      return isWithinNextThreeDays;
    });
    
    console.log('\n=== Assignments Due Soon ===');
    console.log('Assignments due in next 3 days:', assignmentsDueSoon.length);
    
    for (const assignment of assignmentsDueSoon) {
      console.log('Due Soon:', {
        id: assignment.id,
        clientName: assignment.client.fullName,
        programName: assignment.program.name,
        nextUpdateDate: assignment.nextUpdateDate
      });
    }
    
    // 3. Check existing tasks
    const existingTasks = await prisma.task.findMany({
      where: {
        trainerId: trainerId,
        category: 'Program',
        taskType: 'automatic',
      },
      include: {
        client: true
      }
    });
    
    console.log('\n=== Existing Program Tasks ===');
    console.log('Existing program tasks:', existingTasks.length);
    
    for (const task of existingTasks) {
      console.log('Task:', {
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        clientName: task.client?.fullName
      });
    }
    
    // 4. Simulate task creation for assignments due soon
    console.log('\n=== Simulating Task Creation ===');
    
    for (const assignment of assignmentsDueSoon) {
      // Check if task already exists
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
        console.log(`Should create task for ${assignment.client.fullName} - Program: ${assignment.program.name}, Due: ${assignment.nextUpdateDate}`);
        
        // Actually create the task
        const task = await prisma.task.create({
          data: {
            trainerId: trainerId,
            title: `Program update due for ${assignment.client.fullName}`,
            description: `Program "${assignment.program.name}" update is due on ${assignment.nextUpdateDate ? new Date(assignment.nextUpdateDate).toLocaleDateString() : 'unknown date'} for ${assignment.client.fullName}. Please review and update the program.`,
            taskType: 'automatic',
            category: 'Program',
            status: 'open',
            clientId: assignment.clientId,
            dueDate: assignment.nextUpdateDate,
          },
        });
        
        console.log(`Created task ID: ${task.id} for ${assignment.client.fullName}`);
      }
    }
    
    // 5. Check final task count
    const finalTasks = await prisma.task.findMany({
      where: {
        trainerId: trainerId,
        category: 'Program',
        taskType: 'automatic',
      },
      include: {
        client: true
      }
    });
    
    console.log('\n=== Final Program Tasks ===');
    console.log('Final program tasks:', finalTasks.length);
    
    for (const task of finalTasks) {
      console.log('Final Task:', {
        id: task.id,
        title: task.title,
        status: task.status,
        dueDate: task.dueDate,
        clientName: task.client?.fullName
      });
    }
    
  } catch (error) {
    console.error('Error testing program task generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProgramTaskGeneration(); 