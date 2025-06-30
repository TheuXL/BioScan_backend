const axios = require('axios');

/**
 * NASA FIRMS (Fire Information for Resource Management System) API client.
 *
 * This class provides methods to interact with the NASA FIRMS API to fetch active fire data.
 * It uses the Web Feature Service (WFS) to get data in JSON format.
 *
 * @see https://firms.modaps.eosdis.nasa.gov/web-services/
 */
class NasaFireApi {
  /**
   * Creates an instance of the NasaFireApi.
   * @param {object} config - The configuration for the API client.
   * @param {string} config.apiKey - Your NASA FIRMS API key (MAP_KEY).
   * @param {string} [config.baseUrl='https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/'] - The base URL for the FIRMS WFS API.
   */
  constructor({ apiKey, baseUrl = 'https://firms.modaps.eosdis.nasa.gov/mapserver/wfs/' }) {
    if (!apiKey) {
      throw new Error('NASA FIRMS API key is required.');
    }
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: baseUrl,
    });
  }

  /**
   * Fetches active fire data for a specific region and data source.
   *
   * @param {object} options - The options for fetching fire data.
   * @param {string} [options.region='Canada'] - The region to fetch data for (e.g., 'Global', 'North_America').
   * @param {string} [options.source='MODIS_NRT'] - The satellite data source (e.g., 'VIIRS_SNPP_NRT', 'MODIS_NRT').
   * @returns {Promise<object>} A promise that resolves to the fire data in GeoJSON format.
   * @throws {Error} If the API request fails.
   */
  async getActiveFires({ region = 'Canada', source = 'MODIS_NRT' } = {}) {
    try {
      // Map source to the correct typeName format expected by FIRMS WFS
      let typeName = '';
      switch (source) {
        case 'VIIRS_SNPP_NRT':
          typeName = 'ms:fires_snpp_24hrs';
          break;
        case 'MODIS_NRT':
          typeName = 'ms:fires_modis_24hrs';
          break;
        // Add other cases for different sources if needed
        default:
          throw new Error(`Unsupported source: ${source}`);
      }
      
      // The API key is part of the path for WFS GetFeature requests
      const requestPath = `/${region}/${this.apiKey}/`;

      const response = await this.client.get(requestPath, {
        params: {
          SERVICE: 'WFS',
          VERSION: '2.0.0', // Using 2.0.0 as per documentation for GeoJSON examples
          REQUEST: 'GetFeature',
          typeName: typeName,
          outputFormat: 'application/json; subtype=geojson', // Specific for GeoJSON output
          SRSNAME: 'urn:ogc:def:crs:EPSG::4326',
          BBOX: '-90,-180,90,180,urn:ogc:def:crs:EPSG::4326'
        }
      });

      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Failed to fetch fire data. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching NASA FIRMS data:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
      throw new Error('Could not fetch active fire data from NASA FIRMS.');
    }
  }
}

module.exports = NasaFireApi;
