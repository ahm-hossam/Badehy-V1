const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testProgramCreation() {
  const BACKEND_URL = 'http://localhost:4000';
  
  // Simulate the exact data structure that should be sent from frontend
  const testProgramData = {
    trainerId: 8,
    name: "Test Program - Day 2 Issue",
    description: "Testing day 2 data issue",
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
              }
            ]
          },
          {
            dayNumber: 2,
            name: "Back",
            exercises: [
              {
                exerciseId: 35, // T-bar
                order: 1,
                sets: null,
                reps: null,
                duration: 45, // This should be saved
                restTime: null,
                notes: "time-only"
              }
            ]
          }
        ]
      }
    ]
  };

  console.log('Testing program creation with data:', JSON.stringify(testProgramData, null, 2));

  try {
    // Create the program
    console.log('\n1. Creating program...');
    const createResponse = await fetch(`${BACKEND_URL}/api/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProgramData)
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      console.error('Failed to create program:', errorData);
      return;
    }

    const createdProgram = await createResponse.json();
    console.log('✅ Program created successfully with ID:', createdProgram.id);

    // Fetch the created program
    console.log('\n2. Fetching created program...');
    const fetchResponse = await fetch(`${BACKEND_URL}/api/programs/${createdProgram.id}`);
    
    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json();
      console.error('Failed to fetch program:', errorData);
      return;
    }

    const fetchedProgram = await fetchResponse.json();
    console.log('✅ Program fetched successfully');
    
    // Analyze the data
    console.log('\n3. Analyzing program data...');
    console.log('Program ID:', fetchedProgram.id);
    console.log('Program Name:', fetchedProgram.name);
    console.log('Weeks Count:', fetchedProgram.weeks?.length || 0);
    
    fetchedProgram.weeks?.forEach((week, weekIndex) => {
      console.log(`\nWeek ${weekIndex + 1} (${week.name}):`);
      console.log('  Week ID:', week.id);
      console.log('  Days Count:', week.days?.length || 0);
      
      week.days?.forEach((day, dayIndex) => {
        console.log(`\n  Day ${dayIndex + 1} (${day.name}):`);
        console.log('    Day ID:', day.id);
        console.log('    Exercises Count:', day.exercises?.length || 0);
        
        day.exercises?.forEach((exercise, exerciseIndex) => {
          console.log(`\n    Exercise ${exerciseIndex + 1} (${exercise.exercise?.name}):`);
          console.log('      Exercise ID:', exercise.id);
          console.log('      Exercise Reference ID:', exercise.exerciseId);
          console.log('      Sets:', exercise.sets);
          console.log('      Reps:', exercise.reps);
          console.log('      Duration:', exercise.duration);
          console.log('      Notes:', exercise.notes);
        });
      });
    });

    // Check for the specific issue
    console.log('\n4. Checking for Day 2 (Back) data...');
    const backDay = fetchedProgram.weeks?.[0]?.days?.find(d => d.name === 'Back');
    if (backDay) {
      console.log('✅ Back day found with ID:', backDay.id);
      console.log('Back day exercises:', backDay.exercises?.length || 0);
      
      backDay.exercises?.forEach((exercise, index) => {
        console.log(`\n  Back Exercise ${index + 1} (${exercise.exercise?.name}):`);
        console.log('    Sets:', exercise.sets);
        console.log('    Reps:', exercise.reps);
        console.log('    Duration:', exercise.duration);
        console.log('    Notes:', exercise.notes);
      });
    } else {
      console.log('❌ Back day not found!');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testProgramCreation(); 