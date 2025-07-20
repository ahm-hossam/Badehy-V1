import { PrismaClient } from '@prisma/client'
import { Router, Request, Response } from 'express'

const prisma = new PrismaClient()
const router = Router()

// POST /api/clients
router.post('/', async (req: Request, res: Response) => {
  /*
    Minimal, bug-free client creation:
    - Creates a TrainerClient
    - Creates a Subscription for that client
    - Optionally creates Installments for the subscription
    - All fields are explicitly mapped and validated
    - Only uses fields that exist in the current Prisma schema
  */
  try {
    const { trainerId, client, subscription, installments } = req.body;
    // Basic validation
    if (!trainerId || !client || !subscription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const parsedTrainerId = Number(trainerId);
    if (isNaN(parsedTrainerId)) {
      return res.status(400).json({ error: 'Invalid trainerId' });
    }
    // Transaction: create client, subscription, and installments
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create TrainerClient
      const createdClient = await tx.trainerClient.create({
        data: {
          trainerId: parsedTrainerId,
          fullName: String(client.fullName),
          phone: String(client.phone),
          email: client.email ? String(client.email) : '',
          gender: client.gender ? String(client.gender) : null,
          age: client.age ? Number(client.age) : null,
          source: client.source ? String(client.source) : null,
          notes: client.notes ? String(client.notes) : null,
        },
      });
      // 2. Create Subscription (must have packageId)
      const packageId = subscription.packageId ? Number(subscription.packageId) : null;
      if (!packageId) {
        throw new Error('Missing or invalid packageId for subscription');
      }
      const createdSubscription = await tx.subscription.create({
        data: {
          clientId: createdClient.id,
          packageId: packageId,
          startDate: new Date(subscription.startDate),
          durationValue: Number(subscription.durationValue),
          durationUnit: String(subscription.durationUnit),
          endDate: new Date(subscription.endDate),
          paymentStatus: String(subscription.paymentStatus),
          paymentMethod: subscription.paymentMethod ? String(subscription.paymentMethod) : null,
          priceBeforeDisc: subscription.priceBeforeDisc ? Number(subscription.priceBeforeDisc) : null,
          discountApplied: Boolean(subscription.discountApplied),
          discountType: subscription.discountType ? String(subscription.discountType) : null,
          discountValue: subscription.discountValue ? Number(subscription.discountValue) : null,
          priceAfterDisc: subscription.priceAfterDisc ? Number(subscription.priceAfterDisc) : null,
        },
      });
      // 3. Optionally create Installments
      const createdInstallments = [];
      if (installments && Array.isArray(installments)) {
        for (const inst of installments) {
          if (!inst.paidDate || !inst.amount) continue;
          const createdInstallment = await tx.installment.create({
            data: {
              subscriptionId: createdSubscription.id,
              paidDate: new Date(inst.paidDate),
              amount: Number(inst.amount),
              remaining: inst.remaining ? Number(inst.remaining) : 0,
              nextInstallment: inst.nextInstallment ? new Date(inst.nextInstallment) : null,
              status: inst.status ? String(inst.status) : 'paid',
            },
          });
          createdInstallments.push(createdInstallment);
        }
      }
      return {
        client: createdClient,
        subscription: createdSubscription,
        installments: createdInstallments,
      };
    });
    res.status(201).json(result);
  } catch (error) {
    // Robust error logging
    if (error instanceof Error) {
      console.error('Error creating client:', error.message);
      if ('code' in error) {
        console.error('Prisma error code:', (error as any).code);
        console.error('Prisma error meta:', (error as any).meta);
      }
    } else {
      console.error('Unknown error:', error);
    }
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : error });
  }
});

// GET /api/clients?trainerId=1
router.get('/', async (req: Request, res: Response) => {
  const { trainerId } = req.query;
  if (!trainerId) {
    return res.status(400).json({ error: 'Missing trainerId' });
  }
  try {
    const clients = await prisma.trainerClient.findMany({
      where: { trainerId: Number(trainerId) },
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // latest subscription only
          include: {
            installments: {
              include: {
                transactionImages: {
                  select: {
                    id: true,
                    filename: true,
                    originalName: true,
                    mimeType: true,
                    size: true,
                    uploadedAt: true
                  },
                  orderBy: { uploadedAt: 'desc' }
                }
              },
              orderBy: { paidDate: 'desc' }
            }
          }
        },
      },
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router 