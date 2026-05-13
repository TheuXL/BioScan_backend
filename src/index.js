require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
// NASA Fire Module (new structure)
const { NasaFireService } = require('./infrastructure/apis/NASA/NasaFire/NasaFireService');
const { createNasaFireRoutes } = require('./infrastructure/apis/NASA/NasaFire/NasaFireRoutes');

// NASA GISTEMP Module (new structure)
const { NasaGistempService } = require('./infrastructure/apis/NASA/NasaGistemp/NasaGistempService');
const { createNasaGistempRoutes } = require('./infrastructure/apis/NASA/NasaGistemp/NasaGistempRoutes');
const { NasaSeaLevelService } = require('./infrastructure/apis/NASA/NasaSeaLevel/NasaSeaLevelService');
const { createNasaSeaLevelRoutes } = require('./infrastructure/apis/NASA/NasaSeaLevel/NasaSeaLevelRoutes');
// Open-Meteo (on-demand, sem MongoDB)
const { OpenMeteoService } = require('./infrastructure/apis/OpenMeteo/OpenMeteoService');
const { createOpenMeteoRoutes } = require('./infrastructure/apis/OpenMeteo/OpenMeteoRoutes');
// USGS Earthquakes (on-demand, sem MongoDB)
const { UsgsEarthquakeService } = require('./infrastructure/apis/UsgsEarthquake/UsgsEarthquakeService');
const { createUsgsEarthquakeRoutes } = require('./infrastructure/apis/UsgsEarthquake/UsgsEarthquakeRoutes');
// NASA EONET (on-demand, sem MongoDB)
const { NasaEonetService } = require('./infrastructure/apis/NASA/NasaEonet/NasaEonetService');
const { createNasaEonetRoutes } = require('./infrastructure/apis/NASA/NasaEonet/NasaEonetRoutes');
const { OpenAqService, resolveOpenAqApiKey } = require('./infrastructure/apis/OpenAq/OpenAqService');
const { createOpenAqRoutes } = require('./infrastructure/apis/OpenAq/OpenAqRoutes');
const { GlobalForestWatchService } = require('./infrastructure/apis/GlobalForestWatch/GlobalForestWatchService');
const { createGlobalForestWatchRoutes } = require('./infrastructure/apis/GlobalForestWatch/GlobalForestWatchRoutes');

const app = express();

// Middleware (must be configured before routes)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Open-Meteo: disponível mesmo se MongoDB falhar (proxy stateless)
const openMeteoService = new OpenMeteoService();
const openMeteoRouter = express.Router();
app.use('/api/meteo', createOpenMeteoRoutes(openMeteoRouter, openMeteoService));
app.locals.openMeteoService = openMeteoService;

const usgsEarthquakeService = new UsgsEarthquakeService();
const usgsEarthquakeRouter = express.Router();
app.use('/api/earthquakes', createUsgsEarthquakeRoutes(usgsEarthquakeRouter, usgsEarthquakeService));
app.locals.usgsEarthquakeService = usgsEarthquakeService;

const nasaEonetService = new NasaEonetService();
const nasaEonetRouter = express.Router();
app.use('/api/events', createNasaEonetRoutes(nasaEonetRouter, nasaEonetService));
app.locals.nasaEonetService = nasaEonetService;

if (resolveOpenAqApiKey()) {
  const openAqService = new OpenAqService();
  const openAqRouter = express.Router();
  app.use('/api/openaq', createOpenAqRoutes(openAqRouter, openAqService));
  app.locals.openAqService = openAqService;
} else {
  console.warn('OPENAQ_API_KEY not set. OpenAQ routes (/api/openaq) will not be registered.');
}

const globalForestWatchService = new GlobalForestWatchService();
const globalForestWatchRouter = express.Router();
app.use('/api/deforestation', createGlobalForestWatchRoutes(globalForestWatchRouter, globalForestWatchService));
app.locals.globalForestWatchService = globalForestWatchService;

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

    // NASA Sea Level / ice-melt
    const nasaSeaLevelService = new NasaSeaLevelService();
    nasaSeaLevelService.startSync();
    app.locals.nasaSeaLevelService = nasaSeaLevelService;
    const nasaSeaLevelRouter = express.Router();
    app.use('/api/ice-melt', createNasaSeaLevelRoutes(nasaSeaLevelRouter, nasaSeaLevelService));
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Placeholder routes for other APIs mentioned in README.md
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
  const seaLevelSyncStatus = app.locals.nasaSeaLevelService ? app.locals.nasaSeaLevelService.getSyncStatus() : null;

  res.status(200).json({
    status: 'healthy',
    mongodb: mongoStatus,
    fireSync: fireSyncStatus,
    gistempSync: gistempSyncStatus,
    seaLevelSync: seaLevelSyncStatus,
    openMeteo: { mode: 'on-demand', basePath: '/api/meteo' },
    usgsEarthquakes: { mode: 'on-demand', basePath: '/api/earthquakes' },
    nasaEonet: { mode: 'on-demand', basePath: '/api/events', apiVersion: '2.1' },
    openAq: app.locals.openAqService
      ? { enabled: true, mode: 'on-demand', basePath: '/api/openaq', apiVersion: '3' }
      : { enabled: false, basePath: '/api/openaq', hint: 'Set OPENAQ_API_KEY in .env' },
    globalForestWatch: {
      mode: 'on-demand',
      basePath: '/api/deforestation',
      queryRequiresKey: true,
      hasApiKey: app.locals.globalForestWatchService
        ? app.locals.globalForestWatchService.hasApiKey()
        : false,
      apiOriginEnvSet: Boolean(process.env.GFW_API_ORIGIN?.trim())
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
