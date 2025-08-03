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

    // Transform assignments to handle trainer's team member record
    const transformedAssignments = assignments.map(assignment => {
      // If the team member is the trainer (role is 'Owner'), mark it as 'me'
      if (assignment.teamMember && assignment.teamMember.role === 'Owner') {
        return {
          ...assignment,
          teamMember: {
            ...assignment.teamMember,
            id: 'me', // Mark as 'me' for frontend compatibility
            fullName: assignment.teamMember.fullName + ' (Main Trainer)',
          },
        };
      }
      return assignment;
    });

    res.json(transformedAssignments);
  } catch (error) {
    console.error('Error fetching client assignments:', error);
    res.status(500).json({ error: 'Failed to fetch client assignments' });
  }
});

// POST /api/client-assignments - Assign client to team member
router.post('/', async (req: Request, res: Response) => {
  try {
    const { clientId, teamMemberId, assignedBy } = req.body;
    
    console.log('Creating client assignment:', { clientId, teamMemberId, assignedBy });

    if (!clientId || !teamMemberId || !assignedBy) {
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

    // Check if this is the trainer assigning themselves
    if (parseInt(teamMemberId) === parseInt(assignedBy)) {
      console.log('Trainer is assigning themselves');
      // Trainer is assigning themselves - check if they have a team member record
      let trainerTeamMember = await prisma.teamMember.findFirst({
        where: {
          trainerId: parseInt(assignedBy),
          role: 'Owner',
        },
      });
      
      console.log('Existing trainer team member:', trainerTeamMember);
      
      // If no team member record exists for the trainer, create one
      if (!trainerTeamMember) {
        console.log('Creating new trainer team member record');
        const trainer = await prisma.registered.findUnique({
          where: { id: parseInt(assignedBy) },
        });
        
        if (!trainer) {
          return res.status(404).json({ error: 'Trainer not found' });
        }
        
        trainerTeamMember = await prisma.teamMember.create({
          data: {
            trainerId: parseInt(assignedBy),
            fullName: trainer.fullName,
            email: trainer.email,
            role: 'Owner',
            password: '', // Empty password for trainer's team member record
            phone: trainer.phoneNumber,
          },
        });
        console.log('Created trainer team member:', trainerTeamMember);
      }
      
      // Use the trainer's team member ID for the assignment
      const actualTeamMemberId = trainerTeamMember.id;
      console.log('Using actual team member ID:', actualTeamMemberId);
      
      // Check if assignment already exists
      const existingAssignment = await prisma.clientTeamAssignment.findUnique({
        where: {
          clientId_teamMemberId: {
            clientId: parseInt(clientId),
            teamMemberId: actualTeamMemberId,
          },
        },
      });

      if (existingAssignment) {
        return res.status(400).json({ error: 'Client is already assigned to this team member' });
      }

      const assignment = await prisma.clientTeamAssignment.create({
        data: {
          trainerId: parseInt(assignedBy),
          clientId: parseInt(clientId),
          teamMemberId: actualTeamMemberId,
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

      console.log('Assignment created successfully:', assignment);
      return res.status(201).json(assignment);
    } else {
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
        trainerId: parseInt(assignedBy),
        clientId: parseInt(clientId),
        teamMemberId: parseInt(teamMemberId),
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
        trainerId: parseInt(trainerId as string),
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
        trainerId: parseInt(trainerId as string),
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