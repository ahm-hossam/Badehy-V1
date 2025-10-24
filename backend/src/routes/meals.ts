import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all meals for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId, search, category, page = '1', limit = '50' } = req.query;
    
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {
      trainerId: parseInt(trainerId as string),
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const [meals, total] = await Promise.all([
      prisma.meal.findMany({
        where,
        include: {
          mealIngredients: {
            include: {
              ingredient: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.meal.count({ where }),
    ]);

    res.json({
      meals,
      total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// Get single meal by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const meal = await prisma.meal.findFirst({
      where: {
        id: parseInt(id),
        trainerId: parseInt(trainerId as string),
      },
      include: {
        mealIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json(meal);
  } catch (error) {
    console.error('Error fetching meal:', error);
    res.status(500).json({ error: 'Failed to fetch meal' });
  }
});

// Create new meal
router.post('/', async (req, res) => {
  try {
    const {
      trainerId,
      name,
      description,
      category,
      instructions,
      imageUrl,
      ingredients, // Array of { ingredientId, quantity, unit, notes }
    } = req.body;

    if (!trainerId || !name || !category) {
      return res.status(400).json({ error: 'Trainer ID, name, and category are required' });
    }

    // Calculate nutritional values
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;

    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: parseInt(ing.ingredientId) },
        });

        if (ingredient) {
          // Convert quantity to grams for calculation
          let quantityInGrams = ing.quantity;
          if (ing.unit !== 'grams') {
            // Simple conversion - in real app, you'd have a proper unit conversion system
            quantityInGrams = ing.quantity * 100; // Assume 1 cup = 100g for simplicity
          }

          const multiplier = quantityInGrams / 100; // Per 100g calculation

          // Use cooking state to determine which values to use
          const calories = ingredient.cookingState === 'before_cook' 
            ? ingredient.caloriesBefore 
            : ingredient.caloriesAfter;
          const protein = ingredient.cookingState === 'before_cook' 
            ? ingredient.proteinBefore 
            : ingredient.proteinAfter;
          const carbs = ingredient.cookingState === 'before_cook' 
            ? ingredient.carbsBefore 
            : ingredient.carbsAfter;
          const fats = ingredient.cookingState === 'before_cook' 
            ? ingredient.fatsBefore 
            : ingredient.fatsAfter;

          totalCalories += calories * multiplier;
          totalProtein += protein * multiplier;
          totalCarbs += carbs * multiplier;
          totalFats += fats * multiplier;
          totalFiber += ingredient.fiber * multiplier;
          totalSugar += ingredient.sugar * multiplier;
          totalSodium += ingredient.sodium * multiplier;
        }
      }
    }

    // Create meal
    const meal = await prisma.meal.create({
      data: {
        trainerId: parseInt(trainerId),
        name,
        description,
        category,
        prepTime: null,
        cookTime: null,
        servings: 1,
        difficulty: null,
        instructions,
        imageUrl,
        totalCalories: Math.round(totalCalories * 100) / 100,
        totalProtein: Math.round(totalProtein * 100) / 100,
        totalCarbs: Math.round(totalCarbs * 100) / 100,
        totalFats: Math.round(totalFats * 100) / 100,
        totalFiber: Math.round(totalFiber * 100) / 100,
        totalSugar: Math.round(totalSugar * 100) / 100,
        totalSodium: Math.round(totalSodium * 100) / 100,
      },
    });

    // Create meal ingredients
    if (ingredients && ingredients.length > 0) {
      await prisma.mealIngredient.createMany({
        data: ingredients.map((ing: any) => ({
          mealId: meal.id,
          ingredientId: parseInt(ing.ingredientId),
          quantity: parseFloat(ing.quantity),
          unit: ing.unit,
          notes: ing.notes,
        })),
      });
    }

    // Fetch the complete meal with ingredients
    const completeMeal = await prisma.meal.findUnique({
      where: { id: meal.id },
      include: {
        mealIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.json(completeMeal);
  } catch (error) {
    console.error('Error creating meal:', error);
    res.status(500).json({ error: 'Failed to create meal' });
  }
});

// Update meal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      instructions,
      imageUrl,
      ingredients,
    } = req.body;

    // Calculate nutritional values
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let totalFiber = 0;
    let totalSugar = 0;
    let totalSodium = 0;

    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: parseInt(ing.ingredientId) },
        });

        if (ingredient) {
          let quantityInGrams = ing.quantity;
          if (ing.unit !== 'grams') {
            quantityInGrams = ing.quantity * 100;
          }

          const multiplier = quantityInGrams / 100;

          const calories = ingredient.cookingState === 'before_cook' 
            ? ingredient.caloriesBefore 
            : ingredient.caloriesAfter;
          const protein = ingredient.cookingState === 'before_cook' 
            ? ingredient.proteinBefore 
            : ingredient.proteinAfter;
          const carbs = ingredient.cookingState === 'before_cook' 
            ? ingredient.carbsBefore 
            : ingredient.carbsAfter;
          const fats = ingredient.cookingState === 'before_cook' 
            ? ingredient.fatsBefore 
            : ingredient.fatsAfter;

          totalCalories += calories * multiplier;
          totalProtein += protein * multiplier;
          totalCarbs += carbs * multiplier;
          totalFats += fats * multiplier;
          totalFiber += ingredient.fiber * multiplier;
          totalSugar += ingredient.sugar * multiplier;
          totalSodium += ingredient.sodium * multiplier;
        }
      }
    }

    // Update meal
    const meal = await prisma.meal.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        category,
        prepTime: null,
        cookTime: null,
        servings: 1,
        difficulty: null,
        instructions,
        imageUrl,
        totalCalories: Math.round(totalCalories * 100) / 100,
        totalProtein: Math.round(totalProtein * 100) / 100,
        totalCarbs: Math.round(totalCarbs * 100) / 100,
        totalFats: Math.round(totalFats * 100) / 100,
        totalFiber: Math.round(totalFiber * 100) / 100,
        totalSugar: Math.round(totalSugar * 100) / 100,
        totalSodium: Math.round(totalSodium * 100) / 100,
      },
    });

    // Update meal ingredients
    if (ingredients) {
      // Delete existing ingredients
      await prisma.mealIngredient.deleteMany({
        where: { mealId: parseInt(id) },
      });

      // Create new ingredients
      if (ingredients.length > 0) {
        await prisma.mealIngredient.createMany({
          data: ingredients.map((ing: any) => ({
            mealId: parseInt(id),
            ingredientId: parseInt(ing.ingredientId),
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
            notes: ing.notes,
          })),
        });
      }
    }

    // Fetch the complete meal with ingredients
    const completeMeal = await prisma.meal.findUnique({
      where: { id: parseInt(id) },
      include: {
        mealIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.json(completeMeal);
  } catch (error) {
    console.error('Error updating meal:', error);
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

// Delete meal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Check if meal belongs to trainer
    const meal = await prisma.meal.findFirst({
      where: {
        id: parseInt(id),
        trainerId: parseInt(trainerId as string),
      },
    });

    if (!meal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Delete meal (cascade will delete meal ingredients)
    await prisma.meal.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

// Duplicate meal
router.post('/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Get the original meal with ingredients
    const originalMeal = await prisma.meal.findFirst({
      where: {
        id: parseInt(id),
        trainerId: parseInt(trainerId as string),
      },
      include: {
        mealIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!originalMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Create duplicated meal with "Copy of" prefix
    const duplicatedMeal = await prisma.meal.create({
      data: {
        name: `Copy of ${originalMeal.name}`,
        description: originalMeal.description,
        category: originalMeal.category,
        instructions: originalMeal.instructions,
        imageUrl: originalMeal.imageUrl,
        trainerId: originalMeal.trainerId,
        isActive: true,
        mealIngredients: {
          create: originalMeal.mealIngredients.map(ingredient => ({
            ingredientId: ingredient.ingredientId,
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            notes: ingredient.notes,
          })),
        },
      },
      include: {
        mealIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    // Calculate nutritional totals for the duplicated meal
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    for (const ing of duplicatedMeal.mealIngredients) {
      const ingredient = ing.ingredient;
      const multiplier = ing.quantity / ingredient.servingSize;
      
      // Use cooking state to determine which nutritional values to use
      const calories = ingredient.cookingState === 'after_cook' ? ingredient.caloriesAfter : ingredient.caloriesBefore;
      const protein = ingredient.cookingState === 'after_cook' ? ingredient.proteinAfter : ingredient.proteinBefore;
      const carbs = ingredient.cookingState === 'after_cook' ? ingredient.carbsAfter : ingredient.carbsBefore;
      const fats = ingredient.cookingState === 'after_cook' ? ingredient.fatsAfter : ingredient.fatsBefore;
      
      totalCalories += calories * multiplier;
      totalProtein += protein * multiplier;
      totalCarbs += carbs * multiplier;
      totalFats += fats * multiplier;
    }

    // Add calculated totals to the response
    const response = {
      ...duplicatedMeal,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
    };

    res.json(response);
  } catch (error) {
    console.error('Error duplicating meal:', error);
    res.status(500).json({ error: 'Failed to duplicate meal' });
  }
});

// Get meal categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      'Breakfast',
      'Lunch',
      'Dinner',
      'Snack',
      'Dessert',
      'Beverage',
      'Appetizer',
      'Side Dish',
      'Main Course',
      'Other'
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Upload meal image
router.post('/upload', async (req, res) => {
  try {
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/meals');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const storage = multer.diskStorage({
      destination: (req: any, file: any, cb: any) => {
        cb(null, uploadDir);
      },
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'meal-' + uniqueSuffix + path.extname(file.originalname));
      }
    });

    const upload = multer({ 
      storage: storage,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      },
      fileFilter: (req: any, file: any, cb: any) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      }
    });

    upload.single('image')(req, res, (err: any) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const imageUrl = `/uploads/meals/${req.file.filename}`;
      res.json({ imageUrl });
    });
  } catch (error) {
    console.error('Error uploading meal image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
