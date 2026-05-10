require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const NasaSeaLevelApi = require('./infrastructure/apis/NASA/NasaSeaLevel/NasaSeaLevel');

// NASA Fire Module (new structure)
const { NasaFireService } = require('./infrastructure/apis/NASA/NasaFire/NasaFireService');
const { createNasaFireRoutes } = require('./infrastructure/apis/NASA/NasaFire/NasaFireRoutes');

// NASA GISTEMP Module (new structure)
const { NasaGistempService } = require('./infrastructure/apis/NASA/NasaGistemp/NasaGistempService');
const { createNasaGistempRoutes } = require('./infrastructure/apis/NASA/NasaGistemp/NasaGistempRoutes');

const app = express();

// Middleware (must be configured before routes)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bio_scan_db')
  .then(() => {
    console.log('MongoDB connected successfully');
    
    // Initialize NASA Fire Service and start sync
    if (process.env.MAP_KEY) {
      const nasaFireService = new NasaFireService({ 
        apiKey: process.env.MAP_KEY
      });
      
      // Start automatic synchronization
      nasaFireService.startSync();
      
      // Store service instance for access in other parts of the app
      app.locals.nasaFireService = nasaFireService;
      
      // Setup NASA Fire routes
      const nasaFireRouter = express.Router();
      app.use('/api/fires', createNasaFireRoutes(nasaFireRouter, nasaFireService));
    } else {
      console.warn('MAP_KEY not found. NASA Fire sync service will not start.');
    }

    // Initialize NASA GISTEMP Service and start sync
    const nasaGistempService = new NasaGistempService();
    
    // Start automatic synchronization (weekly)
    nasaGistempService.startSync();
    
    // Store service instance for access in other parts of the app
    app.locals.nasaGistempService = nasaGistempService;
    
    // Setup NASA GISTEMP routes
    const nasaGistempRouter = express.Router();
    app.use('/api/global-temperature', createNasaGistempRoutes(nasaGistempRouter, nasaGistempService));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// API Clients (instantiate with environment variables)
const nasaSeaLevelApi = new NasaSeaLevelApi();

app.get('/api/ice-melt', async (req, res) => {
  try {
    const seaLevelData = await nasaSeaLevelApi.getGlobalSeaLevel();
    res.json(seaLevelData);
  } catch (error) {
    console.error('Error in /api/ice-melt:', error.message);
    res.status(500).json({ message: 'Could not fetch ice melt data.' });
  }
});

// Placeholder routes for other APIs mentioned in README.md
app.get('/api/deforestation', (req, res) => {
  res.status(501).json({ message: 'Deforestation API not yet implemented.' });
});

app.get('/api/ocean-pollution', (req, res) => {
  res.status(501).json({ message: 'Ocean Pollution API not yet implemented.' });
});

app.get('/api/extinction', (req, res) => {
  res.status(501).json({ message: 'Endangered Species API not yet implemented.' });
});

// Health Check
app.get('/health', (req, res) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const fireSyncStatus = app.locals.nasaFireService ? app.locals.nasaFireService.getSyncStatus() : null;
  const gistempSyncStatus = app.locals.nasaGistempService ? app.locals.nasaGistempService.getSyncStatus() : null;
  
  res.status(200).json({
    status: 'healthy',
    mongodb: mongoStatus,
    fireSync: fireSyncStatus,
    gistempSync: gistempSyncStatus
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 