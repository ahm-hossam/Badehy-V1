const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClient151() {
  try {
    const client = await prisma.trainerClient.findUnique({
      where: { id: 151 },
      include: {
        teamAssignments: {
          include: {
            teamMember: true
          }
        },
        subscriptions: {
          include: {
            package: true
          }
        },
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          include: {
            form: { select: { id: true, name: true, questions: true } },
          },
        }
      }
    });

    console.log('Client 151 Data:', JSON.stringify(client, null, 2));

    if (!client) {
      console.log('Client 151 not found');
      return;
    }

    // Check core fields
    const coreFields = ['fullName', 'phone', 'email', 'gender', 'age', 'source'];
    console.log('\n=== Core Fields Check ===');
    coreFields.forEach(field => {
      const value = client[field];
      console.log(`${field}: ${value} (${value ? 'FILLED' : 'EMPTY'})`);
    });

    // Check team assignments
    console.log('\n=== Team Assignments ===');
    console.log(`Team assignments count: ${client.teamAssignments.length}`);
    client.teamAssignments.forEach(assignment => {
      console.log(`- ${assignment.teamMember.fullName} (${assignment.teamMember.role})`);
    });

    // Check subscriptions
    console.log('\n=== Subscriptions ===');
    console.log(`Subscriptions count: ${client.subscriptions.length}`);
    if (client.subscriptions.length > 0) {
      const subscription = client.subscriptions[0];
      const requiredFields = ['startDate', 'durationValue', 'durationUnit', 'paymentStatus', 'packageId'];
      requiredFields.forEach(field => {
        const value = subscription[field];
        console.log(`${field}: ${value} (${value ? 'FILLED' : 'EMPTY'})`);
      });
    }

    // Check registration date
    console.log('\n=== Registration Date ===');
    console.log(`Registration date: ${client.registrationDate} (${client.registrationDate ? 'FILLED' : 'EMPTY'})`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClient151(); 