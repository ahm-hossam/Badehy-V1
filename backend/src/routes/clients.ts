import { PrismaClient } from '@prisma/client'
import { Router, Request, Response } from 'express'

const prisma = new PrismaClient()
const router = Router()

// POST /api/clients
router.post('/', async (req: Request, res: Response) => {
  try {
    // TODO: Extract trainerId from auth/session (for now, expect in body for testing)
    const { trainerId, client, subscription, installments } = req.body
    if (!trainerId || !client || !subscription) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // TODO: Add full validation for all fields

    const result = await prisma.$transaction(async (tx) => {
      // Create client
      const createdClient = await tx.trainerClient.create({
        data: {
          trainerId,
          fullName: client.fullName,
          phone: client.phone,
          email: client.email,
          gender: client.gender,
          age: client.age ? parseInt(client.age) : null,
          source: client.source,
          notes: client.notes,
        },
      })

      // Create or connect package
      let packageId = subscription.packageId
      if (!packageId && subscription.packageName) {
        // Find or create package for this trainer
        const pkg = await tx.package.upsert({
          where: {
            trainerId_name: {
              trainerId,
              name: subscription.packageName,
            },
          },
          update: {},
          create: {
            trainerId,
            name: subscription.packageName,
          },
        })
        packageId = pkg.id
      }

      // Create subscription
      const createdSubscription = await tx.subscription.create({
        data: {
          clientId: createdClient.id,
          packageId,
          startDate: new Date(subscription.startDate),
          durationValue: parseInt(subscription.durationValue),
          durationUnit: subscription.durationUnit,
          endDate: new Date(subscription.endDate),
          paymentStatus: subscription.paymentStatus,
          paymentMethod: subscription.paymentMethod,
          priceBeforeDisc: subscription.priceBeforeDisc ? parseFloat(subscription.priceBeforeDisc) : null,
          discountApplied: subscription.discountApplied,
          discountType: subscription.discountType,
          discountValue: subscription.discountValue ? parseFloat(subscription.discountValue) : null,
          priceAfterDisc: subscription.priceAfterDisc ? parseFloat(subscription.priceAfterDisc) : null,
        },
      })

      // Create installments if provided
      const createdInstallments = [];
      if (installments && Array.isArray(installments)) {
        for (const inst of installments) {
          // Skip installment if required fields are missing
          if (!inst.paidDate || !inst.amount) {
            continue;
          }
          
          const createdInstallment = await tx.installment.create({
            data: {
              subscriptionId: createdSubscription.id,
              paidDate: new Date(inst.paidDate),
              amount: parseFloat(inst.amount),
              remaining: parseFloat(inst.remaining),
              nextInstallment: inst.nextInstallment ? new Date(inst.nextInstallment) : null,
              status: 'paid', // Default status
            },
          });
          createdInstallments.push(createdInstallment);
        }
      }

      return { 
        client: createdClient, 
        subscription: createdSubscription,
        installments: createdInstallments
      }
    })

    res.status(201).json(result)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

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