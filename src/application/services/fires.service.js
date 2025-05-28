const axios = require('axios');
const { FIRMS_API_KEY } = process.env;
const firesRepository = require('../../infrastructure/repositories/fires.repository');

/**
 * Service for handling fire-related business logic and API calls
 */
const firesService = {
  /**
   * Get active fires data from NASA FIRMS
   * @returns {Promise<Object>} - Processed fires data
   */
  getActiveFires: async () => {
    try {
      // Use the repository to get the data from the external API
      const firesData = await firesRepository.fetchActiveFires();
      
      // Process and transform the data as needed
      return {
        success: true,
        data: firesData,
        metadata: {
          source: 'NASA FIRMS',
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error in fires service:', error);
      throw error;
    }
  },

  /**
   * Get active fires filtered by geographic region
   * @param {string} region - Geographic region to filter by
   * @returns {Promise<Object>} - Processed fires data for the specified region
   */
  getFiresByRegion: async (region) => {
    try {
      // Use the repository to get the data from the external API
      const firesData = await firesRepository.fetchFiresByRegion(region);
      
      // Process and transform the data as needed
      return {
        success: true,
        data: firesData,
        metadata: {
          source: 'NASA FIRMS',
          region: region,
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Error in fires service for region ${region}:`, error);
      throw error;
    }
  }
};

module.exports = firesService; 