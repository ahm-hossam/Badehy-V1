// Test ingredient creation
const testIngredientCreation = async () => {
  try {
    const payload = {
      trainerId: 3,
      name: 'Test Ingredient from Frontend',
      category: 'Protein',
      description: 'Test description',
      unitType: 'grams',
      servingSize: '100',
      calories: '150',
      protein: '25',
      carbs: '5',
      fats: '3',
      fiber: 0,
      sugar: 0,
      sodium: 0,
      allergens: '[]',
      costPerUnit: null,
    };

    console.log('Testing ingredient creation with payload:', payload);

    const response = await fetch('http://localhost:4000/api/ingredients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('Success! Created ingredient:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

testIngredientCreation();
