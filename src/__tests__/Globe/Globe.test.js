require('dotenv').config({ path: '.env' });
const express = require('express');
const request = require('supertest');
const { UsgsEarthquakeService } = require('../../infrastructure/apis/UsgsEarthquake/UsgsEarthquakeService');
const { OceanPollutionService } = require('../../infrastructure/apis/OceanPollution/OceanPollutionService');
const { createGlobeRoutes } = require('../../infrastructure/apis/Globe/GlobeRoutes');
const { createGlobeFireRoutes } = require('../../infrastructure/apis/Globe/GlobeFireRoutes');
const { createGlobeOceanRoutes } = require('../../infrastructure/apis/Globe/GlobeOceanRoutes');
const { GlimsService } = require('../../infrastructure/apis/GLIMS/GlimsService');

const deps = () => ({
  usgs: new UsgsEarthquakeService(),
  ocean: new OceanPollutionService(),
  glims: new GlimsService()
});

/**
 * Contrato Globe sobre router isolado —
 * integrações reais com USGS e GLIMS (sem mocks).
 */
describe('Globe — contrato único por camada', () => {
  let app;

  beforeEach(() => {
    app = express();
    const globeRouter = express.Router();
    createGlobeRoutes(globeRouter, deps());
    const fireRouter = express.Router();
    createGlobeFireRoutes(fireRouter, deps());
    const oceanRouter = express.Router();
    createGlobeOceanRoutes(oceanRouter, deps());
    app.use('/api/globe', globeRouter);
    app.use('/api/fire', fireRouter);
    app.use('/api/ocean', oceanRouter);
  });

  test('GET /api/globe/ devolve Schema e lista de camadas', async () => {
    const res = await request(app).get('/api/globe/').expect(200);

    expect(res.body).toMatchObject({
      schemaVersion: '1.0',
      tipoValoresGlobe: expect.arrayContaining(['incendio', 'sismo', 'geleira']),
      limiteGlobo: expect.objectContaining({ padrao: 500, min: 1, max: 50000, offset: true })
    });
    expect(Array.isArray(res.body.camadas)).toBe(true);
    expect(res.body.camadas.length).toBeGreaterThanOrEqual(5);
    const paths = res.body.camadas.map((c) => c.caminho);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/fire/nasa',
        '/api/globe/especies-ameacadas',
        '/api/globe/sismos',
        '/api/ocean/epa',
        '/api/globe/geleiras'
      ])
    );
  });

  test('GET /api/fire/ lista fornecedor NASA', async () => {
    const res = await request(app).get('/api/fire/').expect(200);
    expect(res.body.dominio).toBe('fire');
    expect(res.body.fornecedores.map((f) => f.id)).toContain('nasa');
    expect(res.body.fornecedores.some((f) => f.caminho === '/api/fire/nasa')).toBe(true);
  });

  test('GET /api/ocean/ lista fornecedor EPA', async () => {
    const res = await request(app).get('/api/ocean/').expect(200);
    expect(res.body.dominio).toBe('ocean');
    expect(res.body.fornecedores.map((f) => f.id)).toContain('epa');
    expect(res.body.fornecedores.some((f) => f.caminho === '/api/ocean/epa')).toBe(true);
  });

  test('GET /api/globe/sismos normaliza pontos GeoJSON USGS real', async () => {
    const res = await request(app)
      .get('/api/globe/sismos')
      .query({
        limit: '2',
        starttime: '2024-06-01',
        endtime: '2024-06-03',
        minmagnitude: '6'
      })
      .expect(200);

    expect(res.body).toMatchObject({
      schemaVersion: '1.0',
      camada: 'sismo',
      count: expect.any(Number),
      pontos: expect.any(Array)
    });

    expect(res.body.count).toBeLessThanOrEqual(2);
    if (res.body.pontos.length > 0) {
      const p = res.body.pontos[0];
      expect(p).toHaveProperty('lat');
      expect(p).toHaveProperty('lon');
      expect(p).toHaveProperty('tipo', 'sismo');
      expect(p).toHaveProperty('momento');
      expect(p).toHaveProperty('origem');
      expect(p).toHaveProperty('idFonte');
      expect(p).toHaveProperty('severidade');
    }
  }, 45000);

  test('GET /api/globe/sismos limit fora da faixa do globo => 400', async () => {
    await request(app).get('/api/globe/sismos').query({ limit: '99999' }).expect(400);
  });

  test('GET /api/globe/sismos aceita limit elevado (até 50000)', async () => {
    const res = await request(app)
      .get('/api/globe/sismos')
      .query({
        limit: '1000',
        offset: '0',
        starttime: '2024-06-01',
        endtime: '2024-06-02',
        minmagnitude: '6'
      })
      .expect(200);

    expect(res.body.limit).toBe(1000);
    expect(res.body.offset).toBe(0);
    expect(typeof res.body.hasMore).toBe('boolean');
  }, 45000);

  test('GET /api/globe/geleiras normaliza dados GLIMS', async () => {
    const glims = new GlimsService();
    jest.spyOn(glims, 'getLayerGeoJson').mockResolvedValue({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'g1',
          geometry: { type: 'Point', coordinates: [-70.5, -33.4] },
          properties: { glac_name: 'Test Glacier', glac_id: 'TG-1' }
        },
        {
          type: 'Feature',
          id: 'g2',
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-71, -34],
                [-70, -34],
                [-70, -33],
                [-71, -33],
                [-71, -34]
              ]
            ]
          },
          properties: { glacier_name: 'Poly Glacier' }
        }
      ]
    });

    const localDeps = {
      usgs: new UsgsEarthquakeService(),
      ocean: new OceanPollutionService(),
      glims
    };
    const localApp = express();
    const globeRouter = express.Router();
    createGlobeRoutes(globeRouter, localDeps);
    localApp.use('/api/globe', globeRouter);

    const res = await request(localApp)
      .get('/api/globe/geleiras')
      .query({
        limit: '2',
        feature_count: '2'
      })
      .expect(200);

    expect(res.body).toMatchObject({
      schemaVersion: '1.0',
      camada: 'geleira',
      count: 2,
      pontos: expect.any(Array)
    });

    expect(res.body.count).toBeLessThanOrEqual(2);
    expect(res.body).toHaveProperty('offset');
    expect(res.body).toHaveProperty('limit');
    expect(typeof res.body.hasMore).toBe('boolean');

    const p = res.body.pontos[0];
    expect(p).toHaveProperty('lat');
    expect(p).toHaveProperty('lon');
    expect(p).toHaveProperty('tipo', 'geleira');
    expect(p).toHaveProperty('origem');
    expect(p).toHaveProperty('idFonte');
    expect(p).toHaveProperty('severidade');
  });
});
