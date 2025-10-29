import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { socketManager } from './socket';
import registerRoute from './routes/register';
import clientsRoute from './routes/clients';
import packagesRoute from './routes/packages';
import dropdownsRoute from './routes/dropdowns';
import transactionImagesRoute from './routes/transaction-images';
import labelsRoute from './routes/labels';
import loginRoute from './routes/login';
import profileRoute from './routes/profile';
import checkinsRoute from './routes/checkins';
import notesRoute from './routes/notes';
import exercisesRoute from './routes/exercises';
import programsRoute from './routes/programs';
import checkUsersRoute from './routes/check-users';
import debugClientRoute from './routes/debug-client';
import subscriptionsRoute from './routes/subscriptions';
import teamMembersRoute from './routes/team-members';
import clientAssignmentsRoute from './routes/client-assignments';
import clientProgramAssignmentsRoute from './routes/client-program-assignments';
import clientNutritionAssignmentsRoute from './routes/client-nutrition-assignments';
import tasksRoute from './routes/tasks';
import nutritionProgramsRoute from './routes/nutrition-programs';
import nutritionProgramManagementRoute from './routes/nutrition-program-management';
import servicesRoute from './routes/services';
import leadsRoute from './routes/leads';
import supportRoute from './routes/support';
import financeRoute from './routes/finance';
import notificationsRoute from './routes/notifications';
import workflowsRoute from './routes/workflows';
import mobileAuthRoute from './routes/mobile-auth';
import mobileProgramsRoute from './routes/mobile-programs';
import mobileNutritionRoute from './routes/mobile-nutrition';
import mobileFormsRoute from './routes/mobile-forms';
import mobileWorkoutSessionsRoute from './routes/mobile-workout-sessions';
import ingredientsRoute from './routes/ingredients';
import mealsRoute from './routes/meals';
import pdfExportRoute from './routes/pdf-export';
import dashboardRoute from './routes/dashboard';
import messagesRoute from './routes/messages';
import messageUploadsRoute from './routes/message-uploads';
import workflowProcessor from './jobs/workflowProcessor';

// Always load .env from the project root
const envPath = path.resolve(__dirname, '../../.env');
console.log('Trying to load .env from:', envPath);
dotenv.config({ path: envPath });
console.log('DATABASE_URL after dotenv:', process.env.DATABASE_URL);

const app = express();
const httpServer = createServer(app);
const PORT = Number(process.env.PORT) || 4000;

// Initialize Socket.IO
socketManager.initialize(httpServer);

app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

app.use('/express-register', registerRoute);
app.use('/api/clients', clientsRoute);
app.use('/api/packages', packagesRoute);
app.use('/api/dropdowns', dropdownsRoute);
app.use('/api/transaction-images', transactionImagesRoute);
app.use('/api/labels', labelsRoute);
app.use('/api/login', loginRoute);
app.use('/api/profile', profileRoute);
app.use('/api/checkins', checkinsRoute);
app.use('/api/notes', notesRoute);
app.use('/api/exercises', exercisesRoute);
// PDF Export endpoints (must be before programs route)
app.use('/api/programs', pdfExportRoute);
app.use('/api/programs', programsRoute);
app.use('/api/check-users', checkUsersRoute);
app.use('/api/debug-client', debugClientRoute);
app.use('/api/subscriptions', subscriptionsRoute);
app.use('/api/team-members', teamMembersRoute);
app.use('/api/client-assignments', clientAssignmentsRoute);
app.use('/api/client-program-assignments', clientProgramAssignmentsRoute);
app.use('/api/client-nutrition-assignments', clientNutritionAssignmentsRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/nutrition-programs', nutritionProgramsRoute);
app.use('/api/nutrition-program-management', nutritionProgramManagementRoute);
app.use('/api/services', servicesRoute);
app.use('/api/leads', leadsRoute);
app.use('/api/support', supportRoute);
app.use('/api/finance', financeRoute);
app.use('/api/notifications', notificationsRoute);
app.use('/api/workflows', workflowsRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/messages', messagesRoute);
app.use('/api/message-uploads', messageUploadsRoute);
// Mobile endpoints
app.use('/mobile', mobileAuthRoute);
app.use('/mobile', mobileProgramsRoute);
app.use('/mobile', mobileNutritionRoute);
app.use('/mobile/forms', mobileFormsRoute);
app.use('/mobile', mobileWorkoutSessionsRoute);
app.use('/api/ingredients', ingredientsRoute);
app.use('/api/meals', mealsRoute);

app.get('/', (req, res) => {
  res.send('Badehy backend is running!');
});

// Test endpoint
app.post('/test', (req, res) => {
  console.log('Test endpoint hit:', req.body);
  res.json({ message: 'Test endpoint working', received: req.body });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on 0.0.0.0:${PORT}`);
  console.log(`Server accessible at http://localhost:${PORT} and http://[your-local-ip]:${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}`);
  
  // Start workflow processor
  workflowProcessor.start();
}).on('error', (err) => {
  console.error('Server failed to start:', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  workflowProcessor.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  workflowProcessor.stop();
  process.exit(0);
}); 