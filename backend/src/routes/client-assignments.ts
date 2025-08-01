import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/client-assignments - Get assignments for a trainer
router.get('/', async (req: Request, res: Response) => {
  try {
    const { trainerId, clientId, teamMemberId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const where: any = {
      assignedBy: parseInt(trainerId as string),
    };

    if (clientId) {
      where.clientId = parseInt(clientId as string);
    }

    if (teamMemberId) {
      where.teamMemberId = parseInt(teamMemberId as string);
    }

    const assignments = await prisma.clientTeamAssignment.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        teamMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching client assignments:', error);
    res.status(500).json({ error: 'Failed to fetch client assignments' });
  }
});

// POST /api/client-assignments - Assign client to team member
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Backend - Received request body:', req.body);
    console.log('Backend - Request headers:', req.headers);
    const { clientId, teamMemberId, assignedBy } = req.body;
    console.log('Backend - Extracted values:', { clientId, teamMemberId, assignedBy });

    if (!clientId || !teamMemberId || !assignedBy) {
      console.log('Backend - Missing required fields:', { clientId, teamMemberId, assignedBy });
      return res.status(400).json({
        error: 'Client ID, team member ID, and assigned by are required',
      });
    }

    // Check if client exists and belongs to trainer
    const client = await prisma.trainerClient.findFirst({
      where: {
        id: parseInt(clientId),
        trainerId: parseInt(assignedBy),
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if team member exists and belongs to trainer
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: parseInt(teamMemberId),
        trainerId: parseInt(assignedBy),
      },
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.clientTeamAssignment.findUnique({
      where: {
        clientId_teamMemberId: {
          clientId: parseInt(clientId),
          teamMemberId: parseInt(teamMemberId),
        },
      },
    });

    if (existingAssignment) {
      return res.status(400).json({ error: 'Client is already assigned to this team member' });
    }

    const assignment = await prisma.clientTeamAssignment.create({
      data: {
        clientId: parseInt(clientId),
        teamMemberId: parseInt(teamMemberId),
        assignedBy: parseInt(assignedBy),
      },
      include: {
        client: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
          },
        },
        teamMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating client assignment:', error);
    res.status(500).json({ error: 'Failed to create client assignment' });
  }
});

// DELETE /api/client-assignments/:clientId/:teamMemberId - Remove assignment
router.delete('/:clientId/:teamMemberId', async (req: Request, res: Response) => {
  try {
    const { clientId, teamMemberId } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Check if assignment exists and belongs to trainer
    const assignment = await prisma.clientTeamAssignment.findFirst({
      where: {
        clientId: parseInt(clientId),
        teamMemberId: parseInt(teamMemberId),
        assignedBy: parseInt(trainerId as string),
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await prisma.clientTeamAssignment.delete({
      where: {
        clientId_teamMemberId: {
          clientId: parseInt(clientId),
          teamMemberId: parseInt(teamMemberId),
        },
      },
    });

    res.json({ message: 'Assignment removed successfully' });
  } catch (error) {
    console.error('Error removing client assignment:', error);
    res.status(500).json({ error: 'Failed to remove client assignment' });
  }
});

// GET /api/client-assignments/client/:clientId - Get all assignments for a client
router.get('/client/:clientId', async (req: Request, res: Response) => {
  try {
    const { clientId } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const assignments = await prisma.clientTeamAssignment.findMany({
      where: {
        clientId: parseInt(clientId),
        assignedBy: parseInt(trainerId as string),
      },
      include: {
        teamMember: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching client assignments:', error);
    res.status(500).json({ error: 'Failed to fetch client assignments' });
  }
});

export default router; 