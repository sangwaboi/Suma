const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Check essential environment variables and provide fallbacks
const JWT_SECRET = process.env.JWT_SECRET || 'jira-clone-super-secret-key-for-authentication-12345';
process.env.JWT_SECRET = JWT_SECRET;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mernapp';
process.env.MONGODB_URI = MONGODB_URI;

// Log configuration for debugging
console.log('Server Configuration:');
console.log('PORT:', process.env.PORT || 5001);
console.log('MONGODB_URI is configured:', !!process.env.MONGODB_URI);
console.log('JWT_SECRET is configured:', !!process.env.JWT_SECRET);

// Initialize Express app
const app = express();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Improved CORS configuration
// Use the cors middleware directly with options
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-auth-token'],
  credentials: true
}));

// Add a custom middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  
  if (req.method !== 'OPTIONS' && req.body && Object.keys(req.body).length > 0) {
    // Only log request body for non-OPTIONS requests with content (exclude passwords)
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    console.log('Request body:', JSON.stringify(sanitizedBody));
  }
  
  next();
});

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Home route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 