require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const { ExtinctionService } = require('../../infrastructure/apis/Extinction/ExtinctionService');
const { ThreatenedOccurrenceModel } = require('../../infrastructure/apis/Extinction/ExtinctionModels');

describe('Extinction — integração real GBIF + MongoDB', () => {
  let service;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }, 30000);

  beforeEach(() => {
    service = new ExtinctionService();
  });

  afterEach(async () => {
    if (service) {
      service.stopSync();
    }
  });

  test('syncThreatenedOccurrences grava ocorrências CR reais na base', async () => {
    const result = await service.syncThreatenedOccurrences({
      maxRecords: 25,
      categories: ['CR']
    });

    expect(result.savedCount).toBeGreaterThan(0);
    expect(result.categories).toContain('CR');

    const n = await ThreatenedOccurrenceModel.countDocuments({ iucnRedListCategory: 'CR' });
    expect(n).toBeGreaterThan(0);

    const doc = await ThreatenedOccurrenceModel.findOne({ iucnRedListCategory: 'CR' }).lean();
    expect(doc).not.toBeNull();
    expect(doc.latitude).toBeGreaterThanOrEqual(-90);
    expect(doc.latitude).toBeLessThanOrEqual(90);
    expect(doc.longitude).toBeGreaterThanOrEqual(-180);
    expect(doc.longitude).toBeLessThanOrEqual(180);
    expect(doc.scientificName).toBeTruthy();
    expect(doc.gbifOccurrenceKey).toBeTruthy();
  }, 120000);

  test('listOccurrences devolve documentos após sync', async () => {
    await service.syncThreatenedOccurrences({
      maxRecords: 10,
      categories: ['EN']
    });

    const rows = await service.listOccurrences({ limit: 5, category: 'EN' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(5);
  }, 120000);

  test('getSyncStatus tem forma esperada', () => {
    const st = service.getSyncStatus();
    expect(st.isRunning).toBe(false);
    expect(st).toHaveProperty('lastSyncTime');
    expect(st).toHaveProperty('lastError');
    expect(st).toHaveProperty('interval');
  });
});
