const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixClient200() {
  try {
    console.log('Fetching client 200...');
    
    const client = await prisma.trainerClient.findUnique({
      where: { id: 200 },
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
      console.log('Client 200 not found');
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

      // Fallback logic for name
      if (!newFullName) {
        for (const question of formQuestions) {
          const answer = answers[String(question.id)];
          if (answer && typeof answer === 'string' && answer.length > 1) {
            if (!answer.includes('@') && !answer.match(/^\d+$/) && !['male', 'female', 'other'].includes(answer.toLowerCase())) {
              newFullName = answer;
              break;
            }
          }
        }
      }

      // Fallback logic for email
      if (!newEmail) {
        for (const question of formQuestions) {
          const answer = answers[String(question.id)];
          if (answer && typeof answer === 'string' && answer.includes('@')) {
            newEmail = answer;
            break;
          }
        }
      }

      // Fallback logic for phone
      if (!newPhone) {
        for (const question of formQuestions) {
          const answer = answers[String(question.id)];
          if (answer && typeof answer === 'string' && (answer.match(/^\d+$/) || answer.includes('+'))) {
            newPhone = answer;
            break;
          }
        }
      }

      // Fallback logic for gender
      if (!newGender) {
        for (const question of formQuestions) {
          const answer = answers[String(question.id)];
          if (answer && typeof answer === 'string' && ['male', 'female', 'other'].includes(answer.toLowerCase())) {
            newGender = answer;
            break;
          }
        }
      }

      // Fallback logic for age
      if (!newAge) {
        for (const question of formQuestions) {
          const answer = answers[String(question.id)];
          if (answer && !isNaN(Number(answer)) && Number(answer) > 0 && Number(answer) < 120) {
            newAge = answer;
            break;
          }
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

      // Update the client with the correct data
      const updateData = {};
      if (newFullName) updateData.fullName = newFullName;
      if (newEmail) updateData.email = newEmail;
      if (newPhone) updateData.phone = newPhone;
      if (newGender) updateData.gender = newGender;
      if (newAge) updateData.age = parseInt(newAge);
      if (newSource) updateData.source = newSource;

      if (Object.keys(updateData).length > 0) {
        console.log('Updating client with:', updateData);
        
        const updatedClient = await prisma.trainerClient.update({
          where: { id: 200 },
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
        console.log('No data to update');
      }
    } else {
      console.log('No form submissions found for client 200');
    }

  } catch (error) {
    console.error('Error fixing client 200:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixClient200(); 