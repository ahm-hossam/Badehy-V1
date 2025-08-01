const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixClient202Force() {
  try {
    console.log('Fetching client 202...');
    
    const client = await prisma.trainerClient.findUnique({
      where: { id: 202 },
      include: {
        submissions: {
          include: {
            form: {
              select: {
                id: true,
                name: true,
                questions: true
              }
            }
          }
        }
      }
    });

    if (!client) {
      console.log('Client 202 not found');
      return;
    }

    console.log('Current client data:', {
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      gender: client.gender,
      age: client.age,
      source: client.source
    });

    if (client.submissions && client.submissions.length > 0) {
      const submission = client.submissions[0];
      const answers = submission.answers;
      const formQuestions = submission.form.questions;

      console.log('Form submission answers:', answers);
      console.log('Form questions:', formQuestions);

      // Extract the correct data from form answers
      let newFullName = null;
      let newEmail = null;
      let newPhone = null;
      let newGender = null;
      let newAge = null;
      let newSource = null;

      for (const question of formQuestions) {
        const answer = answers[String(question.id)];
        if (!answer) continue;

        const questionLabel = question.label.toLowerCase();

        if (questionLabel.includes('name') || questionLabel.includes('full')) {
          newFullName = answer;
        } else if (questionLabel.includes('email')) {
          newEmail = answer;
        } else if (questionLabel.includes('phone') || questionLabel.includes('mobile')) {
          newPhone = answer;
        } else if (questionLabel.includes('gender')) {
          newGender = answer;
        } else if (questionLabel.includes('age')) {
          newAge = answer;
        } else if (questionLabel.includes('source')) {
          newSource = answer;
        }
      }

      console.log('Extracted data:', {
        newFullName,
        newEmail,
        newPhone,
        newGender,
        newAge,
        newSource
      });

      // Force update the client with the correct data (override existing values)
      const updateData = {
        fullName: newFullName || 'Unknown',
        email: newEmail || '',
        phone: newPhone || '',
        gender: newGender || null,
        age: newAge ? parseInt(newAge) : null,
        source: newSource || null
      };

      console.log('Force updating client with:', updateData);
      
      const updatedClient = await prisma.trainerClient.update({
        where: { id: 202 },
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
    } else {
      console.log('No form submissions found for client 202');
    }

  } catch (error) {
    console.error('Error fixing client 202:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixClient202Force(); 