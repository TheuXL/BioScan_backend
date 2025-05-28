const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const apiRoutes = require('./interfaces/http/routes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'BioScan API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BioScan API running on port ${PORT}`);
});

module.exports = app; 