const request = require('supertest');
const express = require('express');
const { createGlimsRoutes } = require('../../infrastructure/apis/GLIMS/GlimsRoutes');
const { GlimsService } = require('../../infrastructure/apis/GLIMS/GlimsService');

describe('GLIMS module', () => {
  test('should expose a discovery endpoint', async () => {
    const app = express();
    const service = new GlimsService();
    app.use('/api/glaciers', createGlimsRoutes(express.Router(), service));

    const response = await request(app).get('/api/glaciers');

    expect(response.status).toBe(200);
    expect(response.body.provider).toBe('BioScan proxy — GLIMS glacier data');
    expect(response.body.basePath).toBe('/api/glaciers');
  });
});
