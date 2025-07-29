import { PrismaClient } from '@prisma/client'
import { Router, Request, Response } from 'express'

const prisma = new PrismaClient()
const router = Router()

// POST /api/subscriptions/:id/hold
router.post('/:id/hold', async (req: Request, res: Response) => {
  const subscriptionId = Number(req.params.id);
  if (isNaN(subscriptionId)) {
    return res.status(400).json({ error: 'Invalid subscription ID' });
  }

  const { holdDuration, holdDurationUnit, holdFromDate } = req.body;
  
  if (!holdDuration || !holdDurationUnit || !holdFromDate) {
    return res.status(400).json({ error: 'Missing hold duration, unit, or from date' });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Calculate new end date from the hold from date
    const holdFrom = new Date(holdFromDate);
    let newEndDate: Date;

    switch (holdDurationUnit) {
      case 'days':
        newEndDate = new Date(holdFrom.getTime() + (holdDuration * 24 * 60 * 60 * 1000));
        break;
      case 'weeks':
        newEndDate = new Date(holdFrom.getTime() + (holdDuration * 7 * 24 * 60 * 60 * 1000));
        break;
      case 'months':
        newEndDate = new Date(holdFrom.getTime() + (holdDuration * 30 * 24 * 60 * 60 * 1000));
        break;
      default:
        return res.status(400).json({ error: 'Invalid duration unit' });
    }

    // Update subscription with hold information
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        endDate: newEndDate,
        isOnHold: true,
        holdStartDate: holdFrom,
        holdEndDate: newEndDate,
        holdDuration: holdDuration,
        holdDurationUnit: holdDurationUnit,
      },
    });

    // Create hold history record
    await prisma.subscriptionHold.create({
      data: {
        subscriptionId: subscriptionId,
        holdStartDate: holdFrom,
        holdEndDate: newEndDate,
        holdDuration: holdDuration,
        holdDurationUnit: holdDurationUnit,
        reason: 'Subscription held by trainer',
      },
    });

    console.log('Subscription held successfully:', {
      subscriptionId,
      holdDuration,
      holdDurationUnit,
      newEndDate,
    });

    res.json({ 
      success: true, 
      subscription: updatedSubscription,
      message: 'Subscription held successfully' 
    });
  } catch (error) {
    console.error('Error holding subscription:', error);
    res.status(500).json({ error: 'Failed to hold subscription' });
  }
});

export default router; 