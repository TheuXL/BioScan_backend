const express = require('express');
const router = express.Router();
const iceMeltController = require('../../../application/controllers/ice-melt.controller');

/**
 * @route GET /api/ice-melt
 * @desc Get ice melt data from polar regions
 * @access Public
 */
router.get('/', iceMeltController.getIceMeltData);

/**
 * @route GET /api/ice-melt/arctic
 * @desc Get Arctic-specific ice melt data
 * @access Public
 */
router.get('/arctic', iceMeltController.getArcticIceMeltData);

/**
 * @route GET /api/ice-melt/antarctic
 * @desc Get Antarctic-specific ice melt data
 * @access Public
 */
router.get('/antarctic', iceMeltController.getAntarcticIceMeltData);

module.exports = router; 