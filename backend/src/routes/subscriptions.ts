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

  const { holdDuration, holdDurationUnit } = req.body;
  
  if (!holdDuration || !holdDurationUnit) {
    return res.status(400).json({ error: 'Missing hold duration or unit' });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Calculate new end date by adding hold duration to current end date
    const currentEndDate = new Date(subscription.endDate);
    let newEndDate: Date;

    switch (holdDurationUnit) {
      case 'days':
        newEndDate = new Date(currentEndDate.getTime() + (holdDuration * 24 * 60 * 60 * 1000));
        break;
      case 'weeks':
        newEndDate = new Date(currentEndDate.getTime() + (holdDuration * 7 * 24 * 60 * 60 * 1000));
        break;
      case 'months':
        newEndDate = new Date(currentEndDate.getTime() + (holdDuration * 30 * 24 * 60 * 60 * 1000));
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
        holdStartDate: currentEndDate,
        holdEndDate: newEndDate,
        holdDuration: holdDuration,
        holdDurationUnit: holdDurationUnit,
      },
    });

    // Create hold history record
    await prisma.subscriptionHold.create({
      data: {
        subscriptionId: subscriptionId,
        holdStartDate: currentEndDate,
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

// POST /api/subscriptions/:id/cancel
router.post('/:id/cancel', async (req: Request, res: Response) => {
  const subscriptionId = Number(req.params.id);
  if (isNaN(subscriptionId)) {
    return res.status(400).json({ error: 'Invalid subscription ID' });
  }

  const { cancelDate, cancelReason, refundType, refundAmount } = req.body;
  
  if (!cancelDate || !cancelReason) {
    return res.status(400).json({ error: 'Missing cancel date or reason' });
  }

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        client: true,
      },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Validate cancel date
    const cancelDateTime = new Date(cancelDate);
    if (isNaN(cancelDateTime.getTime())) {
      return res.status(400).json({ error: 'Invalid cancel date' });
    }

    // Update subscription with cancellation information
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        isCanceled: true,
        canceledAt: cancelDateTime,
        cancelReason: cancelReason,
        refundType: refundType || 'none',
        refundAmount: refundAmount ? parseFloat(refundAmount) : null,
      },
    });

    console.log('Subscription canceled successfully:', {
      subscriptionId,
      cancelDate,
      cancelReason,
      refundType,
      refundAmount,
    });

    res.json({ 
      success: true, 
      subscription: updatedSubscription,
      message: 'Subscription canceled successfully' 
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router; 