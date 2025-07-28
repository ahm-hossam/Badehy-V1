import { PrismaClient } from '@prisma/client'
import { Router, Request, Response } from 'express'

const prisma = new PrismaClient()
const router = Router()

// POST /api/debug-client
router.post('/', async (req: Request, res: Response) => {
  try {
    const { trainerId, client, subscription, installments } = req.body;

    console.log('🔍 Debug: Starting client creation...');
    console.log('🔍 Debug: trainerId:', trainerId);
    console.log('🔍 Debug: client:', client);
    console.log('🔍 Debug: subscription:', subscription);

    if (!trainerId || !client || !subscription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Test 1: Check if trainer exists
    console.log('🔍 Debug: Testing trainer existence...');
    const trainer = await prisma.registered.findUnique({
      where: { id: parseInt(trainerId) }
    });
    console.log('🔍 Debug: Trainer found:', trainer);

    if (!trainer) {
      return res.status(400).json({ error: 'Trainer not found' });
    }

    // Test 2: Check if package exists
    console.log('🔍 Debug: Testing package existence...');
    const package_ = await prisma.package.findUnique({
      where: { id: parseInt(subscription.packageId) }
    });
    console.log('🔍 Debug: Package found:', package_);

    if (!package_) {
      return res.status(400).json({ error: 'Package not found' });
    }

    // Test 3: Try to create client
    console.log('🔍 Debug: Creating client...');
    const createdClient = await prisma.trainerClient.create({
      data: {
        trainerId: parseInt(trainerId),
        fullName: client.fullName,
        phone: client.phone,
        email: client.email || null,
        gender: client.gender || null,
        age: client.age ? parseInt(client.age) : null,
        source: client.source || null,
        notes: client.notes || null,
      },
    });
    console.log('🔍 Debug: Client created:', createdClient);

    // Test 4: Try to create subscription
    console.log('🔍 Debug: Creating subscription...');
    const createdSubscription = await prisma.subscription.create({
      data: {
        client: { connect: { id: createdClient.id } },
        package: { connect: { id: parseInt(subscription.packageId) } },
        startDate: new Date(subscription.startDate),
        endDate: new Date(subscription.endDate),
        durationValue: parseInt(subscription.durationValue),
        durationUnit: subscription.durationUnit,
        paymentStatus: subscription.paymentStatus,
        paymentMethod: subscription.paymentMethod || null,
        priceBeforeDisc: parseFloat(subscription.priceBeforeDisc),
        discountApplied: subscription.discountApplied || false,
        priceAfterDisc: parseFloat(subscription.priceAfterDisc),
      },
    });
    console.log('🔍 Debug: Subscription created:', createdSubscription);

    // Test 5: Try to create installments
    console.log('🔍 Debug: Creating installments...');
    const createdInstallments = [];
    if (installments && Array.isArray(installments)) {
      for (const inst of installments) {
        if (!inst.paidDate || !inst.amount) {
          console.log('🔍 Debug: Skipping installment due to missing fields:', inst);
          continue;
        }
        
        const createdInstallment = await prisma.installment.create({
          data: {
            subscriptionId: createdSubscription.id,
            paidDate: new Date(inst.paidDate),
            amount: parseFloat(inst.amount),
            remaining: parseFloat(inst.remaining),
            nextInstallment: inst.nextInstallment ? new Date(inst.nextInstallment) : null,
            status: 'paid',
          },
        });
        createdInstallments.push(createdInstallment);
        console.log('🔍 Debug: Installment created:', createdInstallment);
      }
    }

    console.log('🔍 Debug: All operations successful!');

    res.json({
      success: true,
      message: 'Debug test successful',
      result: {
        client: createdClient,
        subscription: createdSubscription,
        installments: createdInstallments,
      }
    });
  } catch (error) {
    console.error('❌ Debug: Error occurred:', error);
    res.status(500).json({ 
      error: 'Debug test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
})

export default router 