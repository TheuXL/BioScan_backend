require('dotenv').config({ path: '.env' });
const { UsgsEarthquakeService } = require('../../infrastructure/apis/UsgsEarthquake/UsgsEarthquakeService');
const { API_CONFIG } = require('../../infrastructure/apis/UsgsEarthquake/UsgsEarthquakeTypes');

/**
 * Integração real com USGS FDSNWS / feeds — sem jest.mock nem corpos HTTP simulados.
 */
describe('USGS Earthquakes — integração real (sem mocks)', () => {
  let service;

  beforeEach(() => {
    service = new UsgsEarthquakeService();
  });

  test('queryEvents devolve FeatureCollection GeoJSON real', async () => {
    expect(API_CONFIG.QUERY).toContain('earthquake.usgs.gov');

    const data = await service.queryEvents({
      starttime: '2024-01-01',
      endtime: '2024-01-03',
      minmagnitude: '5',
      limit: '3'
    });

    expect(data).toBeDefined();
    expect(data).toHaveProperty('type', 'FeatureCollection');
    expect(data).toHaveProperty('features');
    expect(Array.isArray(data.features)).toBe(true);
    expect(data.features.length).toBeGreaterThan(0);
    expect(data.features[0]).toHaveProperty('geometry');
    expect(data.features[0].geometry).toHaveProperty('type', 'Point');
    expect(data.features[0].geometry.coordinates).toHaveLength(3);
    expect(data.features[0]).toHaveProperty('properties');
    expect(data.features[0].properties).toHaveProperty('mag');
    expect(data.features[0].properties).toHaveProperty('time');
  }, 30000);

  test('getFeed devolve GeoJSON real (significant_week)', async () => {
    expect(API_CONFIG.FEED_BASE).toContain('feed/v1.0/summary');

    const data = await service.getFeed('significant_week');

    expect(data).toHaveProperty('type', 'FeatureCollection');
    expect(data).toHaveProperty('features');
    expect(Array.isArray(data.features)).toBe(true);
  }, 30000);

  test('parseExpressQuery repassa parâmetros — resposta vem da API', async () => {
    const params = service.parseExpressQuery({
      starttime: '2024-06-01',
      endtime: '2024-06-02',
      minmagnitude: '6',
      limit: '2',
      orderby: ['time']
    });

    const data = await service.queryEvents(params);

    expect(params.orderby).toBe('time');
    expect(data).toHaveProperty('features');
    expect(data.features.length).toBeLessThanOrEqual(2);
  }, 30000);
});
