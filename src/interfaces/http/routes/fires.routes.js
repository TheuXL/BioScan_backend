const express = require('express');
const router = express.Router();
const firesController = require('../../../application/controllers/fires.controller');

/**
 * @route GET /api/fires
 * @desc Get active fires data from NASA FIRMS
 * @access Public
 */
router.get('/', firesController.getActiveFires);

/**
 * @route GET /api/fires/by-region
 * @desc Get active fires filtered by geographic region
 * @access Public
 */
router.get('/by-region', firesController.getFiresByRegion);

module.exports = router; 