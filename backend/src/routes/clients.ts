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
    const { trainerId, client, subscription, installments, notes } = req.body;
    // Basic validation
    if (!trainerId || !client || !subscription) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const parsedTrainerId = Number(trainerId);
    if (isNaN(parsedTrainerId)) {
      return res.status(400).json({ error: 'Invalid trainerId' });
    }
    console.log('Received client:', client);
    
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
          level: client.level ? String(client.level) : null,
          registrationDate: client.registrationDate ? new Date(client.registrationDate) : null,
          selectedFormId: client.selectedFormId ? Number(client.selectedFormId) : null,
          injuriesHealthNotes: Array.isArray(client.injuriesHealthNotes)
            ? client.injuriesHealthNotes
            : typeof client.injuriesHealthNotes === 'string'
              ? client.injuriesHealthNotes.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [],
          goals: Array.isArray(client.goals) ? client.goals : [],
          // --- Added fields for full profile support ---
          goal: Array.isArray(client.goal) ? client.goal.join(',') : client.goal,
          workoutPlace: Array.isArray(client.workoutPlace) ? client.workoutPlace.join(',') : client.workoutPlace,
          height: client.height ? Number(client.height) : null,
          weight: client.weight ? Number(client.weight) : null,
          preferredTrainingDays: Array.isArray(client.preferredTrainingDays) ? client.preferredTrainingDays.join(',') : client.preferredTrainingDays,
          preferredTrainingTime: Array.isArray(client.preferredTrainingTime) ? client.preferredTrainingTime.join(',') : client.preferredTrainingTime,
          equipmentAvailability: Array.isArray(client.equipmentAvailability) ? client.equipmentAvailability.join(',') : client.equipmentAvailability,
          favoriteTrainingStyle: Array.isArray(client.favoriteTrainingStyle) ? client.favoriteTrainingStyle.join(',') : client.favoriteTrainingStyle,
          weakAreas: Array.isArray(client.weakAreas) ? client.weakAreas.join(',') : client.weakAreas,
          nutritionGoal: Array.isArray(client.nutritionGoal) ? client.nutritionGoal.join(',') : client.nutritionGoal,
          dietPreference: Array.isArray(client.dietPreference) ? client.dietPreference.join(',') : client.dietPreference,
          mealCount: client.mealCount === '' || client.mealCount === undefined
            ? null
            : Number(client.mealCount),
          foodAllergies: Array.isArray(client.foodAllergies) ? client.foodAllergies.join(',') : client.foodAllergies,
          dislikedIngredients: Array.isArray(client.dislikedIngredients) ? client.dislikedIngredients.join(',') : client.dislikedIngredients,
          currentNutritionPlan: Array.isArray(client.currentNutritionPlan) ? client.currentNutritionPlan.join(',') : client.currentNutritionPlan,
          // --- End added fields ---
          labels: client.labels && Array.isArray(client.labels) ? { connect: client.labels.map((id: number) => ({ id })) } : undefined,
        },
      });
      // 1b. Create notes if provided
      if (Array.isArray(notes) && notes.length > 0) {
        for (const note of notes) {
          await tx.note.create({
            data: {
              clientId: createdClient.id,
              content: String(note.content),
            },
          });
        }
      }
      // After creating the client (in POST)
      const answers = req.body.answers;
      if (answers && client.selectedFormId) {
        await tx.checkInSubmission.create({
          data: {
            clientId: createdClient.id,
            formId: Number(client.selectedFormId),
            answers: { ...answers, filledByTrainer: true }, // Mark as filled by trainer
            submittedAt: new Date(),
          },
        });
      }
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
          
          // Validate dates before creating
          const paidDate = inst.paidDate && inst.paidDate.trim() !== '' ? new Date(inst.paidDate) : null;
          let nextInstallment = inst.nextInstallment && inst.nextInstallment.trim() !== '' ? new Date(inst.nextInstallment) : null;
          
          // Check if dates are valid
          if (paidDate && isNaN(paidDate.getTime())) {
            console.error('Invalid paidDate for creation:', inst.paidDate);
            continue; // Skip this installment
          }
          if (nextInstallment && isNaN(nextInstallment.getTime())) {
            console.error('Invalid nextInstallment for creation:', inst.nextInstallment);
            // Set to null if invalid
            nextInstallment = null;
          }
          
          const createdInstallment = await tx.installment.create({
            data: {
              subscriptionId: createdSubscription.id,
              paidDate: paidDate || new Date(), // Use current date as fallback
              amount: Number(inst.amount),
              remaining: inst.remaining ? Number(inst.remaining) : 0,
              nextInstallment: nextInstallment,
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
        labels: true, // Include labels
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          include: {
            form: { select: { id: true, name: true, questions: true } },
          },
        },
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
    // Add profileCompletion field using both client fields and latest check-in answers
    const requiredFields = [
      // Basic Data
      'fullName', 'phone', 'email', 'gender', 'age', 'source', 'level',
      // Client Profile & Preferences
      'goal', 'injuries', 'workoutPlace', 'height', 'weight',
      // Workout Preferences
      'preferredTrainingDays', 'preferredTrainingTime', 'equipmentAvailability', 'favoriteTrainingStyle', 'weakAreas',
      // Nutrition Preferences
      'nutritionGoal', 'dietPreference', 'mealCount', 'foodAllergies', 'dislikedIngredients', 'currentNutritionPlanFollowed'
    ];
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    const clientsWithCompletion = clients.map((client: any) => {
      // Get latest submission answers (if any)
      const latestSubmission = client.submissions && client.submissions[0];
      const answers = latestSubmission?.answers && typeof latestSubmission.answers === 'object' ? latestSubmission.answers : {};
      // Map form questions by normalized label
      const formQuestions = latestSubmission?.form?.questions || [];
      const answerByLabel: Record<string, any> = {};
      for (const q of formQuestions) {
        if (answers && typeof answers === 'object' && answers.hasOwnProperty(String(q.id))) {
          answerByLabel[normalize(q.label)] = answers[String(q.id)];
        }
      }
      // Check all required fields in both client fields and answers
      const isComplete = requiredFields.every(field => {
        // Try client field first
        let value = (client as any)[field];
        if (value === undefined) {
          // Try to find in answers by label
          value = answerByLabel[normalize(field)];
        }
        if (field === 'age') return value !== null && value !== undefined && value !== '';
        return value !== null && value !== undefined && String(value).trim() !== '';
      });
      return { ...client, profileCompletion: isComplete ? 'Completed' : 'Not Completed', latestSubmission };
    });
    res.json(clientsWithCompletion);
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
        labels: true, // Include labels
        notes: {
          orderBy: { createdAt: 'desc' }
        }, // Include notes
        submissions: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          include: {
            form: { select: { id: true, name: true, questions: true } },
          },
        },
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
    console.log('Fetched client:', client);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    // Compute profileCompletion for this client
    const requiredFields = [
      'fullName', 'phone', 'email', 'gender', 'age', 'source', 'level',
      'goal', 'injuries', 'workoutPlace', 'height', 'weight',
      'preferredTrainingDays', 'preferredTrainingTime', 'equipmentAvailability', 'favoriteTrainingStyle', 'weakAreas',
      'nutritionGoal', 'dietPreference', 'mealCount', 'foodAllergies', 'dislikedIngredients', 'currentNutritionPlanFollowed'
    ];
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    const latestSubmission = client.submissions && client.submissions[0];
    const answers = latestSubmission?.answers && typeof latestSubmission.answers === 'object' ? latestSubmission.answers : {};
    const answersObj = answers as Record<string, any>;
    const formQuestions = latestSubmission?.form?.questions || [];
    const answerByLabel: Record<string, any> = {};
    for (const q of formQuestions) {
      if (answersObj && typeof answersObj === 'object' && answersObj.hasOwnProperty(String(q.id))) {
        answerByLabel[normalize(q.label)] = answersObj[String(q.id)];
      }
    }
    const isComplete = requiredFields.every(field => {
      let value = (client as any)[field];
      if (value === undefined) {
        value = answerByLabel[normalize(field)];
      }
      if (field === 'age') return value !== null && value !== undefined && value !== '';
      return value !== null && value !== undefined && String(value).trim() !== '';
    });
    res.json({ ...client, profileCompletion: isComplete ? 'Completed' : 'Not Completed', latestSubmission });
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
  // Log the received payload
  console.log('Received payload:', req.body);
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
          level: client.level,
          registrationDate: client.registrationDate ? new Date(client.registrationDate) : null,
          selectedFormId: client.selectedFormId ? Number(client.selectedFormId) : null,
          injuriesHealthNotes: Array.isArray(client.injuriesHealthNotes) ? client.injuriesHealthNotes : [],
          goals: Array.isArray(client.goals) ? client.goals : [],
          // --- Added fields for full profile support ---
          goal: client.goal,
          workoutPlace: client.workoutPlace,
          height: client.height ? Number(client.height) : null,
          weight: client.weight ? Number(client.weight) : null,
          preferredTrainingDays: client.preferredTrainingDays,
          preferredTrainingTime: client.preferredTrainingTime,
          equipmentAvailability: client.equipmentAvailability,
          favoriteTrainingStyle: client.favoriteTrainingStyle,
          weakAreas: client.weakAreas,
          nutritionGoal: client.nutritionGoal,
          dietPreference: client.dietPreference,
          mealCount: client.mealCount ? Number(client.mealCount) : null,
          foodAllergies: client.foodAllergies,
          dislikedIngredients: client.dislikedIngredients,
          currentNutritionPlan: client.currentNutritionPlan,
          // --- End added fields ---
          labels: client.labels && Array.isArray(client.labels) ? { set: client.labels.map((id: number) => ({ id })) } : undefined,
        },
      });
      // In PUT (edit), after updating client details
      const answers = req.body.answers;
      if (answers && client.selectedFormId) {
        const latestSubmission = await tx.checkInSubmission.findFirst({
          where: { clientId, formId: Number(client.selectedFormId) },
          orderBy: { submittedAt: 'desc' },
        });
        if (latestSubmission) {
          await tx.checkInSubmission.update({
            where: { id: latestSubmission.id },
            data: { answers: { ...answers, filledByTrainer: true }, submittedAt: new Date() }, // Mark as filled by trainer
          });
        } else {
          await tx.checkInSubmission.create({
            data: {
              clientId,
              formId: Number(client.selectedFormId),
              answers: { ...answers, filledByTrainer: true }, // Mark as filled by trainer
              submittedAt: new Date(),
            },
          });
        }
      }
      // 2. Update or create subscription (assume only one active subscription)
      let updatedSubscription = null;
      if (subscription) {
        if (subscription.id) {
          console.log('Updating subscription:', subscription);
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
          console.log('Updated subscription:', updatedSubscription);
        } else {
          // Create new subscription for this client
          console.log('Creating new subscription:', subscription);
          updatedSubscription = await tx.subscription.create({
            data: {
              clientId,
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
          console.log('Created subscription:', updatedSubscription);
        }
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
            // Validate dates before updating
            const paidDate = inst.paidDate && inst.paidDate.trim() !== '' ? new Date(inst.paidDate) : null;
            let nextInstallment = inst.nextInstallment && inst.nextInstallment.trim() !== '' ? new Date(inst.nextInstallment) : null;
            
            // Check if dates are valid
            if (paidDate && isNaN(paidDate.getTime())) {
              console.error('Invalid paidDate for update:', inst.paidDate);
              continue; // Skip this installment
            }
            if (nextInstallment && isNaN(nextInstallment.getTime())) {
              console.error('Invalid nextInstallment for update:', inst.nextInstallment);
              // Set to null if invalid
              nextInstallment = null;
            }
            
            const updatedInst = await tx.installment.update({
              where: { id: inst.id },
              data: {
                paidDate: paidDate || new Date(), // Use current date as fallback
                amount: Number(inst.amount),
                remaining: inst.remaining ? Number(inst.remaining) : 0,
                nextInstallment: nextInstallment,
                status: inst.status ? String(inst.status) : 'paid',
              },
            });
            updatedInstallments.push(updatedInst);
          } else {
            // Create new installment
            // Validate dates before creating
            const paidDate = inst.paidDate && inst.paidDate.trim() !== '' ? new Date(inst.paidDate) : null;
            let nextInstallment = inst.nextInstallment && inst.nextInstallment.trim() !== '' ? new Date(inst.nextInstallment) : null;
            
            // Check if dates are valid
            if (paidDate && isNaN(paidDate.getTime())) {
              console.error('Invalid paidDate:', inst.paidDate);
              continue; // Skip this installment
            }
            if (nextInstallment && isNaN(nextInstallment.getTime())) {
              console.error('Invalid nextInstallment:', inst.nextInstallment);
              // Set to null if invalid
              nextInstallment = null;
            }
            
            const newInst = await tx.installment.create({
              data: {
                subscriptionId: updatedSubscription?.id || subscription.id, // Use the newly created subscription ID
                paidDate: paidDate || new Date(), // Use current date as fallback
                amount: Number(inst.amount),
                remaining: inst.remaining ? Number(inst.remaining) : 0,
                nextInstallment: nextInstallment,
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
    // Log the saved client object
    console.log('Saved client:', updated);
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
    // Delete related data (subscriptions, installments, images, notes, labels)
    await prisma.$transaction(async (tx) => {
      // Delete notes for this client
      await tx.note.deleteMany({ where: { clientId } });
      
      // Disconnect labels from this client (many-to-many relationship)
      await tx.trainerClient.update({
        where: { id: clientId },
        data: { labels: { set: [] } }
      });
      
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