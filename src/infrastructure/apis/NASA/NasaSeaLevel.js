const axios = require('axios');

/**
 * API client for fetching NASA Sea Level Change data.
 * This client uses an intermediate public API that sources its data from NASA.
 * The original NASA data is available at https://sealevel.nasa.gov/data/
 * The public API provides this data in a more accessible JSON format.
 *
 * @see https://api.climatetools.org/
 */
class NasaSeaLevelApi {
  /**
   * Creates an instance of the NasaSeaLevelApi.
   * @param {object} [config] - The configuration for the API client.
   * @param {string} [config.baseUrl='https://api.climatetools.org'] - The base URL for the climate tools API.
   */
  constructor({ baseUrl = 'https://api.climatetools.org' } = {}) {
    this.client = axios.create({
      baseURL: baseUrl,
    });
  }

  /**
   * Fetches global mean sea level variation data.
   *
   * @returns {Promise<object>} A promise that resolves to the sea level data.
   * @throws {Error} If the API request fails.
   */
  async getGlobalSeaLevel() {
    try {
      const response = await this.client.get('/sea-level');

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Failed to fetch sea level data. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching sea level data:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      throw new Error('Could not fetch sea level data.');
    }
  }
}

module.exports = NasaSeaLevelApi;
