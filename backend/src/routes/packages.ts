import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/packages - Get all packages for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId } = req.query;
    
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const packages = await prisma.package.findMany({
      where: {
        trainerId: Number(trainerId),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// POST /api/packages - Create a new package
router.post('/', async (req, res) => {
  try {
    const {
      trainerId,
      name,
      durationValue,
      durationUnit,
      priceBeforeDisc,
      discountApplied,
      discountType,
      discountValue,
      priceAfterDisc,
    } = req.body;

    if (!trainerId || !name || !durationValue || !durationUnit || !priceBeforeDisc) {
      return res.status(400).json({ error: 'Trainer ID, name, duration, and price are required' });
    }

    const package_ = await prisma.package.create({
      data: {
        trainerId: Number(trainerId),
        name,
        durationValue: Number(durationValue),
        durationUnit,
        priceBeforeDisc: Number(priceBeforeDisc),
        discountApplied: discountApplied || false,
        discountType: discountType || null,
        discountValue: discountValue ? Number(discountValue) : null,
        priceAfterDisc: priceAfterDisc ? Number(priceAfterDisc) : null,
      },
    });

    res.status(201).json(package_);
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
});

// PUT /api/packages/:id - Update a package
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      durationValue,
      durationUnit,
      priceBeforeDisc,
      discountApplied,
      discountType,
      discountValue,
      priceAfterDisc,
    } = req.body;

    const package_ = await prisma.package.update({
      where: { id: Number(id) },
      data: {
        name,
        durationValue: Number(durationValue),
        durationUnit,
        priceBeforeDisc: Number(priceBeforeDisc),
        discountApplied: discountApplied || false,
        discountType: discountType || null,
        discountValue: discountValue ? Number(discountValue) : null,
        priceAfterDisc: priceAfterDisc ? Number(priceAfterDisc) : null,
      },
    });

    res.json(package_);
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
});

// DELETE /api/packages/:id - Delete a package
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if package has any subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { packageId: Number(id) },
    });

    if (subscriptions.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete package. It is being used by active subscriptions. Please delete or update the subscriptions first.' 
      });
    }

    await prisma.package.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
});

export default router; 