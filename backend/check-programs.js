const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPrograms() {
  try {
    console.log('Checking existing programs...');
    
    const programs = await prisma.program.findMany({
      include: {
        trainer: true
      }
    });
    
    console.log('Total programs:', programs.length);
    for (const program of programs) {
      console.log('Program:', {
        id: program.id,
        name: program.name,
        trainerId: program.trainerId,
        isImported: program.isImported
      });
    }
    
    console.log('\nChecking existing clients...');
    const clients = await prisma.trainerClient.findMany({
      select: {
        id: true,
        fullName: true,
        trainerId: true
      }
    });
    
    console.log('Total clients:', clients.length);
    for (const client of clients) {
      console.log('Client:', {
        id: client.id,
        fullName: client.fullName,
        trainerId: client.trainerId
      });
    }
    
  } catch (error) {
    console.error('Error checking programs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPrograms(); 