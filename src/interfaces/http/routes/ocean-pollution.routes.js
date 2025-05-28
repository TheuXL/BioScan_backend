const express = require('express');
const router = express.Router();
const oceanPollutionController = require('../../../application/controllers/ocean-pollution.controller');

/**
 * @route GET /api/ocean-pollution
 * @desc Get ocean pollution and marine debris data
 * @access Public
 */
router.get('/', oceanPollutionController.getOceanPollutionData);

/**
 * @route GET /api/ocean-pollution/hotspots
 * @desc Get ocean pollution hotspots
 * @access Public
 */
router.get('/hotspots', oceanPollutionController.getOceanPollutionHotspots);

module.exports = router; 