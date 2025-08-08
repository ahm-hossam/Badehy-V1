import { PrismaClient } from '@prisma/client'
import { Router, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const router = Router()

// File to track manually deleted tasks
const DELETED_TASKS_FILE = path.join(__dirname, '../data/manually-deleted-tasks.json');

// Ensure the data directory exists
const dataDir = path.dirname(DELETED_TASKS_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Load manually deleted tasks
function loadManuallyDeletedTasks(): any[] {
  try {
    if (fs.existsSync(DELETED_TASKS_FILE)) {
      const data = fs.readFileSync(DELETED_TASKS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading manually deleted tasks:', error);
  }
  return [];
}

// Check if a task was manually deleted
async function checkIfTaskManuallyDeleted(trainerId: number, clientId: number, category: string, taskType: string): Promise<boolean> {
  const deletedTasks = loadManuallyDeletedTasks();
  return deletedTasks.some((task: any) => 
    task.trainerId === trainerId && 
    task.clientId === clientId && 
    task.category === category && 
    task.taskType === taskType
  );
}

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
    const { trainerId, client, subscription, installments, notes, answers } = req.body;
    
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
      // Get name and phone from form answers if not provided in client object
      const answers = req.body.answers;
      
             // Extract ALL form data from answers
       let clientName = client.fullName;
       let clientPhone = client.phone;
       let clientEmail = client.email;
       let clientGender = client.gender;
       let clientAge = client.age;
       let clientSource = client.source;
       
       if (answers) {
         console.log('Form answers for client creation:', answers);
         
         // Get form questions to map answers correctly
         const formQuestions = await tx.checkInForm.findUnique({
           where: { id: Number(client.selectedFormId) },
           select: { questions: true }
         });
         
         if (formQuestions && formQuestions.questions) {
           for (const question of formQuestions.questions) {
             const answer = answers[String(question.id)];
             if (!answer) continue;
             
             const questionLabel = question.label.toLowerCase();
             
             // Map form fields to client fields
             if (questionLabel.includes('name') || questionLabel.includes('full')) {
               clientName = answer;
             } else if (questionLabel.includes('email')) {
               clientEmail = answer;
             } else if (questionLabel.includes('phone') || questionLabel.includes('mobile')) {
               clientPhone = answer;
             } else if (questionLabel.includes('gender')) {
               clientGender = answer;
             } else if (questionLabel.includes('age')) {
               clientAge = answer;
             } else if (questionLabel.includes('source')) {
               clientSource = answer;
             }
           }
         }
       }
       
       clientName = clientName || 'Unknown Client';
       clientPhone = clientPhone || '';
       clientEmail = clientEmail || '';
       clientGender = clientGender || null;
       clientAge = clientAge ? Number(clientAge) : null;
       clientSource = clientSource || null;
      
             // 1. Create TrainerClient
       const createdClient = await tx.trainerClient.create({
         data: {
           trainerId: parsedTrainerId,
           fullName: String(clientName),
           phone: clientPhone,
           email: clientEmail,
           gender: clientGender,
           age: clientAge,
           source: clientSource,
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

      // Set discount applied flag and type based on whether discount values are provided
      let discountApplied = Boolean(subscription.discountApplied);
      let discountType = subscription.discountType ? String(subscription.discountType) : null;
      
      // If discount values are provided, mark as applied and set type
      if (subscription.discountValue) {
        discountApplied = true;
        // If no discount type is provided but there's a discount value, assume percentage
        if (!discountType) {
          discountType = 'percentage';
        }
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
          discountApplied: discountApplied,
          discountType: discountType,
          discountValue: subscription.discountValue ? Number(subscription.discountValue) : null,
          priceAfterDisc: discountApplied && subscription.priceBeforeDisc && subscription.discountValue 
            ? (subscription.discountType === 'percentage' 
                ? subscription.priceBeforeDisc * (1 - subscription.discountValue / 100)
                : subscription.priceBeforeDisc - subscription.discountValue)
            : null,
          // Initialize hold fields
          isOnHold: false,
          holdStartDate: null,
          holdEndDate: null,
          holdDuration: null,
          holdDurationUnit: null,
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
          
          // Generate automatic task for installment if nextInstallment is set
          if (nextInstallment) {
            const today = new Date();
            const installmentDate = new Date(nextInstallment);
            
            // Only create task if next installment date is today or in the future
            if (installmentDate >= today) {
              // Check if this task was manually deleted
              const manuallyDeleted = await checkIfTaskManuallyDeleted(createdClient.trainerId, createdClient.id, 'Installment', 'automatic');
              
              if (!manuallyDeleted) {
                // Check if a task already exists for this installment
                const existingTask = await tx.task.findFirst({
                  where: {
                    trainerId: createdClient.trainerId,
                    clientId: createdClient.id,
                    category: 'Installment',
                    taskType: 'automatic',
                    status: 'open',
                  },
                });

                if (!existingTask) {
                  await tx.task.create({
                    data: {
                      trainerId: createdClient.trainerId,
                      title: `Installment due for ${createdClient.fullName}`,
                      description: `Installment of ${inst.amount} is due on ${installmentDate.toLocaleDateString()} for ${createdClient.fullName}. Please follow up for payment.`,
                      taskType: 'automatic',
                      category: 'Installment',
                      status: 'open',
                      clientId: createdClient.id,
                      dueDate: installmentDate,
                    },
                  });
                  console.log('Created installment task for client:', createdClient.fullName);
                }
              }
            }
          }
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
        teamAssignments: {
          include: {
            teamMember: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
        programAssignments: {
          include: {
            program: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        nutritionAssignments: {
          include: {
            nutritionProgram: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    // Enhanced profile completion logic for clients list
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    const clientsWithCompletion = await Promise.all(clients.map(async (client: any) => {
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

      // Helper function to get value from client or answers
      const getValue = (field: string) => {
        let value = (client as any)[field];
        
        // Special handling for fullName field - if it's gender, try to find actual name
        if (field === 'fullName' && (value === 'Male' || value === 'Female' || value === 'Other')) {
          console.log('Client fullName is gender, looking for actual name in form answers');
          // Look for name-related fields in form answers
          const nameFields = ['fullName', 'name', 'firstName', 'first_name', 'full_name'];
          for (const q of formQuestions) {
            const questionLabel = q.label.toLowerCase();
            if (nameFields.some(nameField => questionLabel.includes(nameField.toLowerCase()))) {
              const answerValue = answers[String(q.id)];
              if (answerValue && answerValue !== 'undefined' && answerValue !== '') {
                console.log('Found actual name in form:', q.label, '=', answerValue);
                value = answerValue;
                break;
              }
            }
          }
          
          // If still no name found, look for any value that looks like a name
          if (value === 'Male' || value === 'Female' || value === 'Other') {
            for (const q of formQuestions) {
              const answerValue = answers[String(q.id)];
              if (answerValue && answerValue !== 'undefined' && answerValue !== '') {
                // Check if this looks like a name (not gender, not email, not phone, etc.)
                if (
                  typeof answerValue === 'string' && 
                  answerValue.length > 2 && 
                  !answerValue.includes('@') && 
                  !answerValue.includes('+') &&
                  !answerValue.match(/^\d+$/) &&
                  !['male', 'female', 'other'].includes(answerValue.toLowerCase()) &&
                  !['facebook ads', 'instagram', 'google', 'referral', 'other'].includes(answerValue.toLowerCase())
                ) {
                  console.log('Found potential name value:', q.label, '=', answerValue);
                  value = answerValue;
                  break;
                }
              }
            }
          }
        } else if (value === undefined || value === null || value === '') {
          // Try to find the answer by matching field name to question label
          for (const q of formQuestions) {
            const normalizedLabel = normalize(q.label);
            const normalizedField = normalize(field);
            if (normalizedLabel === normalizedField) {
              value = answers[String(q.id)];
              break;
            }
          }
        }
        return value;
      };

          // Check core questions (required)
    const coreQuestions = ['fullName', 'phone', 'email', 'gender', 'age', 'source'];
    const coreComplete = coreQuestions.every(field => {
      const value = getValue(field);
      if (field === 'age') return value !== null && value !== undefined && value !== '';
      return value !== null && value !== undefined && String(value).trim() !== '';
    });

    // Check team assignment (required)
    const teamAssignmentComplete = client.teamAssignments && client.teamAssignments.length > 0;

    // Check subscription details (required)
    let subscriptionComplete = false;
    if (client.subscriptions && client.subscriptions.length > 0) {
      const subscription = client.subscriptions[0]; // Latest subscription
      
      // Required subscription fields
      const requiredSubscriptionFields = [
        'startDate', 'durationValue', 'durationUnit', 'paymentStatus', 'packageId'
      ];
      
      const subscriptionFieldsComplete = requiredSubscriptionFields.every(field => {
        const value = (subscription as any)[field];
        return value !== null && value !== undefined && value !== '';
      });

      // Check registration date (client registration date)
      const registrationComplete = client.registrationDate !== null;

      // Check payment method (conditional based on payment status)
      let paymentMethodComplete = true;
      if (subscription.paymentStatus?.toLowerCase() !== 'free' && subscription.paymentStatus?.toLowerCase() !== 'free trial') {
        paymentMethodComplete = subscription.paymentMethod !== null && subscription.paymentMethod !== '';
      } else {
        // For free subscriptions, payment method is not required
        paymentMethodComplete = true;
      }

      // Check price fields (conditional based on payment status)
      let priceComplete = true;
      if (subscription.paymentStatus?.toLowerCase() !== 'free' && subscription.paymentStatus?.toLowerCase() !== 'free trial') {
        priceComplete = subscription.priceBeforeDisc !== null && subscription.priceBeforeDisc !== undefined;
        if (subscription.discountApplied) {
          priceComplete = priceComplete && subscription.priceAfterDisc !== null && subscription.priceAfterDisc !== undefined;
        }
      } else {
        // For free subscriptions, price fields are not required
        priceComplete = true;
      }

      // Check installment fields (conditional based on payment status)
      let installmentComplete = true;
      if (subscription.paymentStatus?.toLowerCase() === 'installments') {
        installmentComplete = subscription.installments && subscription.installments.length > 0;
        if (installmentComplete) {
          // Check if installments have required fields
          installmentComplete = subscription.installments.every((installment: any) => 
            installment.amount !== null && installment.amount !== undefined
          );
        }
      }

      subscriptionComplete = subscriptionFieldsComplete && registrationComplete && paymentMethodComplete && priceComplete && installmentComplete;

      // Debug logging
      console.log('=== Profile Completion Debug ===');
      console.log('Core Complete:', coreComplete);
      console.log('Team Assignment Complete:', teamAssignmentComplete);
      console.log('Subscription Fields Complete:', subscriptionFieldsComplete);
      console.log('Registration Complete:', registrationComplete);
      console.log('Payment Method Complete:', paymentMethodComplete, 'Value:', subscription.paymentMethod);
      console.log('Price Complete:', priceComplete);
      console.log('Installment Complete:', installmentComplete);
      console.log('Subscription Complete:', subscriptionComplete);
      console.log('Final Complete:', coreComplete && teamAssignmentComplete && subscriptionComplete);
      console.log('Payment Status:', subscription.paymentStatus);
      console.log('Package ID:', subscription.packageId);
    }

    const isComplete = coreComplete && teamAssignmentComplete && subscriptionComplete;
      return { ...client, profileCompletion: isComplete ? 'Completed' : 'Not Completed', latestSubmission };
    }));
    // Prevent any intermediary caches from storing stale list
    res.setHeader('Cache-Control', 'no-store');
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
        teamAssignments: {
          include: {
            teamMember: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
      },
    });
         console.log('Backend GET - Fetched client:', client);
     console.log('Backend GET - fullName from database:', client?.fullName);
     console.log('Backend GET - Form submissions:', client?.submissions);
     if (client?.submissions && client.submissions.length > 0) {
       console.log('Backend GET - First submission answers:', client.submissions[0].answers);
       console.log('Backend GET - First submission form questions:', client.submissions[0].form.questions);
     }
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    // Enhanced profile completion logic - process ALL submissions to find best data
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
    
        // Helper function to get value from client or answers from ALL submissions
    const getValue = (field: string) => {
      let value = (client as any)[field];
      
      // If client field is empty, try to find it in any submission
      if (value === undefined || value === null || value === '') {
        // Process all submissions to find the best data for this field
        for (const submission of client.submissions || []) {
          const answers = submission.answers && typeof submission.answers === 'object' ? submission.answers : {};
          const formQuestions = submission.form?.questions || [];
          
          // Create a mapping of common field names to possible question labels
          const fieldMappings: Record<string, string[]> = {
            'fullName': ['Full Name', 'Name', 'Client Name', 'Fullname'],
            'email': ['Email', 'Email Address', 'E-mail'],
            'phone': ['Phone', 'Phone Number', 'Mobile', 'Mobile Number', 'Telephone'],
            'gender': ['Gender', 'Sex'],
            'age': ['Age', 'Years Old'],
            'source': ['Source', 'How did you hear about us', 'Referral Source']
          };
          
                     // Try to find the answer by matching field name to question label
           for (const q of formQuestions) {
             const answer = (answers as any)[String(q.id)];
             
             // Skip if no answer
             if (!answer || answer === '') continue;
             
             // Direct field mapping based on question label
             const questionLabel = q.label.toLowerCase();
             
             // More robust field mapping
             if (field === 'email' && (questionLabel.includes('email') || questionLabel.includes('e-mail'))) {
               value = answer;
               break;
             }
             
             if (field === 'gender' && (questionLabel.includes('gender') || questionLabel.includes('sex'))) {
               value = answer;
               break;
             }
             
             if (field === 'age' && (questionLabel.includes('age') || questionLabel.includes('years'))) {
               value = answer;
               break;
             }
             
             if (field === 'source' && (questionLabel.includes('source') || questionLabel.includes('hear') || questionLabel.includes('referral') || questionLabel === 'source')) {
               value = answer;
               break;
             }
             
             if (field === 'phone' && (questionLabel.includes('phone') || questionLabel.includes('mobile') || questionLabel.includes('telephone'))) {
               value = answer;
               break;
             }
             
             if (field === 'fullName' && (questionLabel.includes('name') || questionLabel.includes('full'))) {
               value = answer;
               break;
             }
           }
           
           // If we still don't have a value, try fallback logic for specific fields
           if (!value && field === 'fullName') {
             // Look for any answer that looks like a name
             for (const q of formQuestions) {
               const answer = (answers as any)[String(q.id)];
               if (answer && typeof answer === 'string' && answer.length > 1) {
                 // Check if this looks like a name (not email, not phone, not gender, etc.)
                 if (!answer.includes('@') && !answer.match(/^\d+$/) && !['male', 'female', 'other'].includes(answer.toLowerCase())) {
                   value = answer;
                   break;
                 }
               }
             }
           }
           
           if (!value && field === 'email') {
             // Look for any answer that looks like an email
             for (const q of formQuestions) {
               const answer = (answers as any)[String(q.id)];
               if (answer && typeof answer === 'string' && answer.includes('@')) {
                 value = answer;
                 break;
               }
             }
           }
           
           if (!value && field === 'phone') {
             // Look for any answer that looks like a phone number
             for (const q of formQuestions) {
               const answer = (answers as any)[String(q.id)];
               if (answer && typeof answer === 'string' && (answer.match(/^\d+$/) || answer.includes('+'))) {
                 value = answer;
                 break;
               }
             }
           }
           
           if (!value && field === 'gender') {
             // Look for any answer that looks like a gender
             for (const q of formQuestions) {
               const answer = (answers as any)[String(q.id)];
               if (answer && typeof answer === 'string' && ['male', 'female', 'other'].includes(answer.toLowerCase())) {
                 value = answer;
                 break;
               }
             }
           }
           
           if (!value && field === 'age') {
             // Look for any answer that looks like an age
             for (const q of formQuestions) {
               const answer = (answers as any)[String(q.id)];
               if (answer && typeof answer === 'string' && !isNaN(Number(answer)) && Number(answer) > 0 && Number(answer) < 120) {
                 value = answer;
                 break;
               }
             }
           }
           
           // If we found a value, break out of submission loop
           if (value !== undefined && value !== null && value !== '') {
             break;
           }
        }
      }
      return value;
    };

    // Check core questions (required)
    const coreQuestions = ['fullName', 'phone', 'email', 'gender', 'age', 'source'];
    const coreComplete = coreQuestions.every(field => {
      const value = getValue(field);
      if (field === 'age') return value !== null && value !== undefined && value !== '';
      return value !== null && value !== undefined && String(value).trim() !== '';
    });

    // Check team assignment (required)
    const teamAssignmentComplete = client.teamAssignments && client.teamAssignments.length > 0;

    // Check subscription details (required)
    let subscriptionComplete = false;
    if (client.subscriptions && client.subscriptions.length > 0) {
      const subscription = client.subscriptions[0]; // Latest subscription
      
      // Required subscription fields
      const requiredSubscriptionFields = [
        'startDate', 'durationValue', 'durationUnit', 'paymentStatus', 'packageId'
      ];
      
      const subscriptionFieldsComplete = requiredSubscriptionFields.every(field => {
        const value = (subscription as any)[field];
        return value !== null && value !== undefined && value !== '';
      });

      // Check registration date (client registration date)
      const registrationComplete = client.registrationDate !== null;

      // Check payment method (conditional based on payment status)
      let paymentMethodComplete = true;
      if (subscription.paymentStatus?.toLowerCase() !== 'free' && subscription.paymentStatus?.toLowerCase() !== 'free trial') {
        paymentMethodComplete = subscription.paymentMethod !== null && subscription.paymentMethod !== '';
      } else {
        // For free subscriptions, payment method is not required
        paymentMethodComplete = true;
      }

      // Check price fields (conditional based on payment status)
      let priceComplete = true;
      if (subscription.paymentStatus?.toLowerCase() !== 'free' && subscription.paymentStatus?.toLowerCase() !== 'free trial') {
        priceComplete = subscription.priceBeforeDisc !== null && subscription.priceBeforeDisc !== undefined;
        if (subscription.discountApplied) {
          priceComplete = priceComplete && subscription.priceAfterDisc !== null && subscription.priceAfterDisc !== undefined;
        }
      }

      // Check installment fields (conditional based on payment status)
      let installmentComplete = true;
      if (subscription.paymentStatus?.toLowerCase() === 'installments') {
        installmentComplete = subscription.installments && subscription.installments.length > 0;
        if (installmentComplete) {
          // Check if installments have required fields
          installmentComplete = subscription.installments.every(installment => 
            installment.amount !== null && installment.amount !== undefined
          );
        }
      }

      subscriptionComplete = subscriptionFieldsComplete && registrationComplete && paymentMethodComplete && priceComplete && installmentComplete;

      // Debug logging for single client
      console.log(`=== Profile Completion Debug for Client ${client.id} ===`);
      console.log('Core Complete:', coreComplete);
      console.log('Team Assignment Complete:', teamAssignmentComplete);
      console.log('Subscription Fields Complete:', subscriptionFieldsComplete);
      console.log('Registration Complete:', registrationComplete);
      console.log('Payment Method Complete:', paymentMethodComplete, 'Value:', subscription.paymentMethod);
      console.log('Price Complete:', priceComplete);
      console.log('Installment Complete:', installmentComplete);
      console.log('Subscription Complete:', subscriptionComplete);
      console.log('Final Complete:', coreComplete && teamAssignmentComplete && subscriptionComplete);
      console.log('Payment Status:', subscription.paymentStatus);
      console.log('Package ID:', subscription.packageId);
    }

    const isComplete = coreComplete && teamAssignmentComplete && subscriptionComplete;
    res.json({ ...client, profileCompletion: isComplete ? 'Completed' : 'Not Completed' });
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
      console.log('Backend - Received client data:', client);
      console.log('Backend - fullName from request:', client.fullName);

      // If Full Name was edited inside the selected form answers, use it to override client.fullName
      let overrideFullName: string | undefined;
      try {
        const incomingAnswers = (req.body as any).answers;
        const selectedFormId = client.selectedFormId ? Number(client.selectedFormId) : undefined;
        if (incomingAnswers && selectedFormId) {
          const formDef = await tx.checkInForm.findUnique({
            where: { id: selectedFormId },
            include: { questions: true },
          });
          const fullNameQuestion = formDef?.questions.find(q => q.label.toLowerCase().includes('full name') || q.label.toLowerCase() === 'name');
          if (fullNameQuestion) {
            const ans = incomingAnswers[String(fullNameQuestion.id)];
            if (ans && String(ans).trim() !== '' && ans !== 'undefined') {
              overrideFullName = String(ans).trim();
              console.log('Backend - Override fullName from answers:', overrideFullName);
            }
          }
        }
      } catch (e) {
        console.warn('Backend - Could not derive fullName from answers:', e);
      }

      const updatedClient = await tx.trainerClient.update({
        where: { id: clientId },
        data: {
          fullName: overrideFullName ?? client.fullName,
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
      console.log('Backend - Processing answers:', answers);
      console.log('Backend - client.selectedFormId:', client.selectedFormId);
      console.log('Backend - answers type:', typeof answers);
      console.log('Backend - answers keys:', answers ? Object.keys(answers) : 'no answers');
      if (answers && client.selectedFormId) {
        console.log('Backend - Found answers and selectedFormId, processing check-in submission');
        console.log('Backend - answers object:', JSON.stringify(answers, null, 2));
        const latestSubmission = await tx.checkInSubmission.findFirst({
          where: { clientId, formId: Number(client.selectedFormId) },
          orderBy: { submittedAt: 'desc' },
        });
        console.log('Backend - Latest submission found:', latestSubmission);
        if (latestSubmission) {
          console.log('Backend - Updating existing submission with answers');
          const updatedSubmission = await tx.checkInSubmission.update({
            where: { id: latestSubmission.id },
            data: { answers: { ...answers, filledByTrainer: true }, submittedAt: new Date() }, // Mark as filled by trainer
          });
          console.log('Backend - Successfully updated submission:', updatedSubmission);
        } else {
          console.log('Backend - Creating new submission with answers');
          const newSubmission = await tx.checkInSubmission.create({
            data: {
              clientId,
              formId: Number(client.selectedFormId),
              answers: { ...answers, filledByTrainer: true }, // Mark as filled by trainer
              submittedAt: new Date(),
            },
          });
          console.log('Backend - Successfully created new submission:', newSubmission);
        }
      } else {
        console.log('Backend - No answers or selectedFormId, skipping check-in submission processing');
        console.log('Backend - answers:', answers);
        console.log('Backend - selectedFormId:', client.selectedFormId);
      }
      // 2. Update or create subscription (assume only one active subscription)
      let updatedSubscription = null;
      if (subscription) {
        if (subscription.id) {
          console.log('Updating subscription:', subscription);
          console.log('USING RELATION CONNECT FOR SUBSCRIPTION.UPDATE');
          updatedSubscription = await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              package: { connect: { id: Number(subscription.packageId) } },
              startDate: new Date(subscription.startDate),
              durationValue: Number(subscription.durationValue),
              durationUnit: subscription.durationUnit,
              endDate: new Date(subscription.endDate),
              paymentStatus: String(subscription.paymentStatus || 'pending'),
              paymentMethod: subscription.paymentMethod,
              priceBeforeDisc: subscription.priceBeforeDisc ? Number(subscription.priceBeforeDisc) : null,
              discountApplied: Boolean(subscription.discountApplied),
              discountType: subscription.discountType,
              discountValue: subscription.discountValue ? Number(subscription.discountValue) : null,
              priceAfterDisc: subscription.priceAfterDisc ? Number(subscription.priceAfterDisc) : 
                (Boolean(subscription.discountApplied) && subscription.priceBeforeDisc && subscription.discountValue 
                  ? (subscription.discountType === 'percentage' 
                      ? subscription.priceBeforeDisc * (1 - subscription.discountValue / 100)
                      : subscription.priceBeforeDisc - subscription.discountValue)
                  : null),
            },
          });
          console.log('Updated subscription:', updatedSubscription);
        } else {
          // Create new subscription for this client
          console.log('Creating new subscription:', subscription);
          console.log('USING SCALAR FKs (clientId, packageId) FOR SUBSCRIPTION.CREATE');
          updatedSubscription = await tx.subscription.create({
            data: {
              clientId: clientId,
              packageId: Number(subscription.packageId),
              startDate: new Date(subscription.startDate),
              durationValue: Number(subscription.durationValue),
              durationUnit: subscription.durationUnit,
              endDate: new Date(subscription.endDate),
              paymentStatus: String(subscription.paymentStatus || 'pending'),
              paymentMethod: subscription.paymentMethod,
              priceBeforeDisc: subscription.priceBeforeDisc ? Number(subscription.priceBeforeDisc) : null,
              discountApplied: Boolean(subscription.discountApplied),
              discountType: subscription.discountType,
              discountValue: subscription.discountValue ? Number(subscription.discountValue) : null,
              priceAfterDisc: subscription.priceAfterDisc ? Number(subscription.priceAfterDisc) : 
                (Boolean(subscription.discountApplied) && subscription.priceBeforeDisc && subscription.discountValue 
                  ? (subscription.discountType === 'percentage' 
                      ? subscription.priceBeforeDisc * (1 - subscription.discountValue / 100)
                      : subscription.priceBeforeDisc - subscription.discountValue)
                  : null),
              // Initialize hold fields
              isOnHold: false,
              holdStartDate: null,
              holdEndDate: null,
              holdDuration: null,
              holdDurationUnit: null,
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
            
            // Generate automatic task for updated installment if nextInstallment is set
            if (nextInstallment) {
              const today = new Date();
              const installmentDate = new Date(nextInstallment);
              
              // Only create task if next installment date is today or in the future
              if (installmentDate >= today) {
                // Check if this task was manually deleted
                const manuallyDeleted = await checkIfTaskManuallyDeleted(updatedClient.trainerId, updatedClient.id, 'Installment', 'automatic');
                
                if (!manuallyDeleted) {
                  // Check if a task already exists for this installment
                  const existingTask = await tx.task.findFirst({
                    where: {
                      trainerId: updatedClient.trainerId,
                      clientId: updatedClient.id,
                      category: 'Installment',
                      taskType: 'automatic',
                      status: 'open',
                    },
                  });

                  if (!existingTask) {
                    await tx.task.create({
                      data: {
                        trainerId: updatedClient.trainerId,
                        title: `Installment due for ${updatedClient.fullName}`,
                        description: `Installment of ${inst.amount} is due on ${installmentDate.toLocaleDateString()} for ${updatedClient.fullName}. Please follow up for payment.`,
                        taskType: 'automatic',
                        category: 'Installment',
                        status: 'open',
                        clientId: updatedClient.id,
                        dueDate: installmentDate,
                      },
                    });
                    console.log('Created installment task for updated client:', updatedClient.fullName);
                  }
                }
              }
            }
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
            
            // Generate automatic task for new installment if nextInstallment is set
            if (nextInstallment) {
              const today = new Date();
              const installmentDate = new Date(nextInstallment);
              
              // Only create task if next installment date is today or in the future
              if (installmentDate >= today) {
                // Check if this task was manually deleted
                const manuallyDeleted = await checkIfTaskManuallyDeleted(updatedClient.trainerId, updatedClient.id, 'Installment', 'automatic');
                
                if (!manuallyDeleted) {
                  // Check if a task already exists for this installment
                  const existingTask = await tx.task.findFirst({
                    where: {
                      trainerId: updatedClient.trainerId,
                      clientId: updatedClient.id,
                      category: 'Installment',
                      taskType: 'automatic',
                      status: 'open',
                    },
                  });

                  if (!existingTask) {
                    await tx.task.create({
                      data: {
                        trainerId: updatedClient.trainerId,
                        title: `Installment due for ${updatedClient.fullName}`,
                        description: `Installment of ${inst.amount} is due on ${installmentDate.toLocaleDateString()} for ${updatedClient.fullName}. Please follow up for payment.`,
                        taskType: 'automatic',
                        category: 'Installment',
                        status: 'open',
                        clientId: updatedClient.id,
                        dueDate: installmentDate,
                      },
                    });
                    console.log('Created installment task for new client:', updatedClient.fullName);
                  }
                }
              }
            }
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
        // Delete subscription hold records first
        await tx.subscriptionHold.deleteMany({ where: { subscriptionId: sub.id } });
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