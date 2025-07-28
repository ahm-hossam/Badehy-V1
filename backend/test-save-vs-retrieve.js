const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSaveVsRetrieve() {
  const BACKEND_URL = 'http://localhost:4000';
  
  // Test data that should be saved
  const testData = {
    trainerId: 8,
    name: "Test Save vs Retrieve",
    description: "Testing the save vs retrieve issue",
    weeks: [
      {
        weekNumber: 1,
        name: "Week 1",
        days: [
          {
            dayNumber: 1,
            name: "Chest",
            exercises: [
              {
                exerciseId: 36, // Chest Press
                order: 1,
                sets: 3,
                reps: 10,
                duration: null,
                restTime: null,
                notes: "sets-reps"
              },
              {
                exerciseId: 35, // T-bar
                order: 2,
                sets: 3,
                reps: null,
                duration: 45,
                restTime: null,
                notes: "sets-time"
              }
            ]
          },
          {
            dayNumber: 2,
            name: "Back",
            exercises: [
              {
                exerciseId: 36, // Chest Press
                order: 1,
                sets: 4,
                reps: 12,
                duration: null,
                restTime: null,
                notes: "sets-reps"
              }
            ]
          }
        ]
      }
    ]
  };

  console.log('=== TESTING SAVE VS RETRIEVE ===');
  console.log('1. Data being sent to save:', JSON.stringify(testData, null, 2));

  try {
    // Step 1: Save the program
    console.log('\n2. Saving program...');
    const saveResponse = await fetch(`${BACKEND_URL}/api/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json();
      console.error('Failed to save program:', errorData);
      return;
    }

    const savedProgram = await saveResponse.json();
    console.log('✅ Program saved with ID:', savedProgram.id);

    // Step 2: Retrieve the program
    console.log('\n3. Retrieving program...');
    const retrieveResponse = await fetch(`${BACKEND_URL}/api/programs/${savedProgram.id}`);
    
    if (!retrieveResponse.ok) {
      const errorData = await retrieveResponse.json();
      console.error('Failed to retrieve program:', errorData);
      return;
    }

    const retrievedProgram = await retrieveResponse.json();
    console.log('✅ Program retrieved successfully');

    // Step 3: Compare saved vs retrieved
    console.log('\n4. COMPARING SAVED VS RETRIEVED:');
    
    console.log('\n--- SAVED DATA ---');
    testData.weeks.forEach((week, weekIndex) => {
      console.log(`Week ${weekIndex + 1}:`);
      week.days.forEach((day, dayIndex) => {
        console.log(`  Day ${dayIndex + 1} (${day.name}):`);
        day.exercises.forEach((exercise, exerciseIndex) => {
          console.log(`    Exercise ${exerciseIndex + 1}: ${exercise.exerciseId} - Sets: ${exercise.sets}, Reps: ${exercise.reps}, Duration: ${exercise.duration}, Notes: ${exercise.notes}`);
        });
      });
    });

    console.log('\n--- RETRIEVED DATA ---');
    retrievedProgram.weeks?.forEach((week, weekIndex) => {
      console.log(`Week ${weekIndex + 1}:`);
      week.days?.forEach((day, dayIndex) => {
        console.log(`  Day ${dayIndex + 1} (${day.name}):`);
        day.exercises?.forEach((exercise, exerciseIndex) => {
          console.log(`    Exercise ${exerciseIndex + 1}: ${exercise.exerciseId} - Sets: ${exercise.sets}, Reps: ${exercise.reps}, Duration: ${exercise.duration}, Notes: ${exercise.notes}`);
        });
      });
    });

    // Step 4: Check for discrepancies
    console.log('\n5. CHECKING FOR DISCREPANCIES:');
    let hasDiscrepancies = false;
    
    retrievedProgram.weeks?.forEach((week, weekIndex) => {
      week.days?.forEach((day, dayIndex) => {
        day.exercises?.forEach((exercise, exerciseIndex) => {
          const originalExercise = testData.weeks[weekIndex]?.days[dayIndex]?.exercises[exerciseIndex];
          if (originalExercise) {
            if (exercise.sets !== originalExercise.sets || 
                exercise.reps !== originalExercise.reps || 
                exercise.duration !== originalExercise.duration ||
                exercise.notes !== originalExercise.notes) {
              console.log(`❌ DISCREPANCY FOUND in Day ${day.name}, Exercise ${exerciseIndex + 1}:`);
              console.log(`   Original: Sets: ${originalExercise.sets}, Reps: ${originalExercise.reps}, Duration: ${originalExercise.duration}, Notes: ${originalExercise.notes}`);
              console.log(`   Retrieved: Sets: ${exercise.sets}, Reps: ${exercise.reps}, Duration: ${exercise.duration}, Notes: ${exercise.notes}`);
              hasDiscrepancies = true;
            } else {
              console.log(`✅ Day ${day.name}, Exercise ${exerciseIndex + 1}: Data matches`);
            }
          }
        });
      });
    });

    if (!hasDiscrepancies) {
      console.log('\n✅ NO DISCREPANCIES FOUND - Backend is working correctly');
    } else {
      console.log('\n❌ DISCREPANCIES FOUND - Backend has issues');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSaveVsRetrieve(); 