const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    console.log('Testing API endpoint...');
    
    const response = await fetch('http://localhost:4000/api/programs/12');
    const data = await response.json();
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:', JSON.stringify(data, null, 2));
    
    if (data.weeks && data.weeks.length > 0) {
      console.log('\nWeeks found:', data.weeks.length);
      data.weeks.forEach((week, index) => {
        console.log(`Week ${index + 1}:`, {
          id: week.id,
          weekNumber: week.weekNumber,
          name: week.name,
          daysCount: week.days?.length || 0
        });
        
        if (week.days && week.days.length > 0) {
          week.days.forEach((day, dayIndex) => {
            console.log(`  Day ${dayIndex + 1}:`, {
              id: day.id,
              dayNumber: day.dayNumber,
              name: day.name,
              exercisesCount: day.exercises?.length || 0
            });
            
            if (day.exercises && day.exercises.length > 0) {
              day.exercises.forEach((exercise, exerciseIndex) => {
                console.log(`    Exercise ${exerciseIndex + 1}:`, {
                  id: exercise.id,
                  exerciseId: exercise.exerciseId,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  duration: exercise.duration,
                  notes: exercise.notes,
                  exerciseName: exercise.exercise?.name
                });
              });
            }
          });
        }
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI(); 