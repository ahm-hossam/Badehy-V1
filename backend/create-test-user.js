const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await prisma.registered.findFirst({
      where: { email: 'test@example.com' }
    });

    if (existingUser) {
      console.log('Test user already exists with ID:', existingUser.id);
      return existingUser;
    }

    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.registered.create({
      data: {
        email: 'test@example.com',
        passwordHash: hashedPassword,
        fullName: 'Test Trainer',
        phoneNumber: '+1234567890',
        countryCode: 'US',
        countryName: 'United States'
      }
    });

    console.log('Test user created successfully with ID:', user.id);
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
    return user;
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser(); 