const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSampleExercises(trainerId = null) {
  try {
    // If no trainerId provided, get the first available trainer
    let targetTrainerId = trainerId;
    
    if (!targetTrainerId) {
      const firstTrainer = await prisma.registered.findFirst({
        select: { id: true, fullName: true, email: true }
      });
      
      if (!firstTrainer) {
        console.error('No trainers found in the database. Please create a trainer first.');
        return;
      }
      
      targetTrainerId = firstTrainer.id;
      console.log(`Using trainer: ${firstTrainer.fullName} (ID: ${firstTrainer.id})`);
    } else {
      // Verify the provided trainer exists
      const trainer = await prisma.registered.findUnique({
        where: { id: parseInt(targetTrainerId) },
        select: { id: true, fullName: true, email: true }
      });
      
      if (!trainer) {
        console.error(`Trainer with ID ${targetTrainerId} not found.`);
        return;
      }
      
      console.log(`Using trainer: ${trainer.fullName} (ID: ${trainer.id})`);
    }

    // Sample exercises with ExerciseDB format
    const sampleExercises = [
      {
        trainerId: targetTrainerId,
        name: 'Push-ups',
        description: 'A classic bodyweight exercise for chest, shoulders, and triceps',
        category: 'Strength',
        bodyPart: 'chest',
        equipment: 'body weight',
        target: 'pectoralis major',
        secondaryMuscles: ['triceps', 'anterior deltoids'],
        instructions: [
          'Start in a plank position with hands slightly wider than shoulders',
          'Lower your body until chest nearly touches the floor',
          'Push back up to starting position',
          'Keep your core tight throughout the movement'
        ],
        gifUrl: 'https://example.com/pushup.gif',
        source: 'ExerciseDB'
      },
      {
        trainerId: targetTrainerId,
        name: 'Squats',
        description: 'Fundamental lower body exercise for legs and glutes',
        category: 'Strength',
        bodyPart: 'upper legs',
        equipment: 'body weight',
        target: 'quadriceps',
        secondaryMuscles: ['glutes', 'hamstrings', 'calves'],
        instructions: [
          'Stand with feet shoulder-width apart',
          'Lower your body as if sitting back into a chair',
          'Keep your chest up and knees behind toes',
          'Return to standing position'
        ],
        gifUrl: 'https://example.com/squat.gif',
        source: 'ExerciseDB'
      },
      {
        trainerId: targetTrainerId,
        name: 'Pull-ups',
        description: 'Upper body pulling exercise for back and biceps',
        category: 'Strength',
        bodyPart: 'back',
        equipment: 'body weight',
        target: 'latissimus dorsi',
        secondaryMuscles: ['biceps', 'rhomboids', 'trapezius'],
        instructions: [
          'Hang from a pull-up bar with hands wider than shoulders',
          'Pull your body up until chin is over the bar',
          'Lower back down with control',
          'Keep your core engaged throughout'
        ],
        gifUrl: 'https://example.com/pullup.gif',
        source: 'ExerciseDB'
      },
      {
        trainerId: targetTrainerId,
        name: 'Custom Bench Press',
        description: 'A custom exercise created by the trainer',
        category: 'Strength',
        videoUrl: 'https://www.youtube.com/watch?v=example',
        source: null // Custom exercise
      },
      {
        trainerId: targetTrainerId,
        name: 'Custom Deadlift',
        description: 'Another custom exercise for the trainer',
        category: 'Strength',
        videoUrl: 'https://www.youtube.com/watch?v=example2',
        source: null // Custom exercise
      }
    ];

    console.log('Creating sample exercises...');

    for (const exercise of sampleExercises) {
      const created = await prisma.exercise.create({
        data: exercise
      });
      console.log(`Created exercise: ${created.name} (ID: ${created.id})`);
    }

    console.log('Sample exercises created successfully!');
  } catch (error) {
    console.error('Error creating sample exercises:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get trainer ID from command line argument if provided
const trainerId = process.argv[2] || null;

if (trainerId) {
  console.log(`Using provided trainer ID: ${trainerId}`);
}

createSampleExercises(trainerId); 