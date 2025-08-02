const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...\n');

    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.registered.create({
      data: {
        fullName: 'Test Trainer',
        email: 'test@example.com',
        countryCode: 'US',
        countryName: 'United States',
        passwordHash: hashedPassword,
        phoneNumber: '+1234567890',
      },
    });

    console.log('✅ Test user created:');
    console.log(`ID: ${user.id}`);
    console.log(`Name: ${user.fullName}`);
    console.log(`Email: ${user.email}`);

    // Create a test task for this user
    const task = await prisma.task.create({
      data: {
        trainerId: user.id,
        title: 'Test Task',
        description: 'This is a test task to verify the functionality',
        taskType: 'manual',
        category: 'Manual',
        status: 'open',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    console.log('\n✅ Test task created:');
    console.log(`Task ID: ${task.id}`);
    console.log(`Title: ${task.title}`);

    // Test the task count
    const taskCount = await prisma.task.count({
      where: {
        trainerId: user.id,
        status: 'open',
      },
    });

    console.log(`\n✅ Open tasks count: ${taskCount}`);

    console.log('\n🎉 Test setup complete! You can now test the tasks functionality.');
    console.log(`Use trainer ID: ${user.id} for testing`);

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 