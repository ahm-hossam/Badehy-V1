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

// Always load .env from the project root
const envPath = path.resolve(__dirname, '../../.env');
console.log('Trying to load .env from:', envPath);
dotenv.config({ path: envPath });
console.log('DATABASE_URL after dotenv:', process.env.DATABASE_URL);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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