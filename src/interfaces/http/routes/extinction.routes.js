const express = require('express');
const router = express.Router();
const extinctionController = require('../../../application/controllers/extinction.controller');

/**
 * @route GET /api/extinction
 * @desc Get data on endangered species
 * @access Public
 */
router.get('/', extinctionController.getEndangeredSpeciesData);

/**
 * @route GET /api/extinction/by-region
 * @desc Get endangered species data by geographic region
 * @access Public
 */
router.get('/by-region', extinctionController.getEndangeredSpeciesByRegion);

/**
 * @route GET /api/extinction/critically-endangered
 * @desc Get data on critically endangered species
 * @access Public
 */
router.get('/critically-endangered', extinctionController.getCriticallyEndangeredSpecies);

module.exports = router; 