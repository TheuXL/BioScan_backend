const express = require('express');
const router = express.Router();
const globalTemperatureController = require('../../../application/controllers/global-temperature.controller');

/**
 * @route GET /api/global-temperature
 * @desc Get global temperature data
 * @access Public
 */
router.get('/', globalTemperatureController.getGlobalTemperatureData);

/**
 * @route GET /api/global-temperature/historical
 * @desc Get historical global temperature data
 * @access Public
 */
router.get('/historical', globalTemperatureController.getHistoricalTemperatureData);

module.exports = router; 