const request = require('supertest');
const express = require('express');
const axios = require('axios');
const { createGlimsRoutes } = require('../../infrastructure/apis/GLIMS/GlimsRoutes');
const { GlimsService } = require('../../infrastructure/apis/GLIMS/GlimsService');

describe('GLIMS module', () => {
  function createApp(service = new GlimsService()) {
    const app = express();
    app.use('/api/glaciers', createGlimsRoutes(express.Router(), service));
    return app;
  }

  test('should expose a discovery endpoint', async () => {
    const app = createApp();

    const response = await request(app).get('/api/glaciers');

    expect(response.status).toBe(200);
    expect(response.body.provider).toBe('BioScan proxy — GLIMS glacier data');
    expect(response.body.basePath).toBe('/api/glaciers');
  });

  test('should reject unsupported layer names', async () => {
    const app = createApp();

    const response = await request(app).get('/api/glaciers/layers/bad-layer/geojson');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('layerName');
  });

  test('should return capabilities as XML instead of JSON', async () => {
    const service = {
      getCapabilities: jest.fn().mockResolvedValue('<?xml version="1.0"?><WMS_Capabilities />'),
      getLayerGeoJson: jest.fn()
    };
    const app = createApp(service);

    const response = await request(app).get('/api/glaciers/capabilities');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.text).toContain('<WMS_Capabilities');
    expect(service.getCapabilities).toHaveBeenCalledTimes(1);
  });

  test('should reject invalid bbox values', async () => {
    const app = createApp();

    const response = await request(app).get('/api/glaciers/layers/outlines/geojson?bbox=-200,-90,180,90');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('bbox');
  });

  test('should reject feature_count outside the allowed range', async () => {
    const app = createApp();

    const response = await request(app).get('/api/glaciers/layers/outlines/geojson?feature_count=1001');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('feature_count');
  });

  test('should reject unsupported srs values', async () => {
    const app = createApp();

    const response = await request(app).get('/api/glaciers/layers/outlines/geojson?srs=EPSG:3857');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('srs');
  });

  test('should reject WMS-only width and height parameters on WFS GeoJSON route', async () => {
    const app = createApp();

    const response = await request(app).get('/api/glaciers/layers/outlines/geojson?width=256&height=256');

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('width');
  });

  test('should pass validated GeoJSON query to the service without width or height', async () => {
    const service = {
      getLayerGeoJson: jest.fn().mockResolvedValue({ type: 'FeatureCollection', features: [] })
    };
    const app = createApp(service);

    const response = await request(app).get(
      '/api/glaciers/layers/GLIMS:RGI/geojson?bbox=-10,-20,30,40&srs=EPSG:4326&feature_count=25&cql_filter=name%20LIKE%20%27A%25%27'
    );

    expect(response.status).toBe(200);
    expect(service.getLayerGeoJson).toHaveBeenCalledWith('GLIMS:RGI', {
      bbox: '-10,-20,30,40',
      srs: 'EPSG:4326',
      cql_filter: "name LIKE 'A%'",
      feature_count: 25
    });
  });

  test('GlimsService should use WFS-only params with safe default maxFeatures', async () => {
    const get = jest.fn().mockResolvedValue({ status: 200, data: { type: 'FeatureCollection', features: [] } });
    const createSpy = jest.spyOn(axios, 'create').mockReturnValue({ get });

    const service = new GlimsService();
    await service.getLayerGeoJson('outlines');

    expect(createSpy).toHaveBeenCalledWith({
      timeout: 20000,
      headers: {
        'User-Agent': 'BioScan-Backend/1.0 (GLIMS-WFS-proxy)',
        Accept: 'application/json, application/xml, text/xml, */*'
      }
    });
    expect(get).toHaveBeenCalledWith('https://www.glims.org/geoserver/ows', {
      params: {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'GLIMS:GLIMS_Glacier_Outlines',
        outputFormat: 'application/json',
        srsName: 'EPSG:4326',
        bbox: '-180,-90,180,90',
        cql_filter: undefined,
        maxFeatures: 25
      }
    });

    createSpy.mockRestore();
  });
});
