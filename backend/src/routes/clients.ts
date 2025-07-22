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
  const { trainerId, search } = req.query;
  if (!trainerId) {
    return res.status(400).json({ error: 'Missing trainerId' });
  }
  try {
    const where: any = { trainerId: Number(trainerId) };
    if (search && typeof search === 'string' && search.trim() !== '') {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    const clients = await prisma.trainerClient.findMany({
      where,
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

// GET /api/clients/:id
router.get('/:id', async (req: Request, res: Response) => {
  const clientId = Number(req.params.id);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }
  try {
    const client = await prisma.trainerClient.findUnique({
      where: { id: clientId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          include: {
            package: true,
            installments: {
              include: {
                transactionImages: true,
              },
              orderBy: { paidDate: 'desc' },
            },
            subscriptionTransactionImages: true,
          },
        },
      },
    });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// PUT /api/clients/:id
router.put('/:id', async (req: Request, res: Response) => {
  const clientId = Number(req.params.id);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }
  const { client, subscription, installments, deleteInstallmentIds, deleteTransactionImageIds, deleteSubscriptionImageIds } = req.body;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update client details
      const updatedClient = await tx.trainerClient.update({
        where: { id: clientId },
        data: {
          fullName: client.fullName,
          phone: client.phone,
          email: client.email,
          gender: client.gender,
          age: client.age ? Number(client.age) : null,
          source: client.source,
          notes: client.notes,
        },
      });
      // 2. Update subscription (assume only one active subscription)
      let updatedSubscription = null;
      if (subscription && subscription.id) {
        updatedSubscription = await tx.subscription.update({
          where: { id: subscription.id },
          data: {
            packageId: Number(subscription.packageId),
            startDate: new Date(subscription.startDate),
            durationValue: Number(subscription.durationValue),
            durationUnit: subscription.durationUnit,
            endDate: new Date(subscription.endDate),
            paymentStatus: subscription.paymentStatus,
            paymentMethod: subscription.paymentMethod,
            priceBeforeDisc: subscription.priceBeforeDisc ? Number(subscription.priceBeforeDisc) : null,
            discountApplied: Boolean(subscription.discountApplied),
            discountType: subscription.discountType,
            discountValue: subscription.discountValue ? Number(subscription.discountValue) : null,
            priceAfterDisc: subscription.priceAfterDisc ? Number(subscription.priceAfterDisc) : null,
          },
        });
      }
      // 3. Delete removed installments
      if (Array.isArray(deleteInstallmentIds) && deleteInstallmentIds.length > 0) {
        for (const instId of deleteInstallmentIds) {
          // Delete transaction images for this installment
          await tx.transactionImage.deleteMany({ where: { installmentId: instId } });
          await tx.installment.delete({ where: { id: instId } });
        }
      }
      // 4. Upsert installments
      const updatedInstallments = [];
      if (Array.isArray(installments)) {
        for (const inst of installments) {
          if (inst.id) {
            // Update existing installment
            const updatedInst = await tx.installment.update({
              where: { id: inst.id },
              data: {
                paidDate: new Date(inst.paidDate),
                amount: Number(inst.amount),
                remaining: inst.remaining ? Number(inst.remaining) : 0,
                nextInstallment: inst.nextInstallment ? new Date(inst.nextInstallment) : null,
                status: inst.status ? String(inst.status) : 'paid',
              },
            });
            updatedInstallments.push(updatedInst);
          } else {
            // Create new installment
            const newInst = await tx.installment.create({
              data: {
                subscriptionId: subscription.id,
                paidDate: new Date(inst.paidDate),
                amount: Number(inst.amount),
                remaining: inst.remaining ? Number(inst.remaining) : 0,
                nextInstallment: inst.nextInstallment ? new Date(inst.nextInstallment) : null,
                status: inst.status ? String(inst.status) : 'paid',
              },
            });
            updatedInstallments.push(newInst);
          }
        }
      }
      // 5. Delete removed transaction images (installments)
      if (Array.isArray(deleteTransactionImageIds) && deleteTransactionImageIds.length > 0) {
        await tx.transactionImage.deleteMany({ where: { id: { in: deleteTransactionImageIds } } });
      }
      // 6. Delete removed subscription transaction images
      if (Array.isArray(deleteSubscriptionImageIds) && deleteSubscriptionImageIds.length > 0) {
        await tx.subscriptionTransactionImage.deleteMany({ where: { id: { in: deleteSubscriptionImageIds } } });
      }
      // Return updated client with relations
      const result = await tx.trainerClient.findUnique({
        where: { id: clientId },
        include: {
          subscriptions: {
            orderBy: { createdAt: 'desc' },
            include: {
              package: true,
              installments: {
                include: { transactionImages: true },
                orderBy: { paidDate: 'desc' },
              },
              subscriptionTransactionImages: true,
            },
          },
        },
      });
      return result;
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const clientId = Number(req.params.id);
  if (isNaN(clientId)) {
    return res.status(400).json({ error: 'Invalid client ID' });
  }
  try {
    // Check if client exists
    const client = await prisma.trainerClient.findUnique({ where: { id: clientId } });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    // Delete related data (subscriptions, installments, images)
    await prisma.$transaction(async (tx) => {
      // Find all subscriptions for this client
      const subscriptions = await tx.subscription.findMany({ where: { clientId } });
      for (const sub of subscriptions) {
        // Delete subscription transaction images
        await tx.subscriptionTransactionImage.deleteMany({ where: { subscriptionId: sub.id } });
        // Find all installments for this subscription
        const installments = await tx.installment.findMany({ where: { subscriptionId: sub.id } });
        for (const inst of installments) {
          // Delete transaction images for installment
          await tx.transactionImage.deleteMany({ where: { installmentId: inst.id } });
        }
        // Delete installments
        await tx.installment.deleteMany({ where: { subscriptionId: sub.id } });
      }
      // Delete subscriptions
      await tx.subscription.deleteMany({ where: { clientId } });
      // Finally, delete the client
      await tx.trainerClient.delete({ where: { id: clientId } });
    });
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// GET /api/profile/:id
router.get('/profile/:id', async (req: Request, res: Response) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  try {
    const user = await prisma.registered.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        countryCode: true,
        countryName: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router 