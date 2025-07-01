// server.js (updated)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const promptRoutes = require('./routes/promptRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
// const userRoutes = require('./routes/userRoutes'); // If you add user management

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api', promptRoutes);
app.use('/api/simulations', simulationRoutes);
// app.use('/api/users', userRoutes); // If you add user management

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('Phishing Simulator Backend is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});