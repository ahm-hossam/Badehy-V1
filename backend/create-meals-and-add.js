const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMealsAndAdd() {
  try {
    const program = await prisma.nutritionProgram.findFirst({
      where: { trainerId: 2, name: '4-Week Balanced Nutrition Plan' }
    });

    if (!program) {
      console.log('Program not found');
      return;
    }

    console.log('Adding meals to program:', program.id);

    // Create meals first
    const meals = await Promise.all([
      prisma.meal.create({
        data: {
          trainerId: 2,
          name: 'Protein Oatmeal Bowl',
          description: 'Oatmeal with protein powder, berries, and nuts',
          totalCalories: 450,
          totalProtein: 30,
          totalCarbs: 55,
          totalFats: 12,
          category: 'breakfast'
        }
      }),
      prisma.meal.create({
        data: {
          trainerId: 2,
          name: 'Grilled Chicken Salad',
          description: 'Mixed greens with grilled chicken, vegetables, and olive oil dressing',
          totalCalories: 550,
          totalProtein: 45,
          totalCarbs: 35,
          totalFats: 22,
          category: 'lunch'
        }
      }),
      prisma.meal.create({
        data: {
          trainerId: 2,
          name: 'Salmon with Quinoa',
          description: 'Baked salmon with quinoa and steamed broccoli',
          totalCalories: 580,
          totalProtein: 50,
          totalCarbs: 45,
          totalFats: 20,
          category: 'dinner'
        }
      }),
      prisma.meal.create({
        data: {
          trainerId: 2,
          name: 'Greek Yogurt with Berries',
          description: 'Full-fat Greek yogurt topped with fresh berries',
          totalCalories: 200,
          totalProtein: 15,
          totalCarbs: 20,
          totalFats: 8,
          category: 'snack'
        }
      })
    ]);

    console.log('Created', meals.length, 'meals');

    // Now add them to the program
    await prisma.nutritionProgramMeal.createMany({
      data: meals.map((meal, index) => ({
        nutritionProgramId: program.id,
        mealId: meal.id,
        mealType: meal.category,
        order: index + 1
      }))
    });

    console.log('✅ Meals added to nutrition program successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMealsAndAdd();

