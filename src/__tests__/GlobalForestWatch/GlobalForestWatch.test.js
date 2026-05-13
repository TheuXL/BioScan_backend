require('dotenv').config({ path: '.env' });
const express = require('express');
const request = require('supertest');
const {
  GlobalForestWatchService,
  resolveGfwApiKey
} = require('../../infrastructure/apis/GlobalForestWatch/GlobalForestWatchService');
const { createGlobalForestWatchRoutes } = require('../../infrastructure/apis/GlobalForestWatch/GlobalForestWatchRoutes');
const {
  EXAMPLE_INTEGRATED_ALERTS_DATASET,
  VECTOR_QUERY_SMOKE_DATASET
} = require('../../infrastructure/apis/GlobalForestWatch/GlobalForestWatchTypes');

const hasGfwKey = Boolean(resolveGfwApiKey());

function createGfwApp(service) {
  const app = express();
  const router = express.Router();
  app.use('/api/deforestation', createGlobalForestWatchRoutes(router, service));
  return app;
}

describe('Global Forest Watch — integração real (sem mocks de corpo)', () => {
  let service;

  beforeEach(() => {
    service = new GlobalForestWatchService();
  });

  test('getPing devolve resposta real da GFW', async () => {
    const data = await service.getPing();
    expect(data).toBeDefined();
    expect(typeof data === 'object' && data !== null).toBe(true);
  }, 30000);

  test('getDatasets devolve lista real com campo data', async () => {
    const data = await service.getDatasets();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  }, 60000);

  test('getFields devolve metadados reais (gfw_integrated_alerts / latest)', async () => {
    const data = await service.getFields(EXAMPLE_INTEGRATED_ALERTS_DATASET, 'latest');
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  }, 60000);

  test('hasApiKey reflecte GFW_API_KEY quando definida', () => {
    if (hasGfwKey) {
      expect(service.hasApiKey()).toBe(true);
    } else {
      expect(service.hasApiKey()).toBe(false);
    }
  });
});

describe('Global Forest Watch — serviço sem chave explícita', () => {
  test('queryJson lança se apiKey vazia (simula produção sem env)', async () => {
    const svc = new GlobalForestWatchService({ apiKey: '' });
    expect(svc.hasApiKey()).toBe(false);
    await expect(
      svc.queryJson(EXAMPLE_INTEGRATED_ALERTS_DATASET, 'latest', {
        sql: 'SELECT 1 AS one FROM data LIMIT 1'
      })
    ).rejects.toThrow(/GFW_API_KEY/);
  });
});

const describeQuery = hasGfwKey ? describe : describe.skip;

describeQuery('Global Forest Watch — query/json (requer GFW_API_KEY)', () => {
  let service;

  beforeEach(() => {
    service = new GlobalForestWatchService();
  });

  test('queryJson em dataset vetorial devolve linhas (gadm — sem geostore; alertas raster exigem geometria na GFW)', async () => {
    const sql = 'SELECT gfw_fid, name FROM data LIMIT 2';
    const data = await service.queryJson(VECTOR_QUERY_SMOKE_DATASET, 'latest', { sql });

    expect(data).toBeDefined();
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data.length).toBeLessThanOrEqual(2);

    const row = data.data[0];
    expect(row).toBeDefined();
    expect(row).toHaveProperty('gfw_fid');
    expect(row).toHaveProperty('name');
    expect(typeof row.name === 'string' || row.name === null).toBe(true);
  }, 120000);
});

const describeHttpWithKey = hasGfwKey ? describe : describe.skip;

describeHttpWithKey('Global Forest Watch — rotas Express /api/deforestation (com GFW_API_KEY)', () => {
  let app;

  beforeAll(() => {
    app = createGfwApp(new GlobalForestWatchService());
  });

  test('GET / devolve descoberta e hasApiKeyConfigured true', async () => {
    const res = await request(app).get('/api/deforestation/').expect(200);
    expect(res.body).toMatchObject({
      provider: 'Global Forest Watch Data API',
      basePath: '/api/deforestation',
      hasApiKeyConfigured: true
    });
    expect(res.body.endpoints).toHaveProperty('queryJson');
  }, 15000);

  test('GET query/json com sql devolve 200 e corpo com data', async () => {
    const sql = 'SELECT gfw_fid, name FROM data LIMIT 1';
    const res = await request(app)
      .get(`/api/deforestation/dataset/${VECTOR_QUERY_SMOKE_DATASET}/latest/query/json`)
      .query({ sql })
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
  }, 120000);

  test('GET query/json sem sql devolve 400', async () => {
    await request(app)
      .get(`/api/deforestation/dataset/${EXAMPLE_INTEGRATED_ALERTS_DATASET}/latest/query/json`)
      .expect(400);
  }, 15000);
});

describe('Global Forest Watch — rotas Express sem chave (503 em query)', () => {
  let app;

  beforeAll(() => {
    app = createGfwApp(new GlobalForestWatchService({ apiKey: '' }));
  });

  test('GET / indica hasApiKeyConfigured false', async () => {
    const res = await request(app).get('/api/deforestation/').expect(200);
    expect(res.body.hasApiKeyConfigured).toBe(false);
  }, 15000);

  test('GET query/json devolve 503', async () => {
    const res = await request(app)
      .get(`/api/deforestation/dataset/${EXAMPLE_INTEGRATED_ALERTS_DATASET}/latest/query/json`)
      .query({ sql: 'SELECT 1 FROM data LIMIT 1' })
      .expect(503);
    expect(res.body.message).toMatch(/GFW_API_KEY/);
  }, 15000);
});

if (!hasGfwKey) {
  console.warn(
    '[GFW tests] GFW_API_KEY ausente — testes de query/json e HTTP com chave ignorados. Defina no .env (GFW Data API → Authentication).'
  );
}
