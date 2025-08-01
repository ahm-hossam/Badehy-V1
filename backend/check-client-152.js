const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClient152() {
  try {
    const client = await prisma.trainerClient.findUnique({
      where: { id: 152 },
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

    console.log('Client 152 Data:', JSON.stringify(client, null, 2));

    if (!client) {
      console.log('Client 152 not found');
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

    // Test the profile completion logic
    console.log('\n=== Profile Completion Logic Test ===');
    const normalize = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
    const latestSubmission = client.submissions && client.submissions[0];
    const answers = latestSubmission?.answers && typeof latestSubmission.answers === 'object' ? latestSubmission.answers : {};
    const formQuestions = latestSubmission?.form?.questions || [];
    
    console.log('Latest submission:', latestSubmission ? 'EXISTS' : 'NOT FOUND');
    console.log('Form questions count:', formQuestions.length);
    console.log('Answers:', answers);

    // Test the getValue function
    const getValue = (field) => {
      let value = client[field];
      if (value === undefined || value === null || value === '') {
        // Try to find the answer by matching field name to question label
        for (const q of formQuestions) {
          const normalizedLabel = normalize(q.label);
          const normalizedField = normalize(field);
          console.log(`Comparing: "${normalizedLabel}" vs "${normalizedField}"`);
          if (normalizedLabel === normalizedField) {
            value = answers[String(q.id)];
            console.log(`Found match for ${field}: ${value}`);
            break;
          }
        }
      }
      return value;
    };

    // Test each core field
    console.log('\n=== Core Field Mapping Test ===');
    const coreQuestions = ['fullName', 'phone', 'email', 'gender', 'age', 'source'];
    coreQuestions.forEach(field => {
      const value = getValue(field);
      console.log(`${field}: ${value} (${value ? 'FILLED' : 'EMPTY'})`);
    });

    // Debug age field specifically
    console.log('\n=== Age Field Debug ===');
    console.log('Looking for age field...');
    const ageField = formQuestions.find(q => normalize(q.label) === normalize('age'));
    console.log('Age question found:', ageField);
    if (ageField) {
      console.log('Age answer:', answers[String(ageField.id)]);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClient152(); 