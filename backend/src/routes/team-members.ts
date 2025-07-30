import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/team-members - Get all team members for a trainer
router.get('/', async (req: Request, res: Response) => {
  try {
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        trainerId: parseInt(trainerId as string),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            clientAssignments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

// GET /api/team-members/:id - Get specific team member
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: parseInt(id),
        trainerId: parseInt(trainerId as string),
      },
      include: {
        clientAssignments: {
          include: {
            client: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    res.json(teamMember);
  } catch (error) {
    console.error('Error fetching team member:', error);
    res.status(500).json({ error: 'Failed to fetch team member' });
  }
});

// POST /api/team-members - Create new team member
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      trainerId,
      fullName,
      email,
      phone,
      role,
      password,
      status = 'active',
    } = req.body;

    // Validation
    if (!trainerId || !fullName || !email || !role || !password) {
      return res.status(400).json({
        error: 'Trainer ID, full name, email, role, and password are required',
      });
    }

    // Check if email already exists
    const existingMember = await prisma.teamMember.findUnique({
      where: { email },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const teamMember = await prisma.teamMember.create({
      data: {
        trainerId: parseInt(trainerId),
        fullName,
        email,
        phone,
        role,
        password: hashedPassword,
        status,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(teamMember);
  } catch (error) {
    console.error('Error creating team member:', error);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

// PUT /api/team-members/:id - Update team member
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      trainerId,
      fullName,
      email,
      phone,
      role,
      password,
      status,
    } = req.body;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Check if team member exists and belongs to trainer
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        id: parseInt(id),
        trainerId: parseInt(trainerId),
      },
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingMember.email) {
      const emailExists = await prisma.teamMember.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updateData: any = {
      fullName,
      email,
      phone,
      role,
      status,
    };

    // Only hash password if it's being updated
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const teamMember = await prisma.teamMember.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(teamMember);
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

// DELETE /api/team-members/:id - Delete team member
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { trainerId } = req.query;

    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    // Check if team member exists and belongs to trainer
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        id: parseInt(id),
        trainerId: parseInt(trainerId as string),
      },
    });

    if (!existingMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Delete team member (this will cascade delete assignments)
    await prisma.teamMember.delete({
      where: { id: parseInt(id) },
    });

    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});

export default router; 