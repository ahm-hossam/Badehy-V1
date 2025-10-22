import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Authentication middleware for mobile clients
function authMiddleware(req: any, res: any, next: any) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Start a workout session for a specific day
router.post('/sessions/start', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const { dayId, assignmentId } = req.body;

    if (!dayId || !assignmentId) {
      return res.status(400).json({ error: 'Day ID and Assignment ID are required' });
    }

    // Check if there's already an active session for this day
    const existingSession = await prisma.workoutSession.findFirst({
      where: {
        clientId,
        dayId,
        assignmentId,
        status: { in: ['active', 'paused'] }
      }
    });

    if (existingSession) {
      return res.status(400).json({ error: 'A workout session is already active for this day' });
    }

    // Create new workout session
    const session = await prisma.workoutSession.create({
      data: {
        clientId,
        dayId,
        assignmentId,
        status: 'active',
        startedAt: new Date()
      },
      include: {
        day: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        assignment: {
          include: {
            program: true
          }
        }
      }
    });

    res.json({ session });
  } catch (error) {
    console.error('Error starting workout session:', error);
    res.status(500).json({ error: 'Failed to start workout session' });
  }
});

// Pause a workout session
router.post('/sessions/:sessionId/pause', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const { sessionId } = req.params;

    const session = await prisma.workoutSession.findFirst({
      where: {
        id: parseInt(sessionId),
        clientId,
        status: 'active'
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        status: 'paused',
        pausedAt: new Date()
      }
    });

    res.json({ session: updatedSession });
  } catch (error) {
    console.error('Error pausing workout session:', error);
    res.status(500).json({ error: 'Failed to pause workout session' });
  }
});

// Resume a workout session
router.post('/sessions/:sessionId/resume', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const { sessionId } = req.params;

    const session = await prisma.workoutSession.findFirst({
      where: {
        id: parseInt(sessionId),
        clientId,
        status: 'paused'
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Paused session not found' });
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        status: 'active',
        resumedAt: new Date()
      }
    });

    res.json({ session: updatedSession });
  } catch (error) {
    console.error('Error resuming workout session:', error);
    res.status(500).json({ error: 'Failed to resume workout session' });
  }
});

// Complete a workout session
router.post('/sessions/:sessionId/complete', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const { sessionId } = req.params;
    const { notes } = req.body;

    const session = await prisma.workoutSession.findFirst({
      where: {
        id: parseInt(sessionId),
        clientId,
        status: { in: ['active', 'paused'] }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    // Calculate total duration
    const now = new Date();
    const startTime = new Date(session.startedAt);
    let totalDuration = Math.floor((now.getTime() - startTime.getTime()) / 1000);

    // Subtract paused time if any
    if (session.pausedAt && session.resumedAt) {
      const pausedDuration = Math.floor((new Date(session.resumedAt).getTime() - new Date(session.pausedAt).getTime()) / 1000);
      totalDuration -= pausedDuration;
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: parseInt(sessionId) },
      data: {
        status: 'completed',
        completedAt: now,
        totalDuration,
        notes: notes || null
      }
    });

    res.json({ session: updatedSession });
  } catch (error) {
    console.error('Error completing workout session:', error);
    res.status(500).json({ error: 'Failed to complete workout session' });
  }
});

// Mark an exercise as completed
router.post('/sessions/:sessionId/exercises/:exerciseId/complete', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const { sessionId, exerciseId } = req.params;
    const { setsCompleted, repsCompleted, weightUsed, notes, duration } = req.body;

    // Verify the session belongs to the client
    const session = await prisma.workoutSession.findFirst({
      where: {
        id: parseInt(sessionId),
        clientId,
        status: { in: ['active', 'paused'] }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    // Check if exercise completion already exists
    const existingCompletion = await prisma.exerciseCompletion.findFirst({
      where: {
        sessionId: parseInt(sessionId),
        exerciseId: parseInt(exerciseId)
      }
    });

    let completion;
    if (existingCompletion) {
      // Update existing completion
      completion = await prisma.exerciseCompletion.update({
        where: { id: existingCompletion.id },
        data: {
          setsCompleted: setsCompleted || existingCompletion.setsCompleted,
          repsCompleted: repsCompleted || existingCompletion.repsCompleted,
          weightUsed: weightUsed || existingCompletion.weightUsed,
          notes: notes || existingCompletion.notes,
          duration: duration || existingCompletion.duration,
          completedAt: new Date()
        }
      });
    } else {
      // Create new completion
      completion = await prisma.exerciseCompletion.create({
        data: {
          sessionId: parseInt(sessionId),
          exerciseId: parseInt(exerciseId),
          setsCompleted: setsCompleted || 0,
          repsCompleted: repsCompleted || null,
          weightUsed: weightUsed || null,
          notes: notes || null,
          duration: duration || null
        }
      });
    }

    res.json({ completion });
  } catch (error) {
    console.error('Error completing exercise:', error);
    res.status(500).json({ error: 'Failed to complete exercise' });
  }
});

// Get current active session
router.get('/sessions/active', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };

    const session = await prisma.workoutSession.findFirst({
      where: {
        clientId,
        status: { in: ['active', 'paused'] }
      },
      include: {
        day: {
          include: {
            exercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        assignment: {
          include: {
            program: true
          }
        },
        exerciseCompletions: {
          include: {
            exercise: true
          }
        }
      },
      orderBy: {
        startedAt: 'desc'
      }
    });

    res.json({ session });
  } catch (error) {
    console.error('Error fetching active session:', error);
    res.status(500).json({ error: 'Failed to fetch active session' });
  }
});

// Get workout history for a client
router.get('/sessions/history', authMiddleware, async (req: any, res) => {
  try {
    const { clientId } = req.user as { clientId: number };
    const { limit = 10, offset = 0 } = req.query;

    const sessions = await prisma.workoutSession.findMany({
      where: {
        clientId,
        status: 'completed'
      },
      include: {
        day: {
          include: {
            week: true
          }
        },
        assignment: {
          include: {
            program: true
          }
        },
        exerciseCompletions: {
          include: {
            exercise: true
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({ error: 'Failed to fetch workout history' });
  }
});

export default router;
