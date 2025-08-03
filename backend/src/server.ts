import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
import brandingRoute from './routes/branding';
import templatesRoute from './routes/templates';
import checkUsersRoute from './routes/check-users';
import debugClientRoute from './routes/debug-client';
import subscriptionsRoute from './routes/subscriptions';
import teamMembersRoute from './routes/team-members';
import clientAssignmentsRoute from './routes/client-assignments';
import clientProgramAssignmentsRoute from './routes/client-program-assignments';
import clientNutritionAssignmentsRoute from './routes/client-nutrition-assignments';
import tasksRoute from './routes/tasks';
import nutritionProgramsRoute from './routes/nutrition-programs';

// Always load .env from the project root
const envPath = path.resolve(__dirname, '../../.env');
console.log('Trying to load .env from:', envPath);
dotenv.config({ path: envPath });
console.log('DATABASE_URL after dotenv:', process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 4000;

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
app.use('/api/programs', programsRoute);
app.use('/api/branding', brandingRoute);
app.use('/api/templates', templatesRoute);
app.use('/api/check-users', checkUsersRoute);
app.use('/api/debug-client', debugClientRoute);
app.use('/api/subscriptions', subscriptionsRoute);
app.use('/api/team-members', teamMembersRoute);
app.use('/api/client-assignments', clientAssignmentsRoute);
app.use('/api/client-program-assignments', clientProgramAssignmentsRoute);
app.use('/api/client-nutrition-assignments', clientNutritionAssignmentsRoute);
app.use('/api/tasks', tasksRoute);
app.use('/api/nutrition-programs', nutritionProgramsRoute);

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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
}); 