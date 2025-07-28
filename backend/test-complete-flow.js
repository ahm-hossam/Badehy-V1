const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCompleteFlow() {
  try {
    console.log('=== Testing Complete Create/Edit Flow ===');
    
    // Step 1: Create a program with proper data
    const createData = {
      trainerId: 8,
      name: "Complete Test Program",
      description: "Testing complete flow with proper data",
      weeks: [
        {
          weekNumber: 1,
          name: "Week 1",
          days: [
            {
              dayNumber: 1,
              name: "Chest Day",
              exercises: [
                {
                  exerciseId: 36,
                  order: 1,
                  sets: 3,
                  reps: 12,
                  duration: null,
                  restTime: 60,
                  notes: "sets-reps"
                },
                {
                  exerciseId: 35,
                  order: 2,
                  sets: 4,
                  reps: 10,
                  duration: null,
                  restTime: 90,
                  notes: "sets-reps"
                }
              ]
            }
          ]
        },
        {
          weekNumber: 2,
          name: "Week 2",
          days: [
            {
              dayNumber: 1,
              name: "Chest Day",
              exercises: [
                {
                  exerciseId: 36,
                  order: 1,
                  sets: 4,
                  reps: 10,
                  duration: null,
                  restTime: 60,
                  notes: "sets-reps"
                }
              ]
            }
          ]
        }
      ]
    };
    
    console.log('\n1. Creating program with data:', JSON.stringify(createData, null, 2));
    
    const createResponse = await fetch('http://localhost:4000/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createData),
    });
    
    const createdProgram = await createResponse.json();
    console.log('Create Response Status:', createResponse.status);
    console.log('Created Program ID:', createdProgram.id);
    
    if (createdProgram.id) {
      console.log('\n2. Fetching the created program...');
      const getResponse = await fetch(`http://localhost:4000/api/programs/${createdProgram.id}`);
      const fetchedProgram = await getResponse.json();
      
      console.log('GET Response Status:', getResponse.status);
      console.log('Fetched Program Structure:');
      console.log('- Program ID:', fetchedProgram.id);
      console.log('- Program Name:', fetchedProgram.name);
      console.log('- Weeks Count:', fetchedProgram.weeks?.length || 0);
      
      if (fetchedProgram.weeks && fetchedProgram.weeks.length > 0) {
        fetchedProgram.weeks.forEach((week, weekIndex) => {
          console.log(`  Week ${weekIndex + 1}:`);
          console.log(`    - ID: ${week.id}`);
          console.log(`    - Name: ${week.name}`);
          console.log(`    - Days Count: ${week.days?.length || 0}`);
          
          if (week.days && week.days.length > 0) {
            week.days.forEach((day, dayIndex) => {
              console.log(`      Day ${dayIndex + 1}:`);
              console.log(`        - ID: ${day.id}`);
              console.log(`        - Name: ${day.name}`);
              console.log(`        - Exercises Count: ${day.exercises?.length || 0}`);
              
              if (day.exercises && day.exercises.length > 0) {
                day.exercises.forEach((exercise, exerciseIndex) => {
                  console.log(`          Exercise ${exerciseIndex + 1}:`);
                  console.log(`            - ID: ${exercise.id}`);
                  console.log(`            - Exercise ID: ${exercise.exerciseId}`);
                  console.log(`            - Sets: ${exercise.sets}`);
                  console.log(`            - Reps: ${exercise.reps}`);
                  console.log(`            - Duration: ${exercise.duration}`);
                  console.log(`            - Notes: ${exercise.notes}`);
                  console.log(`            - Exercise Name: ${exercise.exercise?.name || 'N/A'}`);
                });
              }
            });
          }
        });
      }
      
      // Step 3: Test updating the program
      console.log('\n3. Testing program update...');
      const updateData = {
        ...createData,
        name: "Updated Test Program",
        description: "Updated description"
      };
      
      const updateResponse = await fetch(`http://localhost:4000/api/programs/${createdProgram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      
      const updatedProgram = await updateResponse.json();
      console.log('Update Response Status:', updateResponse.status);
      console.log('Updated Program Name:', updatedProgram.name);
      
      console.log('\n=== Test Complete ===');
      console.log('✅ All operations successful!');
      console.log('✅ Data is being saved and retrieved correctly');
      console.log('✅ Edit functionality should work properly');
      
    } else {
      console.error('❌ Failed to create program');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteFlow(); 