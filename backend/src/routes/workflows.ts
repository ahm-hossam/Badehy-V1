import express from 'express';
import { PrismaClient } from '@prisma/client';
import workflowExecutor from '../services/workflowExecutor';

const router = express.Router();
const prisma = new PrismaClient();

// ===== WORKFLOW MANAGEMENT =====

// Get all workflows for a trainer
router.get('/', async (req, res) => {
  try {
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const workflows = await prisma.workflow.findMany({
      where: {
        trainerId: Number(trainerId),
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
          },
        },
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    res.status(500).json({ error: 'Failed to fetch workflows' });
  }
});

// Get workflow by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const workflow = await prisma.workflow.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
          },
        },
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
        executions: {
          include: {
            client: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json({ workflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// Create new workflow
router.post('/', async (req, res) => {
  try {
    const { trainerId, packageId, name, description, steps, isActive } = req.body;

    if (!trainerId || !name) {
      return res.status(400).json({ error: 'Trainer ID and name are required' });
    }

    // Verify package belongs to trainer if packageId is provided
    if (packageId) {
      const packageExists = await prisma.package.findFirst({
        where: {
          id: Number(packageId),
          trainerId: Number(trainerId),
        },
      });

      if (!packageExists) {
        return res.status(404).json({ error: 'Package not found' });
      }
    }

    // Create workflow with steps
    const workflow = await prisma.workflow.create({
      data: {
        trainerId: Number(trainerId),
        ...(packageId ? { packageId: Number(packageId) } : {}),
        name,
        description,
        isActive: isActive ?? true,
        steps: {
          create: steps?.map((step: any, index: number) => ({
            stepType: step.stepType,
            stepOrder: index + 1,
            config: JSON.stringify(step.config),
          })) || [],
        },
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
          },
        },
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
      },
    });

    res.status(201).json({ workflow });
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

// Update workflow
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId, name, description, steps, isActive } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Verify workflow belongs to trainer
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
      },
    });

    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Update workflow
    const workflow = await prisma.workflow.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        description,
        isActive,
        // Update steps if provided
        ...(steps && {
          steps: {
            deleteMany: {}, // Remove all existing steps
            create: steps.map((step: any, index: number) => ({
              stepType: step.stepType,
              stepOrder: index + 1,
              config: JSON.stringify(step.config),
            })),
          },
        }),
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
          },
        },
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
      },
    });

    res.json({ workflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ error: 'Failed to update workflow' });
  }
});

// Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Verify workflow belongs to trainer
    const existingWorkflow = await prisma.workflow.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
      },
    });

    if (!existingWorkflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Delete workflow (cascade will handle steps and executions)
    await prisma.workflow.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Failed to delete workflow' });
  }
});

// ===== WORKFLOW EXECUTION =====

// Get workflow executions for a trainer
router.get('/executions/list', async (req, res) => {
  try {
    const { trainerId, status } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflow: {
          trainerId: Number(trainerId),
        },
        ...(status && { status: String(status) }),
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
            package: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        currentStep: {
          select: {
            id: true,
            stepType: true,
            stepOrder: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    res.json({ executions });
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    res.status(500).json({ error: 'Failed to fetch workflow executions' });
  }
});

// Start workflow execution for a client
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId, clientId } = req.body;

    if (!trainerId || !clientId) {
      return res.status(400).json({ error: 'Trainer ID and Client ID are required' });
    }

    // Verify workflow belongs to trainer
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
        isActive: true,
      },
      include: {
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or inactive' });
    }

    // Check if client already has an active execution for this workflow
    const existingExecution = await prisma.workflowExecution.findFirst({
      where: {
        workflowId: Number(id),
        clientId: Number(clientId),
        status: 'active',
      },
    });

    if (existingExecution) {
      return res.status(400).json({ error: 'Client already has an active execution for this workflow' });
    }

    // Get first step
    const firstStep = workflow.steps[0];
    if (!firstStep) {
      return res.status(400).json({ error: 'Workflow has no steps' });
    }

    // Create execution
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: Number(id),
        clientId: Number(clientId),
        currentStepId: firstStep.id,
        status: 'active',
        lastStepAt: new Date(),
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        currentStep: {
          select: {
            id: true,
            stepType: true,
            stepOrder: true,
            config: true,
          },
        },
      },
    });

    // Start processing the execution immediately
    workflowExecutor.processExecution(execution.id).catch(error => {
      console.error('Error processing workflow execution:', error);
    });

    res.status(201).json({ execution });
  } catch (error) {
    console.error('Error starting workflow execution:', error);
    res.status(500).json({ error: 'Failed to start workflow execution' });
  }
});

