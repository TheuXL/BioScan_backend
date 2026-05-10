require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const { NasaSeaLevelService } = require('../../infrastructure/apis/NASA/NasaSeaLevel/NasaSeaLevelService');
const { SeaLevelSnapshotModel } = require('../../infrastructure/apis/NASA/NasaSeaLevel/NasaSeaLevelModels');
const { NasaSeaLevelController } = require('../../infrastructure/apis/NASA/NasaSeaLevel/NasaSeaLevelController');
const { SEA_LEVEL_SOURCE_ID, API_CONFIG } = require('../../infrastructure/apis/NASA/NasaSeaLevel/NasaSeaLevelTypes');

/**
 * Integração real: HTTP contra os URLs configurados em NasaSeaLevelTypes / SEA_LEVEL_DATA_URL.
 * Sem dados mockados. Requer rede/DNS e, se necessário, SEA_LEVEL_DATA_URL no .env.
 */
describe('NASA Sea Level Module - Integration Tests (Real API)', () => {
  let nasaSeaLevelService;
  let nasaSeaLevelController;

  beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required in .env file for integration tests');
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }, 30000);

  beforeEach(() => {
    nasaSeaLevelService = new NasaSeaLevelService();
    nasaSeaLevelController = new NasaSeaLevelController(nasaSeaLevelService);
  });

  afterEach(async () => {
    if (nasaSeaLevelService) {
      nasaSeaLevelService.stopSync();
    }
  });

  describe('NasaSeaLevelService - Real API Integration', () => {
    describe('Constructor', () => {
      test('should create service instance', () => {
        const service = new NasaSeaLevelService();
        expect(service).toBeInstanceOf(NasaSeaLevelService);
      });

      test('should create service instance with custom baseUrl', () => {
        const customUrl = 'https://custom-sea-level.example';
        const service = new NasaSeaLevelService({ baseUrl: customUrl });
        expect(service.client.defaults.baseURL).toBe(customUrl);
      });
    });

    describe('fetchGlobalSeaLevel - Real API Calls', () => {
      test('should fetch sea level payload from a reachable HTTP source (HTTP 200)', async () => {
        const data = await nasaSeaLevelService.fetchGlobalSeaLevel();

        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
        expect(data).not.toBeNull();
      }, 60000);
    });

    describe('syncSeaLevelData - Real API to MongoDB', () => {
      test('should sync real sea level payload to MongoDB', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping sync test');
          return;
        }

        const result = await nasaSeaLevelService.syncSeaLevelData();

        expect(result).toHaveProperty('saved');
        expect(result).toHaveProperty('fetchedAt');
        expect(result.saved).toBe(true);
        expect(result.fetchedAt).toBeInstanceOf(Date);

        const doc = await SeaLevelSnapshotModel.findOne({ source: SEA_LEVEL_SOURCE_ID }).lean();
        expect(doc).toBeDefined();
        expect(doc.source).toBe(SEA_LEVEL_SOURCE_ID);
        expect(doc.payload).toBeDefined();
        expect(typeof doc.payload).toBe('object');
        expect(doc.fetchedAt).toBeDefined();
      }, 60000);
    });

    describe('getLatestSnapshotFromDb', () => {
      test('should return snapshot after sync', async () => {
        if (mongoose.connection.readyState !== 1) return;

        await nasaSeaLevelService.syncSeaLevelData();
        const latest = await nasaSeaLevelService.getLatestSnapshotFromDb();

        expect(latest).not.toBeNull();
        expect(latest.source).toBe(SEA_LEVEL_SOURCE_ID);
        expect(typeof latest.payload).toBe('object');
        expect(latest.fetchedAt).toBeInstanceOf(Date);
      }, 60000);
    });

    describe('Sync Service Management', () => {
      afterEach(() => {
        nasaSeaLevelService.stopSync();
      });

      test('should start and stop sync service', () => {
        nasaSeaLevelService.startSync();
        expect(nasaSeaLevelService.getSyncStatus().isRunning).toBe(true);
        nasaSeaLevelService.stopSync();
        expect(nasaSeaLevelService.getSyncStatus().isRunning).toBe(false);
      });

      test('should not start sync if already running', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        nasaSeaLevelService.startSync();
        nasaSeaLevelService.startSync();
        expect(consoleSpy).toHaveBeenCalledWith('Sea level sync service is already running.');
        nasaSeaLevelService.stopSync();
        consoleSpy.mockRestore();
      });

      test('should return sync status shape', () => {
        const status = nasaSeaLevelService.getSyncStatus();
        expect(status).toHaveProperty('isRunning');
        expect(status).toHaveProperty('lastSyncTime');
        expect(status).toHaveProperty('interval');
      });
    });
  });

  describe('NasaSeaLevelController - Real Data Integration', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
      mockReq = { query: {}, body: {} };
      mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
    });

    test('getSeaLevelLive should return 200 and JSON body from real API', async () => {
      await nasaSeaLevelController.getSeaLevelLive(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const body = mockRes.json.mock.calls[0][0];
      expect(typeof body).toBe('object');
      expect(body).not.toBeNull();
    }, 60000);

    test('getSeaLevelLatest should return 404 when no snapshot exists', async () => {
      if (mongoose.connection.readyState !== 1) return;

      await SeaLevelSnapshotModel.deleteMany({ source: SEA_LEVEL_SOURCE_ID });

      await nasaSeaLevelController.getSeaLevelLatest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalled();
      const body = mockRes.json.mock.calls[0][0];
      expect(body).toHaveProperty('message');
    }, 30000);

    test('getSeaLevelLatest should return 200 after sync', async () => {
      if (mongoose.connection.readyState !== 1) return;

      await nasaSeaLevelService.syncSeaLevelData();

      await nasaSeaLevelController.getSeaLevelLatest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const body = mockRes.json.mock.calls[0][0];
      expect(body).toHaveProperty('source', SEA_LEVEL_SOURCE_ID);
      expect(body).toHaveProperty('payload');
      expect(body).toHaveProperty('fetchedAt');
    }, 60000);

    test('getSyncStatus should return 200', () => {
      nasaSeaLevelController.getSyncStatus(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('triggerSync should return 200 and saved true', async () => {
      if (mongoose.connection.readyState !== 1) return;

      await nasaSeaLevelController.triggerSync(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const body = mockRes.json.mock.calls[0][0];
      expect(body).toHaveProperty('message');
      expect(body.saved).toBe(true);
      expect(body).toHaveProperty('fetchedAt');
    }, 60000);
  });

  describe('SeaLevelSnapshotModel', () => {
    test('should keep a single logical row per source (upsert)', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const s = new NasaSeaLevelService();
      await s.syncSeaLevelData();
      await s.syncSeaLevelData();
      const n = await SeaLevelSnapshotModel.countDocuments({ source: SEA_LEVEL_SOURCE_ID });
      expect(n).toBe(1);
      s.stopSync();
    }, 60000);
  });

  describe('Constants and Types', () => {
    test('should expose API config', () => {
      expect(API_CONFIG.BASE_URL).toContain('climatetools');
      expect(API_CONFIG.ENDPOINT).toBe('/sea-level');
      expect(Array.isArray(API_CONFIG.FALLBACK_URLS)).toBe(true);
      expect(API_CONFIG.FALLBACK_URLS.length).toBeGreaterThan(0);
      expect(SEA_LEVEL_SOURCE_ID).toBe('climate_tools_global');
    });
  });
});
