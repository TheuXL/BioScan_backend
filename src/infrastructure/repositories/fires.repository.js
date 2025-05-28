const axios = require('axios');
const { FIRMS_API_KEY } = process.env;

/**
 * Repository for handling external API calls for fire data
 */
const firesRepository = {
  /**
   * Fetch active fires data from NASA FIRMS API
   * @returns {Promise<Array>} - Raw fires data from the API
   */
  fetchActiveFires: async () => {
    try {
      // Note: This is a placeholder. Replace with actual NASA FIRMS API endpoint
      // Documentation: https://firms.modaps.eosdis.nasa.gov/api/
      const response = await axios.get(`https://firms.modaps.eosdis.nasa.gov/api/area/json/${FIRMS_API_KEY}/VIIRS_SNPP_NRT/world/1`);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching from FIRMS API:', error);
      throw new Error(`Failed to fetch fire data: ${error.message}`);
    }
  },

  /**
   * Fetch active fires data from NASA FIRMS API filtered by region
   * @param {string} region - Geographic region to filter by
   * @returns {Promise<Array>} - Raw fires data from the API for the specified region
   */
  fetchFiresByRegion: async (region) => {
    try {
      // Note: This is a placeholder. Replace with actual NASA FIRMS API endpoint
      // Documentation: https://firms.modaps.eosdis.nasa.gov/api/
      const response = await axios.get(`https://firms.modaps.eosdis.nasa.gov/api/area/json/${FIRMS_API_KEY}/VIIRS_SNPP_NRT/${region}/1`);
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching from FIRMS API for region ${region}:`, error);
      throw new Error(`Failed to fetch fire data for region ${region}: ${error.message}`);
    }
  }
};

module.exports = firesRepository; 