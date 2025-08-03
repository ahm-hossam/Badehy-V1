import express from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const prisma = new PrismaClient();

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

// Save manually deleted tasks
function saveManuallyDeletedTasks(tasks: any[]): void {
  try {
    fs.writeFileSync(DELETED_TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error('Error saving manually deleted tasks:', error);
  }
}

// Check if a task was manually deleted
function isTaskManuallyDeleted(trainerId: number, clientId: number | null, category: string, taskType: string): boolean {
  const deletedTasks = loadManuallyDeletedTasks();
  return deletedTasks.some((task: any) => 
    task.trainerId === trainerId && 
    task.clientId === clientId && 
    task.category === category && 
    task.taskType === taskType
  );
}

// Mark a task as manually deleted
function markTaskAsManuallyDeleted(trainerId: number, clientId: number | null, category: string, taskType: string): void {
  const deletedTasks = loadManuallyDeletedTasks();
  deletedTasks.push({
    trainerId,
    clientId,
    category,
    taskType,
    deletedAt: new Date().toISOString()
  });
  saveManuallyDeletedTasks(deletedTasks);
}

// GET /api/tasks - Get all tasks for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId, status, taskType, category, assignedTo, clientId } = req.query;
    
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const where: any = {
      trainerId: Number(trainerId),
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (taskType && taskType !== 'all') {
      where.taskType = taskType;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    if (assignedTo && assignedTo !== 'all') {
      where.assignedTo = Number(assignedTo);
    }

    if (clientId && clientId !== 'all') {
      where.clientId = Number(clientId);
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTeamMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        comments: {
          include: {
            teamMember: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/count - Get task count for sidebar
router.get('/count', async (req, res) => {
  try {
    const { trainerId } = req.query;
    
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const openTasksCount = await prisma.task.count({
      where: {
        trainerId: Number(trainerId),
        status: 'open',
      },
    });

    res.json({ count: openTasksCount });
  } catch (error) {
    console.error('Error fetching task count:', error);
    res.status(500).json({ error: 'Failed to fetch task count' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req, res) => {
  try {
    const {
      trainerId,
      title,
      description,
      taskType = 'manual',
      category = 'Manual',
      assignedTo,
      dueDate,
      clientId,
    } = req.body;

    if (!trainerId || !title) {
      return res.status(400).json({ error: 'Trainer ID and title are required' });
    }

    // Handle assignedTo conversion for "me"
    let assignedToValue = null;
    if (assignedTo && assignedTo !== '' && assignedTo !== 'null' && assignedTo !== 'undefined') {
      if (assignedTo === 'me') {
        // For "me", we need to find the actual trainer's team member ID
        const trainerTeamMember = await prisma.teamMember.findFirst({
          where: {
            trainerId: Number(trainerId),
            role: 'Owner',
          },
        });
        if (trainerTeamMember) {
          assignedToValue = trainerTeamMember.id;
          console.log('Set assignedTo to trainer team member ID:', trainerTeamMember.id);
        } else {
          console.log('Trainer team member not found, set assignedTo to null');
        }
      } else {
        assignedToValue = Number(assignedTo);
        console.log('Converted assignedTo to:', Number(assignedTo));
      }
    }

    const task = await prisma.task.create({
      data: {
        trainerId: Number(trainerId),
        title,
        description,
        taskType,
        category,
        assignedTo: assignedToValue,
        dueDate: dueDate ? new Date(dueDate) : null,
        clientId: clientId ? Number(clientId) : null,
      },
      include: {
        assignedTeamMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      assignedTo,
      dueDate,
      category,
      trainerId,
    } = req.body;

    console.log('Updating task:', { id, assignedTo, title, dueDate, category, trainerId }); // Debug log
    console.log('Full request body:', req.body); // Debug log

    // Prepare update data with explicit type conversion
    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;

    // Handle assignedTo conversion - properly handle team member assignments
    if (assignedTo !== undefined) {
      console.log('Raw assignedTo value:', assignedTo, typeof assignedTo);
      if (assignedTo && assignedTo !== '' && assignedTo !== 'null' && assignedTo !== 'undefined') {
        if (assignedTo === 'me') {
          // For "me", we need to find the actual trainer's team member ID
          const trainerTeamMember = await prisma.teamMember.findFirst({
            where: {
              trainerId: Number(trainerId),
              role: 'Owner',
            },
          });
          if (trainerTeamMember) {
            updateData.assignedTo = trainerTeamMember.id;
            console.log('Set assignedTo to trainer team member ID:', trainerTeamMember.id);
          } else {
            updateData.assignedTo = null;
            console.log('Trainer team member not found, set assignedTo to null');
          }
        } else {
          updateData.assignedTo = Number(assignedTo);
          console.log('Converted assignedTo to:', Number(assignedTo));
        }
      } else {
        updateData.assignedTo = null;
        console.log('Set assignedTo to null');
      }
    }

    // Handle dueDate conversion
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate && dueDate !== '' ? new Date(dueDate) : null;
    }

    console.log('Update data:', updateData);

    const task = await prisma.task.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        assignedTeamMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    console.log('Updated task result:', task); // Debug log
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting task with ID:', id); // Debug log

    // Get the task first to check if it's automatic
    const task = await prisma.task.findUnique({
      where: { id: Number(id) },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.taskType === 'automatic') {
      // For automatic tasks, store the deletion info to prevent recreation
      markTaskAsManuallyDeleted(task.trainerId, task.clientId, task.category, task.taskType);
      console.log('Stored deletion info for automatic task:', id);
    }

    // Delete comments first
    await prisma.taskComment.deleteMany({
      where: { taskId: Number(id) },
    });

    // Now delete the task
    await prisma.task.delete({
      where: { id: Number(id) },
    });

    console.log('Task deleted successfully:', id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/comments - Add a comment to a task
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { teamMemberId, comment } = req.body;

    if (!teamMemberId || !comment) {
      return res.status(400).json({ error: 'Team member ID and comment are required' });
    }

    const taskComment = await prisma.taskComment.create({
      data: {
        taskId: Number(id),
        teamMemberId: Number(teamMemberId),
        comment,
      },
      include: {
        teamMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(taskComment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// GET /api/tasks/:id/comments - Get comments for a task
router.get('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.taskComment.findMany({
      where: { taskId: Number(id) },
      include: {
        teamMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/tasks/generate-automated - Generate automatic tasks
router.post('/generate-automated', async (req, res) => {
  try {
    const { trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    console.log('Generating automatic tasks for trainer:', trainerId);

    const generatedTasks = [];

    // 1. Check for subscriptions ending soon
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const subscriptionsEndingSoon = await prisma.subscription.findMany({
      where: {
        client: {
          trainerId: Number(trainerId),
        },
        endDate: {
          gte: new Date(),
          lte: threeDaysFromNow,
        },
        paymentStatus: {
          not: 'cancelled',
        },
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    console.log('Found subscriptions ending soon:', subscriptionsEndingSoon.length);

    for (const subscription of subscriptionsEndingSoon) {
      // Check if this task was manually deleted
      const manuallyDeleted = isTaskManuallyDeleted(Number(trainerId), subscription.clientId, 'Subscription', 'automatic');

      if (manuallyDeleted) {
        console.log('Task was manually deleted for client:', subscription.client.fullName);
        continue; // Skip creating this task
      }

      // Check if a task already exists for this subscription
      const existingTask = await prisma.task.findFirst({
        where: {
          trainerId: Number(trainerId),
          clientId: subscription.clientId,
          category: 'Subscription',
          taskType: 'automatic',
          status: 'open',
        },
      });

      if (!existingTask) {
        const task = await prisma.task.create({
          data: {
            trainerId: Number(trainerId),
            title: `Client ${subscription.client.fullName} subscription ending soon`,
            description: `Subscription for ${subscription.client.fullName} ends on ${subscription.endDate.toLocaleDateString()}. Consider renewal for ${subscription.client.fullName}.`,
            taskType: 'automatic',
            category: 'Subscription',
            status: 'open',
            clientId: subscription.clientId,
            dueDate: subscription.endDate,
          },
        });
        generatedTasks.push(task);
        console.log('Created subscription task for client:', subscription.client.fullName);
      } else {
        console.log('Subscription task already exists for client:', subscription.client.fullName);
      }
    }

    // 2. Check for clients with pending payments
    const clientsWithPendingPayments = await prisma.subscription.findMany({
      where: {
        client: {
          trainerId: Number(trainerId),
        },
        paymentStatus: 'pending',
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    for (const subscription of clientsWithPendingPayments) {
      // Check if this task was manually deleted
      const manuallyDeleted = isTaskManuallyDeleted(Number(trainerId), subscription.clientId, 'Payment', 'automatic');

      if (manuallyDeleted) {
        console.log('Payment task was manually deleted for client:', subscription.client.fullName);
        continue; // Skip creating this task
      }

      // Check if a task already exists for this payment
      const existingTask = await prisma.task.findFirst({
        where: {
          trainerId: Number(trainerId),
          clientId: subscription.clientId,
          category: 'Payment',
          taskType: 'automatic',
          status: 'open',
        },
      });

      if (!existingTask) {
        const task = await prisma.task.create({
          data: {
            trainerId: Number(trainerId),
            title: `Follow up with ${subscription.client.fullName} for pending payment`,
            description: `Payment status is pending for ${subscription.client.fullName}. Please follow up with ${subscription.client.fullName}.`,
            taskType: 'automatic',
            category: 'Payment',
            status: 'open',
            clientId: subscription.clientId,
          },
        });
        generatedTasks.push(task);
        console.log('Created payment task for client:', subscription.client.fullName);
      } else {
        console.log('Payment task already exists for client:', subscription.client.fullName);
      }
    }

    // 3. Check for clients with incomplete profiles
    const clientsWithIncompleteProfiles = await prisma.trainerClient.findMany({
      where: {
        trainerId: Number(trainerId),
        OR: [
          { fullName: 'Unknown Client' },
          { email: '' },
          { phone: '' },
          { gender: null },
          { age: null },
          { source: null },
        ],
      },
    });

    console.log('Found clients with incomplete profiles:', clientsWithIncompleteProfiles.length);

    for (const client of clientsWithIncompleteProfiles) {
      // Check if this task was manually deleted
      const manuallyDeleted = isTaskManuallyDeleted(Number(trainerId), client.id, 'Profile', 'automatic');

      if (manuallyDeleted) {
        console.log('Profile task was manually deleted for client:', client.fullName);
        continue; // Skip creating this task
      }

      // Check if a task already exists for this profile
      const existingTask = await prisma.task.findFirst({
        where: {
          trainerId: Number(trainerId),
          clientId: client.id,
          category: 'Profile',
          taskType: 'automatic',
          status: 'open',
        },
      });

      if (!existingTask) {
        const task = await prisma.task.create({
          data: {
            trainerId: Number(trainerId),
            title: `Complete profile for ${client.fullName}`,
            description: `Client profile is incomplete. Please gather missing information for ${client.fullName}.`,
            taskType: 'automatic',
            category: 'Profile',
            status: 'open',
            clientId: client.id,
          },
        });
        generatedTasks.push(task);
        console.log('Created profile task for client:', client.fullName);
      } else {
        console.log('Profile task already exists for client:', client.fullName);
      }
    }

    // 4. Check for installments due today
    console.log('Checking installments due today for trainer:', trainerId);

    // First, get all installments for this trainer
    const allInstallments = await prisma.installment.findMany({
      where: {
        subscription: {
          client: {
            trainerId: Number(trainerId),
          },
        },
      },
      include: {
        subscription: {
          include: {
            client: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log('Total installments found:', allInstallments.length);

    // Filter for installments due today
    const todayForInstallments = new Date();
    const installmentsDueToday = allInstallments.filter(installment => {
      if (!installment.nextInstallment) return false;
      
      // Convert to date and compare only the date part (ignore time)
      const installmentDate = new Date(installment.nextInstallment);
      
      const isSameDate = installmentDate.getFullYear() === todayForInstallments.getFullYear() &&
                        installmentDate.getMonth() === todayForInstallments.getMonth() &&
                        installmentDate.getDate() === todayForInstallments.getDate();
      
      console.log('Checking installment:', {
        id: installment.id,
        nextInstallment: installment.nextInstallment,
        installmentDate: installmentDate.toISOString(),
        today: todayForInstallments.toISOString(),
        isSameDate,
        shouldInclude: isSameDate
      });
      
      return isSameDate;
    });

    console.log('Installments due today:', installmentsDueToday.length);

    for (const installment of installmentsDueToday) {
      // Check if this task was manually deleted
      const manuallyDeleted = isTaskManuallyDeleted(Number(trainerId), installment.subscription.clientId, 'Installment', 'automatic');

      if (manuallyDeleted) {
        console.log('Installment task was manually deleted for client:', installment.subscription.client.fullName);
        continue; // Skip creating this task
      }

      // Check if a task already exists for this installment
      const existingTask = await prisma.task.findFirst({
        where: {
          trainerId: Number(trainerId),
          clientId: installment.subscription.clientId,
          category: 'Installment',
          taskType: 'automatic',
          status: 'open',
        },
      });

      if (!existingTask) {
        const task = await prisma.task.create({
          data: {
            trainerId: Number(trainerId),
            title: `Installment due today for ${installment.subscription.client.fullName}`,
            description: `Installment of ${installment.amount} is due today for ${installment.subscription.client.fullName}. Please follow up for payment.`,
            taskType: 'automatic',
            category: 'Installment',
            status: 'open',
            clientId: installment.subscription.clientId,
            dueDate: installment.nextInstallment,
          },
        });
        generatedTasks.push(task);
        console.log('Created installment task for client:', installment.subscription.client.fullName);
      } else {
        console.log('Installment task already exists for client:', installment.subscription.client.fullName);
      }
    }

    // 5. Check for program updates due today
    console.log('Checking program updates due today for trainer:', trainerId);

    const programUpdatesDueToday = await prisma.clientProgramAssignment.findMany({
      where: {
        trainerId: Number(trainerId),
        nextUpdateDate: {
          not: null,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('Total program assignments found:', programUpdatesDueToday.length);

    // Filter for program updates due in the next 3 days
    const todayForUpdates = new Date();
    const threeDaysFromNowForPrograms = new Date(todayForUpdates);
    threeDaysFromNowForPrograms.setDate(threeDaysFromNowForPrograms.getDate() + 3);
    
    const updatesDueSoon = programUpdatesDueToday.filter(assignment => {
      if (!assignment.nextUpdateDate) return false;
      
      const updateDate = new Date(assignment.nextUpdateDate);
      
      // Compare only the date part (ignore time)
      const updateDateOnly = new Date(updateDate.getFullYear(), updateDate.getMonth(), updateDate.getDate());
      const todayOnly = new Date(todayForUpdates.getFullYear(), todayForUpdates.getMonth(), todayForUpdates.getDate());
      const threeDaysFromNowOnly = new Date(threeDaysFromNowForPrograms.getFullYear(), threeDaysFromNowForPrograms.getMonth(), threeDaysFromNowForPrograms.getDate());
      
      // Check if the update date is within the next 3 days
      const isWithinNextThreeDays = updateDateOnly >= todayOnly && updateDateOnly <= threeDaysFromNowOnly;
      
      console.log('Checking program update:', {
        id: assignment.id,
        nextUpdateDate: assignment.nextUpdateDate,
        updateDate: updateDate.toISOString(),
        updateDateOnly: updateDateOnly.toISOString(),
        todayOnly: todayOnly.toISOString(),
        threeDaysFromNowOnly: threeDaysFromNowOnly.toISOString(),
        isWithinNextThreeDays
      });
      
      return isWithinNextThreeDays;
    });

    console.log('Program updates due in next 3 days:', updatesDueSoon.length);

    for (const assignment of updatesDueSoon) {
      // Check if this task was manually deleted
      const manuallyDeleted = isTaskManuallyDeleted(Number(trainerId), assignment.clientId, 'Program', 'automatic');

      if (manuallyDeleted) {
        console.log('Program update task was manually deleted for client:', assignment.client.fullName);
        continue; // Skip creating this task
      }

      // Check if a task already exists for this program update
      const existingTask = await prisma.task.findFirst({
        where: {
          trainerId: Number(trainerId),
          clientId: assignment.clientId,
          category: 'Program',
          taskType: 'automatic',
          status: 'open',
        },
      });

      if (!existingTask) {
        const task = await prisma.task.create({
          data: {
            trainerId: Number(trainerId),
            title: `Program update due for ${assignment.client.fullName}`,
            description: `Program "${assignment.program.name}" update is due on ${assignment.nextUpdateDate ? new Date(assignment.nextUpdateDate).toLocaleDateString() : 'unknown date'} for ${assignment.client.fullName}. Please review and update the program.`,
            taskType: 'automatic',
            category: 'Program',
            status: 'open',
            clientId: assignment.clientId,
            dueDate: assignment.nextUpdateDate,
          },
        });
        generatedTasks.push(task);
        console.log('Created program update task for client:', assignment.client.fullName);
      } else {
        console.log('Program update task already exists for client:', assignment.client.fullName);
      }
    }

    // Get total existing tasks for response
    const totalExistingTasks = await prisma.task.count({
      where: {
        trainerId: Number(trainerId),
        taskType: 'automatic',
        status: 'open',
      },
    });

    console.log('Total generated tasks:', generatedTasks.length);
    res.json({ 
      message: 'Automatic tasks generated successfully',
      generatedTasks: generatedTasks.length,
      existingTasks: totalExistingTasks
    });
  } catch (error) {
    console.error('Error generating automatic tasks:', error);
    res.status(500).json({ error: 'Failed to generate automatic tasks' });
  }
});

// GET /api/tasks/test-installments - Test installment data
router.get('/test-installments', async (req, res) => {
  try {
    const { trainerId } = req.query;
    
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    console.log('Testing installments for trainer:', trainerId);

    // Get all installments for this trainer
    const allInstallments = await prisma.installment.findMany({
      where: {
        subscription: {
          client: {
            trainerId: Number(trainerId),
          },
        },
      },
      include: {
        subscription: {
          include: {
            client: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log('Total installments found:', allInstallments.length);

    const today = new Date();
    const installmentsDueToday = allInstallments.filter(installment => {
      if (!installment.nextInstallment) return false;
      
      const installmentDate = new Date(installment.nextInstallment);
      
      const isSameDate = installmentDate.getFullYear() === today.getFullYear() &&
                        installmentDate.getMonth() === today.getMonth() &&
                        installmentDate.getDate() === today.getDate();
      
      return isSameDate;
    });

    res.json({
      totalInstallments: allInstallments.length,
      installmentsDueTodayCount: installmentsDueToday.length,
      allInstallments: allInstallments.map(i => ({
        id: i.id,
        nextInstallment: i.nextInstallment,
        status: i.status,
        clientName: i.subscription?.client?.fullName,
        clientId: i.subscription?.clientId
      })),
      installmentsDueToday: installmentsDueToday.map(i => ({
        id: i.id,
        nextInstallment: i.nextInstallment,
        status: i.status,
        clientName: i.subscription?.client?.fullName,
        clientId: i.subscription?.clientId
      }))
    });
  } catch (error) {
    console.error('Error testing installments:', error);
    res.status(500).json({ error: 'Failed to test installments' });
  }
});

export default router; 