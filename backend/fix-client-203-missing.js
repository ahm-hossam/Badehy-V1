const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixClient203Missing() {
  try {
    console.log('Updating missing data for client 203...');
    
    // Force update the missing fields
    const updateData = {
      email: 'Trainer@test.com',
      gender: 'Male',
      age: 26,
      source: 'Facebook Ads'
    };

    console.log('Updating client with missing data:', updateData);
    
    const updatedClient = await prisma.trainerClient.update({
      where: { id: 203 },
      data: updateData
    });

    console.log('Client updated successfully:', {
      fullName: updatedClient.fullName,
      email: updatedClient.email,
      phone: updatedClient.phone,
      gender: updatedClient.gender,
      age: updatedClient.age,
      source: updatedClient.source
    });

  } catch (error) {
    console.error('Error fixing client 203:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixClient203Missing(); 