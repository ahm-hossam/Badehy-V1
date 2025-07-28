const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCreateProgram() {
  try {
    console.log('Testing program creation with actual data...');
    
    const programData = {
      trainerId: 8,
      name: "Test Program with Data",
      description: "Testing with actual exercise data",
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
    
    const response = await fetch('http://localhost:4000/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(programData),
    });
    
    const data = await response.json();
    
    console.log('Create Program Response Status:', response.status);
    console.log('Created Program Data:', JSON.stringify(data, null, 2));
    
    if (data.id) {
      console.log('\nNow testing GET for the created program...');
      const getResponse = await fetch(`http://localhost:4000/api/programs/${data.id}`);
      const getData = await getResponse.json();
      
      console.log('GET Program Response Status:', getResponse.status);
      console.log('Retrieved Program Data:', JSON.stringify(getData, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing program creation:', error);
  }
}

testCreateProgram(); 