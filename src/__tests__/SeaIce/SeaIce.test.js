const request = require('supertest');
const express = require('express');
const axios = require('axios');

// Importação robusta para evitar erros de tipagem entre TS e JS
const SeaIceRoutesModule = require('../../infrastructure/apis/SeaIce/SeaIceRoutes');
const SeaIceServiceModule = require('../../infrastructure/apis/SeaIce/SeaIceService');

const createSeaIceRoutes = SeaIceRoutesModule.createSeaIceRoutes || SeaIceRoutesModule.default;
const SeaIceService = SeaIceServiceModule.SeaIceService || SeaIceServiceModule.default;

describe('SeaIce module (NSIDC)', () => {
  
  
  function createApp(service = new SeaIceService()) {
    const app = express();
    app.use(express.json());
    const router = express.Router();
    app.use('/api/sea-ice', createSeaIceRoutes(router, service));
    return app;
  }

  
  test('should expose a discovery endpoint with NSIDC metadata', async () => {
    const app = createApp();
    const response = await request(app).get('/api/sea-ice');

    expect(response.status).toBe(200);
    expect(response.body.provider).toContain('NSIDC');
    expect(response.body.basePath).toBe('/api/sea-ice');
  });

  
  test('should reject invalid layer names via validateSeaIceLayerName', async () => {
    const app = createApp();
    const response = await request(app).get('/api/sea-ice/layers/camada_inexistente/geojson');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('layerName invalido');
  });

 
  test('should return XML capabilities from NSIDC server', async () => {
    const xmlMock = '<?xml version="1.0" encoding="UTF-8"?><WMS_Capabilities />';
    const service = {
      getCapabilities: jest.fn().mockResolvedValue(xmlMock)
    };
    const app = createApp(service);

    const response = await request(app).get('/api/sea-ice/capabilities');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.text).toBe(xmlMock);
  });

  
  test('should reject bbox with coordinates out of range (-180,180 / -90,90)', async () => {
    const app = createApp();
    
    const response = await request(app).get('/api/sea-ice/layers/extent-north/geojson?bbox=-200,60,180,90');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('bbox invalido');
  });

  
  test('should reject bbox with missing parts', async () => {
    const app = createApp();
    
    const response = await request(app).get('/api/sea-ice/layers/extent-north/geojson?bbox=-180,60,180');

    expect(response.status).toBe(400);
  });

  
  test('should reject feature_count if it exceeds the limit in SeaIceTypes', async () => {
    const app = createApp();
    const response = await request(app).get('/api/sea-ice/layers/extent-north/geojson?feature_count=5000');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('feature_count');
  });


  test('should pass query parameters correctly to SeaIceService', async () => {
    const service = {
      getLayerGeoJson: jest.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] }),
      resolveLayer: jest.fn().mockReturnValue('NSIDC:técnico_camada')
    };
    const app = createApp(service);

    await request(app).get('/api/sea-ice/layers/extent-north/geojson?bbox=-10,60,10,80&feature_count=100');

    expect(service.getLayerGeoJson).toHaveBeenCalledWith('extent-north', expect.objectContaining({
      bbox: '-10,60,10,80',
      feature_count: 100
    }));
  });


  test('SeaIceService should call NSIDC servers with WFS parameters', async () => {
    const getSpy = jest.fn().mockResolvedValue({ status: 200, data: { features: [] } });
    const createSpy = jest.spyOn(axios, 'create').mockReturnValue({ get: getSpy });

    const service = new SeaIceService();
    await service.getLayerGeoJson('extent-north');

    
    expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('nsidc.org'), expect.any(Object));
    
    createSpy.mockRestore();
  });

  
  test('should return 502 when NASA is down and no cache exists', async () => {
    const service = {
      getCapabilities: jest.fn().mockRejectedValue(new Error('Connection Timeout'))
    };
    const app = createApp(service);

    const response = await request(app).get('/api/sea-ice/capabilities');

    expect(response.status).toBe(502);
    expect(response.body.message).toContain('NSIDC unreachable');
  });
});