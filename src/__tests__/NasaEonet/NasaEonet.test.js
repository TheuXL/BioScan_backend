require('dotenv').config({ path: '.env' });
const { NasaEonetService } = require('../../infrastructure/apis/NASA/NasaEonet/NasaEonetService');
const { API_CONFIG } = require('../../infrastructure/apis/NASA/NasaEonet/NasaEonetTypes');

/**
 * Integração real com NASA EONET v2.1 — sem jest.mock nem corpos HTTP simulados.
 */
describe('NASA EONET — integração real (sem mocks)', () => {
  let service;

  beforeEach(() => {
    service = new NasaEonetService();
  });

  test('getEvents devolve JSON real com eventos e geometrias', async () => {
    expect(API_CONFIG.EVENTS).toContain('eonet.gsfc.nasa.gov');

    const data = await service.getEvents({ limit: '5', days: '30', status: 'open' });

    expect(data).toBeDefined();
    expect(data).toHaveProperty('events');
    expect(Array.isArray(data.events)).toBe(true);
    if (data.events.length > 0) {
      const ev = data.events[0];
      expect(ev).toHaveProperty('id');
      expect(ev).toHaveProperty('title');
      expect(ev).toHaveProperty('geometries');
      expect(Array.isArray(ev.geometries)).toBe(true);
    }
  }, 30000);

  test('getCategories devolve catálogo real', async () => {
    const data = await service.getCategories();

    expect(data).toHaveProperty('categories');
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.categories[0]).toHaveProperty('id');
    expect(data.categories[0]).toHaveProperty('title');
  }, 30000);

  test('getCategoryEvents devolve eventos reais para categoria vulcões (id 12)', async () => {
    const data = await service.getCategories('12', { limit: '3', days: '90' });

    expect(data).toHaveProperty('events');
    expect(Array.isArray(data.events)).toBe(true);
  }, 30000);

  test('getSources devolve catálogo real', async () => {
    const data = await service.getSources();

    expect(data).toHaveProperty('sources');
    expect(Array.isArray(data.sources)).toBe(true);
    expect(data.sources.length).toBeGreaterThan(0);
  }, 30000);

  test('getLayers devolve metadados reais', async () => {
    const data = await service.getLayers();

    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  }, 30000);

  test('parseExpressQuery com source múltiplo — resposta vem da API', async () => {
    const params = service.parseExpressQuery({
      limit: '2',
      days: '14',
      status: 'open',
      source: ['InciWeb', 'EO']
    });

    const data = await service.getEvents(params);

    expect(params.source).toBe('InciWeb,EO');
    expect(data).toHaveProperty('events');
    expect(data.events.length).toBeLessThanOrEqual(2);
  }, 30000);
});
