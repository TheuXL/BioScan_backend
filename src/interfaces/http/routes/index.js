const express = require('express');
const router = express.Router();

// Import individual route files
const firesRoutes = require('./fires.routes');
const deforestationRoutes = require('./deforestation.routes');
const oceanPollutionRoutes = require('./ocean-pollution.routes');
const globalTemperatureRoutes = require('./global-temperature.routes');
const iceMeltRoutes = require('./ice-melt.routes');
const extinctionRoutes = require('./extinction.routes');

// Register routes
router.use('/fires', firesRoutes);
router.use('/deforestation', deforestationRoutes);
router.use('/ocean-pollution', oceanPollutionRoutes);
router.use('/global-temperature', globalTemperatureRoutes);
router.use('/ice-melt', iceMeltRoutes);
router.use('/extinction', extinctionRoutes);

module.exports = router; 