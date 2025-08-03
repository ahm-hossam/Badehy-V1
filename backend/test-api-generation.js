const fetch = require('node-fetch');

async function testAPIGeneration() {
  try {
    console.log('Testing API task generation...');
    
    const response = await fetch('http://localhost:4000/api/tasks/generate-automated', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainerId: 1
      }),
    });

    const result = await response.json();
    console.log('API Response:', result);

    // Check program tasks
    const tasksResponse = await fetch('http://localhost:4000/api/tasks?trainerId=1&category=Program');
    const tasks = await tasksResponse.json();
    
    console.log('\nProgram tasks found:', tasks.length);
    for (const task of tasks) {
      console.log('Task:', {
        id: task.id,
        title: task.title,
        category: task.category,
        dueDate: task.dueDate,
        status: task.status
      });
    }

  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPIGeneration(); 