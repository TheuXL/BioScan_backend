require('dotenv').config({ path: '.env' });
const { OpenMeteoService } = require('../../infrastructure/apis/OpenMeteo/OpenMeteoService');
const { API_CONFIG } = require('../../infrastructure/apis/OpenMeteo/OpenMeteoTypes');

/** Coordenadas de teste (Lisboa) — leitura pública Open-Meteo. */
const LAT = '38.72';
const LON = '-9.14';

/**
 * Integração exclusiva com Open-Meteo: sem jest.mock, sem respostas simuladas,
 * sem fixtures de corpo HTTP. Cada asserção sobre dados meteorológicos vem de um GET real.
 */
describe('OpenMeteo — integração real (sem mocks)', () => {
  let service;

  beforeEach(() => {
    service = new OpenMeteoService();
  });

  test('getForecast devolve JSON real (latitude/longitude eco + estrutura típica)', async () => {
    expect(API_CONFIG.FORECAST).toMatch(/^https:\/\//);

    const data = await service.getForecast({
      latitude: LAT,
      longitude: LON,
      forecast_days: '2'
    });

    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
    expect(data).toHaveProperty('latitude');
    expect(data).toHaveProperty('longitude');
    expect(Number(data.latitude)).toBeCloseTo(parseFloat(LAT), 1);
    expect(Number(data.longitude)).toBeCloseTo(parseFloat(LON), 1);
    expect(data).toHaveProperty('generationtime_ms');
    expect(data).toHaveProperty('utc_offset_seconds');
  }, 30000);

  test('getArchive devolve série daily real da API de arquivo', async () => {
    expect(API_CONFIG.ARCHIVE).toContain('archive-api.open-meteo.com');

    const data = await service.getArchive({
      latitude: LAT,
      longitude: LON,
      start_date: '2024-06-01',
      end_date: '2024-06-03',
      daily: 'temperature_2m_max'
    });

    expect(data).toBeDefined();
    expect(data).toHaveProperty('daily');
    expect(data.daily).toHaveProperty('time');
    expect(data.daily).toHaveProperty('temperature_2m_max');
    expect(Array.isArray(data.daily.time)).toBe(true);
  }, 30000);

  test('getAirQuality devolve JSON real da API dedicada', async () => {
    expect(API_CONFIG.AIR_QUALITY).toContain('air-quality-api.open-meteo.com');

    const data = await service.getAirQuality({
      latitude: LAT,
      longitude: LON
    });

    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
    expect(data).toHaveProperty('latitude');
    expect(data).toHaveProperty('longitude');
    expect(data).toHaveProperty('generationtime_ms');
  }, 30000);

  test('parseExpressQuery com arrays envia parâmetros válidos — resposta vem da API', async () => {
    const params = service.parseExpressQuery({
      latitude: LAT,
      longitude: LON,
      forecast_days: '1',
      hourly: ['temperature_2m', 'relative_humidity_2m']
    });

    const data = await service.getForecast(params);

    expect(params.hourly).toBe('temperature_2m,relative_humidity_2m');
    expect(data).toHaveProperty('hourly');
    expect(data.hourly).toHaveProperty('time');
    expect(data.hourly).toHaveProperty('temperature_2m');
    expect(data.hourly).toHaveProperty('relative_humidity_2m');
  }, 30000);
});
