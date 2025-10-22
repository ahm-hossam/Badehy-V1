const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Simple test endpoint
app.get('/', (req, res) => {
  res.send('Badehy backend is running!');
});

// Test workout endpoints
app.get('/mobile/programs/active', (req, res) => {
  // Check for auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ assignment: null });
});

app.get('/mobile/sessions/active', (req, res) => {
  // Check for auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ session: null });
});

// Mobile client endpoints
app.get('/mobile/me', (req, res) => {
  // Check for auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ 
    client: {
      id: 1,
      fullName: 'Test Client',
      email: 'test@example.com',
      phone: '+1234567890'
    },
    subscription: {
      expired: false,
      status: 'active'
    }
  });
});

app.get('/mobile/nutrition/active', (req, res) => {
  // Check for auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ assignment: null });
});

app.get('/mobile/forms/main', (req, res) => {
  // Check for auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json({ 
    form: null,
    completed: true,
    preFillData: {}
  });
});

// Program assignment endpoints for dashboard
app.get('/api/programs', (req, res) => {
  res.json([]);
});

app.get('/api/client-program-assignments/client/:clientId', (req, res) => {
  res.json([]);
});

app.post('/api/client-program-assignments', (req, res) => {
  res.json({ 
    id: 1, 
    message: 'Program assigned successfully',
    assignment: {
      id: 1,
      clientId: req.body.clientId,
      programId: req.body.programId,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      isActive: true,
      status: 'active'
    }
  });
});

// Labels endpoint for dashboard
app.get('/api/labels', (req, res) => {
  const { trainerId } = req.query;
  res.json([]);
});

// Check-in forms endpoint for dashboard
app.get('/api/checkins', (req, res) => {
  const { trainerId } = req.query;
  res.json([]);
});

// Team members endpoint for dashboard
app.get('/api/team-members', (req, res) => {
  const { trainerId } = req.query;
  res.json([]);
});

// Notes endpoint for dashboard
app.get('/api/notes', (req, res) => {
  res.json([]);
});

app.post('/api/notes', (req, res) => {
  res.json({ 
    id: 1, 
    message: 'Note created successfully',
    note: {
      id: 1,
      content: req.body.content || 'New note',
      createdAt: new Date().toISOString()
    }
  });
});

// Clients endpoint for dashboard
app.get('/api/clients', (req, res) => {
  res.json([]);
});

app.post('/api/clients', (req, res) => {
  res.json({ 
    id: 1, 
    message: 'Client created successfully',
    client: {
      id: 1,
      fullName: req.body.fullName || 'New Client',
      email: req.body.email || 'client@example.com',
      phone: req.body.phone || '+1234567890'
    }
  });
});

// Packages endpoint for dashboard
app.get('/api/packages', (req, res) => {
  const { trainerId } = req.query;
  res.json([]);
});

app.post('/api/packages', (req, res) => {
  res.json({ 
    id: 1, 
    message: 'Package created successfully',
    package: {
      id: 1,
      name: req.body.name || 'New Package',
      price: req.body.price || 0
    }
  });
});

// Transaction images endpoint for dashboard
app.post('/api/transaction-images/subscription', (req, res) => {
  res.json({ 
    id: 1, 
    message: 'Transaction image uploaded successfully'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});