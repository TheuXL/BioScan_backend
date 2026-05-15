require('dotenv').config({ path: '.env' });
const { OpenAqService, resolveOpenAqApiKey } = require('../../infrastructure/apis/OpenAq/OpenAqService');
const { API_CONFIG } = require('../../infrastructure/apis/OpenAq/OpenAqTypes');

const hasKey = Boolean(resolveOpenAqApiKey());

/**
 * Integração real OpenAQ v3 — requer OPENAQ_API_KEY no .env. Sem mocks de resposta.
 */
const describeOpenAq = hasKey ? describe : describe.skip;

describeOpenAq('OpenAQ v3 — integração real (sem mocks)', () => {
  let service;

  beforeEach(() => {
    service = new OpenAqService();
  });

  test('getLocationById devolve meta + results (ex.: Nova Deli 8118)', async () => {
    expect(API_CONFIG.BASE_URL).toContain('api.openaq.org/v3');

    const data = await service.getLocationById('8118');

    expect(data).toHaveProperty('meta');
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
    const loc = data.results[0];
    expect(loc).toHaveProperty('id', 8118);
    expect(loc).toHaveProperty('coordinates');
    expect(loc.coordinates).toHaveProperty('latitude');
    expect(loc.coordinates).toHaveProperty('longitude');
  }, 30000);

  test('getLocationLatest devolve medições recentes', async () => {
    const data = await service.getLocationLatest('8118');

    expect(data).toHaveProperty('meta');
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  }, 30000);

  test('getLocations com limit devolve lista real', async () => {
    const data = await service.getLocations({ limit: '3' });

    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeLessThanOrEqual(3);
  }, 30000);

  test('getParameters devolve catálogo real', async () => {
    const data = await service.getParameters();

    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
  }, 30000);
});

if (!hasKey) {
  console.warn(
    '[OpenAq tests] OPENAQ_API_KEY ausente — suíte ignorada. Defina a chave no .env (https://explore.openaq.org/register).'
  );
}
