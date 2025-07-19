const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

app.get('/', (req, res) => {
  res.send('Simple server is running!');
});

app.post('/register/test', (req, res) => {
  console.log('=== TEST ENDPOINT ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body));
  res.json({ 
    message: 'Test received', 
    body: req.body,
    bodyKeys: Object.keys(req.body),
    contentType: req.headers['content-type']
  });
});

app.post('/register', (req, res) => {
  console.log('=== REGISTRATION ENDPOINT ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Body type:', typeof req.body);
  console.log('Body keys:', Object.keys(req.body));
  
  const { fullName, email, phoneNumber, countryCode, countryName, password, confirmPassword } = req.body;

  console.log('Extracted fields:', {
    fullName: fullName,
    email: email,
    phoneNumber: phoneNumber,
    countryCode: countryCode,
    countryName: countryName,
    password: password ? '***' : 'MISSING',
    confirmPassword: confirmPassword ? '***' : 'MISSING'
  });

  // Validate required fields with proper string checks
  if (!fullName || fullName.trim() === '') {
    console.log('Missing fullName');
    return res.status(400).json({ error: 'Full name is required.' });
  }

  if (!email || email.trim() === '') {
    console.log('Missing email');
    return res.status(400).json({ error: 'Email is required.' });
  }

  if (!phoneNumber || phoneNumber.trim() === '') {
    console.log('Missing phoneNumber');
    return res.status(400).json({ error: 'Phone number is required.' });
  }

  if (!countryCode || countryCode.trim() === '') {
    console.log('Missing countryCode');
    return res.status(400).json({ error: 'Country code is required.' });
  }

  if (!countryName || countryName.trim() === '') {
    console.log('Missing countryName');
    return res.status(400).json({ error: 'Country name is required.' });
  }

  if (!password || password.trim() === '') {
    console.log('Missing password');
    return res.status(400).json({ error: 'Password is required.' });
  }

  if (!confirmPassword || confirmPassword.trim() === '') {
    console.log('Missing confirmPassword');
    return res.status(400).json({ error: 'Please confirm your password.' });
  }

  console.log('All required fields present, proceeding with validation...');

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('Email validation failed:', email);
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  console.log('Email validation passed');

  // Validate password length
  if (password.length < 8) {
    console.log('Password too short:', password.length);
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  console.log('Password length validation passed');

  // Validate password match
  if (password !== confirmPassword) {
    console.log('Password mismatch');
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  console.log('Password match validation passed');

  // For now, just return success without database
  console.log('All validations passed - would create user in database');
  return res.status(201).json({ message: 'Registration successful! Please login.' });
});

app.listen(PORT, () => {
  console.log(`Simple server is running on port ${PORT}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
}); 