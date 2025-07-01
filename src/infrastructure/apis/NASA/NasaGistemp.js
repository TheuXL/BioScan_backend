const axios = require('axios');

/**
 * Client for NASA GISTEMP and NOAA Climate Data.
 * This class primarily interacts with the NOAA NCEI API, which provides access to various climate datasets, including global temperature data that aligns with NASA's GISTEMP findings.
 *
 * @see https://www.ncei.noaa.gov/support/access-data-service-api-user-documentation
 */
class NasaGistempApi {
    /**
   * Creates an instance of the NasaGistempApi.
   * Note: An API token from NOAA is required to use this service.
   * @param {object} config - The configuration for the API client.
   * @param {string} config.apiKey - Your NOAA NCEI API token.
   * @param {string} [config.baseUrl='https://www.ncei.noaa.gov/cdo-web/api/v2'] - The base URL for the API.
   */
  constructor({ apiKey, baseUrl = 'https://www.ncei.noaa.gov/cdo-web/api/v2' }) {
    if (!apiKey) {
      // The API documentation states a token is required. It can be obtained for free from the NCEI website.
      throw new Error('NOAA NCEI API token is required.');
    }
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        token: this.apiKey,
      },
    });
  }

  /**
   * Fetches global temperature anomalies.
   * This uses the 'NOAAGLOBALTEMP' dataset, which provides monthly global land and ocean temperature anomalies from 1850 to the present.
   *
   * @param {object} options - The options for fetching temperature data.
   * @param {string} options.startDate - Start date in YYYY-MM-DD format.
   * @param {string} options.endDate - End date in YYYY-MM-DD format.
   * @param {number} [options.limit=1000] - The maximum number of results to return (max is 1000).
   * @returns {Promise<object>} A promise that resolves to the temperature data from the API.
   * @throws {Error} If the API request fails or if required parameters are missing.
   */
  async getGlobalTemperatureAnomalies({ startDate, endDate, limit = 1000 }) {
    if (!startDate || !endDate) {
      throw new Error('Both startDate and endDate are required.');
    }

    try {
      const response = await this.client.get('/data', {
        params: {
          datasetid: 'NOAAGLOBALTEMP',
          startdate: startDate,
          enddate: endDate,
          limit: Math.min(limit, 1000), // API max limit is 1000
          sortfield: 'date',
          sortorder: 'desc'
        },
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Failed to fetch temperature data. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching NOAA NCEI data:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      throw new Error('Could not fetch global temperature data from NOAA NCEI.');
    }
  }
}

module.exports = NasaGistempApi;
