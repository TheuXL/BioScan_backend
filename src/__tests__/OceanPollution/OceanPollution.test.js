require('dotenv').config({ path: '.env' });
const express = require('express');
const request = require('supertest');
const { OceanPollutionService } = require('../../infrastructure/apis/OceanPollution/OceanPollutionService');
const { createOceanPollutionRoutes } = require('../../infrastructure/apis/OceanPollution/OceanPollutionRoutes');
const { EPA_R9_MARINE_DEBRIS_DATASETS } = require('../../infrastructure/apis/OceanPollution/OceanPollutionTypes');

const DATASET = EPA_R9_MARINE_DEBRIS_DATASETS[0];

function createApp() {
  const app = express();
  const router = express.Router();
  app.use('/api/ocean-pollution', createOceanPollutionRoutes(router, new OceanPollutionService()));
  return app;
}

describe('Ocean Pollution — integração real EPA R9 (sem mocks)', () => {
  let service;

  beforeEach(() => {
    service = new OceanPollutionService();
  });

  test('getMapServerMetadata devolve layers', async () => {
    const data = await service.getMapServerMetadata(DATASET);
    expect(data).toBeDefined();
    expect(data).toHaveProperty('layers');
    expect(Array.isArray((data).layers)).toBe(true);
  }, 60000);

  test('queryLayerGeoJson devolve FeatureCollection', async () => {
    const data = await service.queryLayerGeoJson(DATASET, 1, { resultRecordCount: 2 });
    expect(data).toMatchObject({ type: 'FeatureCollection' });
    expect(Array.isArray(data.features)).toBe(true);
    expect(data.features.length).toBeGreaterThan(0);
    expect(data.features.length).toBeLessThanOrEqual(2);
    const g = data.features[0].geometry;
    expect(g.type).toBe('Point');
    expect(Array.isArray(g.coordinates)).toBe(true);
    expect(g.coordinates.length).toBe(2);
  }, 60000);
});

describe('Ocean Pollution — rotas Express', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('GET / devolve descoberta com datasets', async () => {
    const res = await request(app).get('/api/ocean-pollution/').expect(200);
    expect(res.body.basePath).toBe('/api/ocean-pollution');
    expect(res.body.datasets).toEqual(expect.arrayContaining([DATASET]));
    expect(res.body.requiresApiKey).toBe(false);
  }, 15000);

  test('GET metadata devolve 200', async () => {
    const res = await request(app)
      .get(`/api/ocean-pollution/epa-r9/${DATASET}/metadata`)
      .expect(200);
    expect(res.body).toHaveProperty('layers');
  }, 60000);

  test('GET geojson com limit', async () => {
    const res = await request(app)
      .get(`/api/ocean-pollution/epa-r9/${DATASET}/layers/1/geojson`)
      .query({ limit: '2' })
      .expect(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(res.body.features.length).toBe(2);
  }, 60000);

  test('GET geojson com dataset inválido devolve 400', async () => {
    await request(app)
      .get('/api/ocean-pollution/epa-r9/UnknownDataset/layers/1/geojson')
      .expect(400);
  }, 15000);
});