// Start workflow for clients matching audience
router.post('/:id/start-for-audience', async (req, res) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Get workflow with steps
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: Number(id),
        trainerId: Number(trainerId),
        isActive: true,
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' }
        }
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found or inactive' });
    }

    // Find the audience step
    const audienceStep = workflow.steps.find(step => step.stepType === 'audience');
    if (!audienceStep) {
      return res.status(400).json({ error: 'Workflow must start with an audience step' });
    }

    const audienceConfig = JSON.parse(audienceStep.config);

    // Get matching clients
    let clientIds: number[] = [];

    if (audienceConfig.audienceType === 'all') {
      // All clients
      const clients = await prisma.trainerClient.findMany({
        where: { trainerId: Number(trainerId) },
        select: { id: true }
      });
      clientIds = clients.map(c => c.id);
    } else if (audienceConfig.audienceType === 'packages') {
      // Specific packages
      const packageIds = audienceConfig.selectedPackageIds || [];
      const subscriptions = await prisma.subscription.findMany({
        where: {
          packageId: { in: packageIds },
          isOnHold: false,
          isCanceled: false,
          package: {
            trainerId: Number(trainerId)
          }
        },
        select: { clientId: true }
      });
      clientIds = subscriptions.map(s => s.clientId);
    } else if (audienceConfig.audienceType === 'clients') {
      // Specific clients
      clientIds = audienceConfig.selectedClientIds || [];
    }

    // Start workflow for each client
    const startResults = [];
    for (const clientId of clientIds) {
      try {
        // Check if already has active execution
        const existing = await prisma.workflowExecution.findFirst({
          where: {
            workflowId: Number(id),
            clientId: Number(clientId),
            status: 'active'
          }
        });

        if (existing) {
          continue; // Skip if already active
        }

        // Start execution - skip audience step if it's the first step and there are more steps
        const startingStep = (workflow.steps[0]?.stepType === 'audience' && workflow.steps.length > 1) 
          ? workflow.steps[1].id 
          : workflow.steps[0].id;
          
        const execution = await prisma.workflowExecution.create({
          data: {
            workflowId: Number(id),
            clientId: Number(clientId),
            currentStepId: startingStep,
            status: 'active',
            lastStepAt: new Date()
          }
        });

        startResults.push({ clientId, status: 'started' });
        
        // Process immediately
        workflowExecutor.processExecution(execution.id).catch(console.error);
      } catch (error) {
        console.error(`Error starting workflow for client ${clientId}:`, error);
        startResults.push({ clientId, status: 'error' });
      }
    }

    res.json({
      success: true,
      started: startResults.filter(r => r.status === 'started').length,
      message: `Started workflow for ${startResults.filter(r => r.status === 'started').length} clients`,
      results: startResults
    });
  } catch (error) {
    console.error('Error starting workflow for audience:', error);
    res.status(500).json({ error: 'Failed to start workflow for audience' });
  }
});

// Process all active workflow executions (manual trigger)
router.post('/executions/process', async (req, res) => {
  try {
    await workflowExecutor.processActiveExecutions();
    res.json({ success: true, message: 'Active executions processed' });
  } catch (error) {
    console.error('Error processing executions:', error);
    res.status(500).json({ error: 'Failed to process executions' });
  }
});

// Pause/Resume workflow execution
router.patch('/executions/:executionId/status', async (req, res) => {
  try {
    const { executionId } = req.params;
    const { trainerId, status } = req.body;

    if (!trainerId || !status) {
      return res.status(400).json({ error: 'Trainer ID and status are required' });
    }

    if (!['active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Verify execution belongs to trainer
    const existingExecution = await prisma.workflowExecution.findFirst({
      where: {
        id: Number(executionId),
        workflow: {
          trainerId: Number(trainerId),
        },
      },
    });

    if (!existingExecution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    // Update execution status
    const execution = await prisma.workflowExecution.update({
      where: {
        id: Number(executionId),
      },
      data: {
        status,
        ...(status === 'completed' && { completedAt: new Date() }),
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        client: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        currentStep: {
          select: {
            id: true,
            stepType: true,
            stepOrder: true,
          },
        },
      },
    });

    res.json({ execution });
  } catch (error) {
    console.error('Error updating execution status:', error);
    res.status(500).json({ error: 'Failed to update execution status' });
  }
});

export default router;
