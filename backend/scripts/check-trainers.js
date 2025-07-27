const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTrainers() {
  try {
    const trainers = await prisma.registered.findMany({
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    console.log('Available trainers:');
    trainers.forEach(trainer => {
      console.log(`ID: ${trainer.id}, Name: ${trainer.fullName}, Email: ${trainer.email}`);
    });

    if (trainers.length === 0) {
      console.log('No trainers found in the database.');
    }
  } catch (error) {
    console.error('Error checking trainers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTrainers(); 