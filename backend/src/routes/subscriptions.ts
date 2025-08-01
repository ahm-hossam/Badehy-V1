import { PrismaClient } from '@prisma/client'
import { Router, Request, Response } from 'express'

const prisma = new PrismaClient()
const router = Router()

// POST /api/subscriptions - Create new subscription or renew existing
router.post('/', async (req: Request, res: Response) => {
  const { 
    clientId, 
    packageId, 
    startDate, 
    endDate, 
    durationValue, 
    durationUnit, 
    paymentStatus, 
    paymentMethod, 
    priceBeforeDisc, 
    discountApplied, 
    discountType, 
    discountValue, 
    priceAfterDisc,
    isRenewal = false,
    originalSubscriptionId = null
  } = req.body;

  if (!clientId || !packageId || !startDate || !endDate || !durationValue || !durationUnit || !paymentStatus) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Validate client exists
    const client = await prisma.trainerClient.findUnique({
      where: { id: Number(clientId) },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Validate package exists
    const package_ = await prisma.package.findUnique({
      where: { id: Number(packageId) },
    });

    if (!package_) {
      return res.status(404).json({ error: 'Package not found' });
    }

    if (isRenewal && originalSubscriptionId) {
      // Handle renewal - create a NEW subscription instead of extending the existing one
      const originalSubscription = await prisma.subscription.findUnique({
        where: { id: Number(originalSubscriptionId) },
      });

      if (!originalSubscription) {
        return res.status(404).json({ error: 'Original subscription not found' });
      }

      // Create a NEW subscription for the renewal
      const newSubscription = await prisma.subscription.create({
        data: {
          clientId: Number(clientId),
          packageId: Number(packageId),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          durationValue: Number(durationValue),
          durationUnit,
          paymentStatus,
          paymentMethod: paymentMethod || null,
          priceBeforeDisc: priceBeforeDisc ? Number(priceBeforeDisc) : null,
          discountApplied: discountApplied || false,
          discountType: discountType || null,
          discountValue: discountValue ? Number(discountValue) : null,
          priceAfterDisc: priceAfterDisc ? Number(priceAfterDisc) : null,
          isOnHold: false,
          holdStartDate: null,
          holdEndDate: null,
          holdDuration: null,
          holdDurationUnit: null,
        },
        include: {
          client: true,
          package: true,
        },
      });

      console.log('New subscription created for renewal:', {
        subscriptionId: newSubscription.id,
        clientId: newSubscription.clientId,
        paymentStatus: newSubscription.paymentStatus,
        startDate: newSubscription.startDate,
        endDate: newSubscription.endDate,
      });

      res.status(200).json({ 
        success: true, 
        subscription: newSubscription,
        message: 'Subscription renewed successfully',
        isRenewal: true
      });
    } else {
      // Create new subscription
      const newSubscription = await prisma.subscription.create({
        data: {
          clientId: Number(clientId),
          packageId: Number(packageId),
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          durationValue: Number(durationValue),
          durationUnit,
          paymentStatus,
          paymentMethod: paymentMethod || null,
          priceBeforeDisc: priceBeforeDisc ? Number(priceBeforeDisc) : null,
          discountApplied: discountApplied || false,
          discountType: discountType || null,
          discountValue: discountValue ? Number(discountValue) : null,
          priceAfterDisc: priceAfterDisc ? Number(priceAfterDisc) : null,
          renewalHistory: [],
        },
        include: {
          client: true,
          package: true,
        },
      });

      console.log('Subscription created successfully:', {
        subscriptionId: newSubscription.id,
        clientId: newSubscription.clientId,
        packageId: newSubscription.packageId,
        paymentStatus: newSubscription.paymentStatus,
      });

      res.status(201).json({ 
        success: true, 
        subscription: newSubscription,
        message: 'Subscription created successfully' 
      });
    }
  } catch (error) {
    console.error('Error creating/renewing subscription:', error);
    res.status(500).json({ error: 'Failed to create/renew subscription' });
  }
});

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