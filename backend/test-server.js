const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Test server is running!');
});

app.post('/register/test', (req, res) => {
  console.log('Test endpoint hit:', req.body);
  res.json({ message: 'Test received', body: req.body });
});

app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
}); 