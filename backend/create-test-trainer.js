const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestTrainer() {
  try {
    // Check if trainer already exists
    const existingTrainer = await prisma.registered.findFirst({
      where: { email: 'test@trainer.com' }
    });

    if (existingTrainer) {
      console.log('Test trainer already exists:', existingTrainer);
      return existingTrainer;
    }

    // Create test trainer
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const trainer = await prisma.registered.create({
      data: {
        fullName: 'Test Trainer',
        email: 'test@trainer.com',
        phoneNumber: '+1234567890',
        countryCode: 'US',
        countryName: 'United States',
        passwordHash: hashedPassword
      }
    });

    console.log('Test trainer created:', trainer);
    return trainer;
  } catch (error) {
    console.error('Error creating test trainer:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestTrainer()
  .then(() => {
    console.log('Test trainer creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create test trainer:', error);
    process.exit(1);
  }); 