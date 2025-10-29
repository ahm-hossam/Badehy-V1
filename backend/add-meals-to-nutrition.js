const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMeals() {
  try {
    const program = await prisma.nutritionProgram.findFirst({
      where: { trainerId: 2, name: '4-Week Balanced Nutrition Plan' }
    });

    if (!program) {
      console.log('Program not found');
      return;
    }

    console.log('Adding meals to program:', program.id);

    await prisma.nutritionProgramMeal.createMany({
      data: [
        {
          nutritionProgramId: program.id,
          mealType: 'breakfast',
          name: 'Protein Oatmeal Bowl',
          description: 'Oatmeal with protein powder, berries, and nuts',
          calories: 450,
          protein: 30,
          carbs: 55,
          fats: 12
        },
        {
          nutritionProgramId: program.id,
          mealType: 'lunch',
          name: 'Grilled Chicken Salad',
          description: 'Mixed greens with grilled chicken, vegetables, and olive oil dressing',
          calories: 550,
          protein: 45,
          carbs: 35,
          fats: 22
        },
        {
          nutritionProgramId: program.id,
          mealType: 'dinner',
          name: 'Salmon with Quinoa',
          description: 'Baked salmon with quinoa and steamed broccoli',
          calories: 580,
          protein: 50,
          carbs: 45,
          fats: 20
        },
        {
          nutritionProgramId: program.id,
          mealType: 'snack',
          name: 'Greek Yogurt with Berries',
          description: 'Full-fat Greek yogurt topped with fresh berries',
          calories: 200,
          protein: 15,
          carbs: 20,
          fats: 8
        }
      ]
    });

    console.log('✅ Meals added successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMeals();

