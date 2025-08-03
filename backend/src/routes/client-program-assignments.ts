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

// Get all program assignments for a client
router.get('/client/:clientId', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // First, update any expired programs to 'completed' status
    const now = new Date();
    await prisma.clientProgramAssignment.updateMany({
      where: {
        clientId: Number(clientId),
        trainerId: Number(trainerId),
        isActive: true,
        endDate: {
          not: null,
          lt: now
        }
      },
      data: {
        isActive: false,
        status: 'completed'
      }
    });

    const assignments = await prisma.clientProgramAssignment.findMany({
      where: {
        clientId: Number(clientId),
        trainerId: Number(trainerId)
      },
      include: {
        program: true
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching program assignments:', error);
    res.status(500).json({ error: 'Failed to fetch program assignments' });
  }
});

// Get active program assignment for a client
router.get('/client/:clientId/active', async (req, res) => {
  try {
    const { clientId } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // First, update any expired programs to 'completed' status
    const now = new Date();
    await prisma.clientProgramAssignment.updateMany({
      where: {
        clientId: Number(clientId),
        trainerId: Number(trainerId),
        isActive: true,
        endDate: {
          not: null,
          lt: now
        }
      },
      data: {
        isActive: false,
        status: 'completed'
      }
    });

    const activeAssignment = await prisma.clientProgramAssignment.findFirst({
      where: {
        clientId: Number(clientId),
        trainerId: Number(trainerId),
        isActive: true
      },
      include: {
        program: true
      }
    });

    res.json(activeAssignment);
  } catch (error) {
    console.error('Error fetching active program assignment:', error);
    res.status(500).json({ error: 'Failed to fetch active program assignment' });
  }
});

// Assign program to client
router.post('/', async (req, res) => {
  try {
    const { trainerId, clientId, programId, startDate, endDate, nextUpdateDate, notes } = req.body;

    if (!trainerId || !clientId || !programId || !startDate) {
      return res.status(400).json({ error: 'Trainer ID, Client ID, Program ID, and Start Date are required' });
    }

    // Deactivate any existing active assignments for this client
    await prisma.clientProgramAssignment.updateMany({
      where: {
        clientId: Number(clientId),
        trainerId: Number(trainerId),
        isActive: true
      },
      data: {
        isActive: false,
        endDate: new Date()
      }
    });

    // Create new assignment
    const assignment = await prisma.clientProgramAssignment.create({
      data: {
        trainerId: Number(trainerId),
        clientId: Number(clientId),
        programId: Number(programId),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        nextUpdateDate: nextUpdateDate ? new Date(nextUpdateDate) : null,
        notes: notes || null
      },
      include: {
        program: true,
        client: true
      }
    });

    // Generate automatic task for program update if nextUpdateDate is set
    if (nextUpdateDate) {
      const nextUpdate = new Date(nextUpdateDate);
      const today = new Date();
      const threeDaysBeforeUpdate = new Date(nextUpdate);
      threeDaysBeforeUpdate.setDate(threeDaysBeforeUpdate.getDate() - 3);
      
      // Only create task if we're within 3 days of the next update date
      if (today >= threeDaysBeforeUpdate && today <= nextUpdate) {
        // Check if this task was manually deleted
        const manuallyDeleted = await checkIfTaskManuallyDeleted(Number(trainerId), Number(clientId), 'Program', 'automatic');
        
        if (!manuallyDeleted) {
          // Check if a task already exists for this program update
          const existingTask = await prisma.task.findFirst({
            where: {
              trainerId: Number(trainerId),
              clientId: Number(clientId),
              category: 'Program',
              taskType: 'automatic',
              status: 'open',
            },
          });

          if (!existingTask) {
            await prisma.task.create({
              data: {
                trainerId: Number(trainerId),
                title: `Program update due for ${assignment.client.fullName}`,
                description: `Program "${assignment.program.name}" update is due on ${nextUpdate.toLocaleDateString()} for ${assignment.client.fullName}. Please review and update the program.`,
                taskType: 'automatic',
                category: 'Program',
                status: 'open',
                clientId: Number(clientId),
                dueDate: nextUpdate,
              },
            });
            console.log('Created program update task for client:', assignment.client.fullName);
          }
        }
      }
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error assigning program:', error);
    res.status(500).json({ error: 'Failed to assign program' });
  }
});

// Update program assignment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, nextUpdateDate, status, notes } = req.body;

    const assignment = await prisma.clientProgramAssignment.update({
      where: { id: Number(id) },
      data: {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        nextUpdateDate: nextUpdateDate ? new Date(nextUpdateDate) : undefined,
        status: status || undefined,
        notes: notes || undefined
      },
      include: {
        program: true
      }
    });

    res.json(assignment);
  } catch (error) {
    console.error('Error updating program assignment:', error);
    res.status(500).json({ error: 'Failed to update program assignment' });
  }
});

// Deactivate program assignment
router.put('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.clientProgramAssignment.update({
      where: { id: Number(id) },
      data: {
        isActive: false,
        endDate: new Date()
      },
      include: {
        program: true
      }
    });

    res.json(assignment);
  } catch (error) {
    console.error('Error deactivating program assignment:', error);
    res.status(500).json({ error: 'Failed to deactivate program assignment' });
  }
});

// Delete program assignment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.clientProgramAssignment.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Program assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting program assignment:', error);
    res.status(500).json({ error: 'Failed to delete program assignment' });
  }
});

export default router; 