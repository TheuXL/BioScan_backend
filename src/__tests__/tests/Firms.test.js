require('dotenv').config({ path: '.env' });
const NasaFireApi = require('../../infrastructure/apis/NASA/NasaFire');

describe('NASA FIRMS API', () => {
  let nasaFireApi;

  beforeAll(() => {
    // Ensure the API key is available from .env
    if (!process.env.MAP_KEY) {
      throw new Error('MAP_KEY is not defined in the .env file.');
    }
    nasaFireApi = new NasaFireApi({ apiKey: process.env.MAP_KEY });
  });

  test('should fetch active fires data and return GeoJSON format', async () => {
    // This test makes a real API call and checks the structure of the response.
    // In a production scenario, you might mock the API call for faster, more reliable tests.
    
    const firesData = await nasaFireApi.getActiveFires();

    expect(firesData).toBeDefined();
    expect(typeof firesData).toBe('object');
    expect(firesData).toHaveProperty('type');
    expect(firesData.type).toBe('FeatureCollection');
    expect(firesData).toHaveProperty('features');
    expect(Array.isArray(firesData.features)).toBe(true);
    // Check if there's at least one feature and its basic structure
    if (firesData.features.length > 0) {
      const firstFeature = firesData.features[0];
      expect(firstFeature).toHaveProperty('type');
      expect(firstFeature.type).toBe('Feature');
      expect(firstFeature).toHaveProperty('geometry');
      expect(firstFeature.geometry).toHaveProperty('type');
      expect(firstFeature.geometry).toHaveProperty('coordinates');
      expect(Array.isArray(firstFeature.geometry.coordinates)).toBe(true);
      expect(firstFeature).toHaveProperty('properties');
      expect(typeof firstFeature.properties).toBe('object');
    }
  }, 30000); // Increase timeout for API call

  // You can add more tests here, e.g., for specific regions or error handling
});
