import { PrismaClient } from '@prisma/client'
import { Router, Request, Response } from 'express'

const prisma = new PrismaClient()
const router = Router()

// GET /api/check-users
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await prisma.registered.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json({
      success: true,
      users: users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
})

export default router 