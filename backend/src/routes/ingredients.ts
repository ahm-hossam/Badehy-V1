import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all ingredients for a trainer
router.get('/', async (req, res) => {
  try {
    const trainerId = parseInt(req.query.trainerId as string);
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const { category, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      trainerId,
      isActive: true,
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.ingredient.count({ where }),
    ]);

    res.json({
      ingredients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    res.status(500).json({ error: 'Failed to fetch ingredients' });
  }
});

// Get ingredient by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ingredient = await prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }

    res.json(ingredient);
  } catch (error) {
    console.error('Error fetching ingredient:', error);
    res.status(500).json({ error: 'Failed to fetch ingredient' });
  }
});

// Create new ingredient
router.post('/', async (req, res) => {
  try {
    const {
      trainerId,
      name,
      category,
      description,
      calories,
      protein,
      carbs,
      fats,
      fiber,
      sugar,
      sodium,
      unitType,
      servingSize,
      costPerUnit,
      allergens,
      imageUrl,
    } = req.body;

    if (!trainerId || !name || !category) {
      return res.status(400).json({ error: 'Trainer ID, name, and category are required' });
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        trainerId,
        name,
        category,
        description,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        fiber: parseFloat(fiber) || 0,
        sugar: parseFloat(sugar) || 0,
        sodium: parseFloat(sodium) || 0,
        unitType: unitType || 'grams',
        servingSize: parseFloat(servingSize) || 100,
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
        allergens: allergens ? JSON.stringify(allergens) : '[]',
        imageUrl,
      },
    });

    res.json(ingredient);
  } catch (error) {
    console.error('Error creating ingredient:', error);
    res.status(500).json({ error: 'Failed to create ingredient' });
  }
});

// Update ingredient
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      category,
      description,
      calories,
      protein,
      carbs,
      fats,
      fiber,
      sugar,
      sodium,
      unitType,
      servingSize,
      costPerUnit,
      allergens,
      imageUrl,
      isActive,
    } = req.body;

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        name,
        category,
        description,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        fiber: parseFloat(fiber) || 0,
        sugar: parseFloat(sugar) || 0,
        sodium: parseFloat(sodium) || 0,
        unitType: unitType || 'grams',
        servingSize: parseFloat(servingSize) || 100,
        costPerUnit: costPerUnit ? parseFloat(costPerUnit) : null,
        allergens: allergens ? JSON.stringify(allergens) : '[]',
        imageUrl,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    res.json(ingredient);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    res.status(500).json({ error: 'Failed to update ingredient' });
  }
});

// Delete ingredient (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Ingredient deleted successfully' });
  } catch (error) {
    console.error('Error deleting ingredient:', error);
    res.status(500).json({ error: 'Failed to delete ingredient' });
  }
});

// Get ingredient categories
router.get('/categories/list', async (req, res) => {
  try {
    const trainerId = parseInt(req.query.trainerId as string);
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const categories = await prisma.ingredient.findMany({
      where: { trainerId, isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

export default router;
