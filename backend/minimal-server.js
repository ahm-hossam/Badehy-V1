const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = 4000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Test endpoint
app.get('/', (req, res) => {
  res.send('Badehy backend is running!');
});

// Programs endpoint
app.get('/api/programs', async (req, res) => {
  try {
    const { trainerId } = req.query;
    if (!trainerId) {
      return res.status(400).json({ error: 'Trainer ID is required' });
    }

    console.log('Fetching programs for trainer ID:', trainerId);

    const programs = await prisma.program.findMany({
      where: {
        OR: [
          { trainerId: Number(trainerId) },
          { isDefault: true }
        ]
      },
      include: {
        weeks: {
          include: {
            days: {
              include: {
                exercises: {
                  include: {
                    exercise: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

// Tasks count endpoint
app.get('/api/tasks/count', async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
