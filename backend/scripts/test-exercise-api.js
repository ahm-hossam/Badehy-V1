const fetch = require('node-fetch');

async function testExerciseAPI() {
  try {
    console.log('Testing ExerciseDB API...');
    
    const response = await fetch('https://exercisedb.p.rapidapi.com/exercises', {
      headers: {
        'X-RapidAPI-Key': 'e69ab42f61msh78c5a9b9bdde74bp1963e0jsn053f27157860',
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const exercises = await response.json();
    
    console.log(`✅ Total exercises returned from ExerciseDB API: ${exercises.length}`);
    
    // Show some sample exercises
    console.log('\n📋 Sample exercises:');
    exercises.slice(0, 5).forEach((exercise, index) => {
      console.log(`${index + 1}. ${exercise.name} (${exercise.target})`);
    });
    
    // Show unique targets
    const targets = [...new Set(exercises.map(ex => ex.target))];
    console.log(`\n🎯 Unique target muscles: ${targets.length}`);
    
    // Show unique body parts
    const bodyParts = [...new Set(exercises.map(ex => ex.bodyPart))];
    console.log(`🏃‍♂️ Unique body parts: ${bodyParts.length}`);
    
    // Show unique equipment
    const equipment = [...new Set(exercises.map(ex => ex.equipment))];
    console.log(`🏋️‍♂️ Unique equipment types: ${equipment.length}`);
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testExerciseAPI(); 