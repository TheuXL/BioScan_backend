require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const NasaFireApi = require('./infrastructure/apis/NASA/NasaFire');
const NasaGistempApi = require('./infrastructure/apis/NASA/NasaGistemp');
const NasaSeaLevelApi = require('./infrastructure/apis/NASA/NasaSeaLevel');
const FireModel = require('./infrastructure/database/models/FireModel');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API Clients (instantiate with environment variables)
const nasaFireApi = new NasaFireApi({ apiKey: process.env.MAP_KEY });
const nasaGistempApi = new NasaGistempApi({ apiKey: process.env.NOAA_API_KEY });
const nasaSeaLevelApi = new NasaSeaLevelApi();

// Routes
app.get('/api/fires', async (req, res) => {
  try {
    const firesData = await nasaFireApi.getActiveFires();
    // Save data to MongoDB
    const newFireEntry = new FireModel(firesData);
    await newFireEntry.save();
    console.log('Fire data saved to MongoDB.');
    res.json(firesData);
  } catch (error) {
    console.error('Error in /api/fires:', error.message);
    res.status(500).json({ message: 'Could not fetch or save active fire data.' });
  }
});

app.get('/api/fires/by-region', async (req, res) => {
  try {
    const { region } = req.query;
    if (!region) {
      return res.status(400).json({ message: 'Region parameter is required.' });
    }
    const firesData = await nasaFireApi.getActiveFires({ region });
    // Save data to MongoDB
    const newFireEntry = new FireModel(firesData);
    await newFireEntry.save();
    console.log('Fire data by region saved to MongoDB.');
    res.json(firesData);
  } catch (error) {
    console.error('Error in /api/fires/by-region:', error.message);
    res.status(500).json({ message: 'Could not fetch or save fire data by region.' });
  }
});

app.get('/api/global-temperature', async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const temperatureData = await nasaGistempApi.getGlobalTemperatureAnomalies({ startDate, endDate, limit });
    res.json(temperatureData);
  } catch (error) {
    console.error('Error in /api/global-temperature:', error.message);
    res.status(500).json({ message: 'Could not fetch global temperature data.' });
  }
});

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
  res.status(200).send('API is healthy');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 