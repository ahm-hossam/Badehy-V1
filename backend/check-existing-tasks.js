const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingTasks() {
  try {
    console.log('Checking existing tasks...');
    
    // Check all tasks for trainer 1
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
        clientName: task.client?.fullName,
        createdAt: task.createdAt
      });
    }
    
    // Check program tasks specifically
    const programTasks = await prisma.task.findMany({
      where: {
        trainerId: 1,
        category: 'Program'
      },
      include: {
        client: true
      }
    });
    
    console.log('\nProgram tasks:', programTasks.length);
    
    // Ask if user wants to delete existing program tasks
    console.log('\nDo you want to delete existing program tasks to test generation? (y/n)');
    // For now, let's just delete them automatically for testing
    if (programTasks.length > 0) {
      console.log('Deleting existing program tasks...');
      await prisma.task.deleteMany({
        where: {
          trainerId: 1,
          category: 'Program'
        }
      });
      console.log('Deleted existing program tasks');
    }
    
  } catch (error) {
    console.error('Error checking tasks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingTasks(); 