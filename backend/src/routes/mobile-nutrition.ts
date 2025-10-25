import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

function authMiddleware(req: any, res: any, next: any) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Get the active nutrition assignment for the authenticated client with full program structure
router.get('/nutrition/active', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    
    // First, update any expired nutrition programs to 'completed' status
    const now = new Date();
    await prisma.clientNutritionAssignment.updateMany({
      where: {
        clientId,
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

    const assignment = await prisma.clientNutritionAssignment.findFirst({
      where: { clientId, isActive: true },
      include: { 
        nutritionProgram: {
          include: {
            weeks: {
              orderBy: { weekNumber: 'asc' },
              include: {
                days: {
                  orderBy: { dayOfWeek: 'asc' },
                  include: {
                    meals: {
                      orderBy: { order: 'asc' },
                      include: {
                        meal: {
                          include: {
                            mealIngredients: {
                              include: {
                                ingredient: true
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { assignedAt: 'desc' },
    });
    
    return res.json({ assignment });
  } catch (e) {
    console.error('Active nutrition error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


