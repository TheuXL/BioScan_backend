require('dotenv').config({ path: '.env' });
const express = require('express');
const request = require('supertest');
const { UsgsEarthquakeService } = require('../../infrastructure/apis/UsgsEarthquake/UsgsEarthquakeService');
const { OceanPollutionService } = require('../../infrastructure/apis/OceanPollution/OceanPollutionService');
const { createGlobeRoutes } = require('../../infrastructure/apis/Globe/GlobeRoutes');
const { createGlobeFireRoutes } = require('../../infrastructure/apis/Globe/GlobeFireRoutes');
const { createGlobeOceanRoutes } = require('../../infrastructure/apis/Globe/GlobeOceanRoutes');

const deps = () => ({
  usgs: new UsgsEarthquakeService(),
  ocean: new OceanPollutionService()
});

/**
 * Contrato Globe sobre router isolado — descoberta local; sismos com USGS real (sem mocks).
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
      tipoValoresGlobe: expect.arrayContaining(['incendio', 'sismo']),
      limiteGlobo: { padrao: 150, min: 1, max: 500 }
    });
    expect(Array.isArray(res.body.camadas)).toBe(true);
    expect(res.body.camadas.length).toBeGreaterThanOrEqual(4);
    const paths = res.body.camadas.map((c) => c.caminho);
    expect(paths).toEqual(
      expect.arrayContaining([
        '/api/fire/nasa',
        '/api/globe/especies-ameacadas',
        '/api/globe/sismos',
        '/api/ocean/epa'
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
});
