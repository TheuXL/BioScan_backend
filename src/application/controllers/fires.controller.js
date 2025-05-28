const firesService = require('../services/fires.service');

/**
 * Controller for handling fire-related API endpoints
 */
const firesController = {
  /**
   * Get active fires data from NASA FIRMS
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  getActiveFires: async (req, res) => {
    try {
      const firesData = await firesService.getActiveFires();
      res.status(200).json(firesData);
    } catch (error) {
      console.error('Error fetching active fires data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch active fires data',
        message: error.message 
      });
    }
  },

  /**
   * Get active fires filtered by geographic region
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Promise<void>}
   */
  getFiresByRegion: async (req, res) => {
    try {
      const { region } = req.query;
      
      if (!region) {
        return res.status(400).json({ 
          error: 'Missing required query parameter: region' 
        });
      }

      const firesData = await firesService.getFiresByRegion(region);
      res.status(200).json(firesData);
    } catch (error) {
      console.error('Error fetching fires data by region:', error);
      res.status(500).json({ 
        error: 'Failed to fetch fires data by region',
        message: error.message 
      });
    }
  }
};

module.exports = firesController; 