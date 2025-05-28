const express = require('express');
const router = express.Router();
const deforestationController = require('../../../application/controllers/deforestation.controller');

/**
 * @route GET /api/deforestation
 * @desc Get deforestation data from Global Forest Watch or similar
 * @access Public
 */
router.get('/', deforestationController.getDeforestationData);

/**
 * @route GET /api/deforestation/by-country
 * @desc Get deforestation data filtered by country
 * @access Public
 */
router.get('/by-country', deforestationController.getDeforestationByCountry);

module.exports = router; 