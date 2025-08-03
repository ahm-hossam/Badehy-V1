const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProgramTasks() {
  try {
    console.log('Checking existing program tasks...');
    
    const tasks = await prisma.task.findMany({
      where: {
        category: 'Program',
        taskType: 'automatic',
      },
      include: {
        client: true,
        assignedTeamMember: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('Total program tasks:', tasks.length);
    
    for (const task of tasks) {
      console.log('Task:', {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        createdAt: task.createdAt,
        clientName: task.client?.fullName,
        assignedTo: task.assignedTeamMember?.fullName
      });
    }
    
    // Check all tasks for trainer 1
    console.log('\nAll tasks for trainer 1:');
    const allTasks = await prisma.task.findMany({
      where: {
        trainerId: 1
      },
      include: {
        client: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('Total tasks for trainer 1:', allTasks.length);
    
    for (const task of allTasks) {
      console.log('Task:', {
        id: task.id,
        title: task.title,
        category: task.category,
        status: task.status,
        dueDate: task.dueDate,
        clientName: task.client?.fullName
      });
    }
    
  } catch (error) {
    console.error('Error checking program tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgramTasks(); 