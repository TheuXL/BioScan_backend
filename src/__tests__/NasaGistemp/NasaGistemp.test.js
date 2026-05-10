require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Import TypeScript modules (ts-jest will handle compilation)
const { NasaGistempService } = require('../../infrastructure/apis/NASA/NasaGistemp/NasaGistempService');
const { GlobalTemperatureModel } = require('../../infrastructure/apis/NASA/NasaGistemp/NasaGistempModels');
const { NasaGistempController } = require('../../infrastructure/apis/NASA/NasaGistemp/NasaGistempController');
const { StationType, DEFAULTS } = require('../../infrastructure/apis/NASA/NasaGistemp/NasaGistempTypes');

describe('NASA GISTEMP Module - Integration Tests (Real API)', () => {
  let nasaGistempService;
  let nasaGistempController;

  beforeAll(async () => {
    // Conectar ao MongoDB para testes de integração
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
    } else {
      throw new Error('MONGODB_URI is required in .env file for integration tests');
    }
  }, 30000);

  afterAll(async () => {
    // Limpar conexão do MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }, 30000);

  beforeEach(() => {
    // Criar instância fresca do serviço para cada teste
    nasaGistempService = new NasaGistempService();
    nasaGistempController = new NasaGistempController(nasaGistempService);
  });

  afterEach(async () => {
    // Parar qualquer serviço de sincronização em execução
    if (nasaGistempService) {
      nasaGistempService.stopSync();
    }
    
    // Não limpar dados reais - são dados históricos importantes
  });

  // Cache de dados para evitar múltiplas requisições
  let cachedTemperatureData = null;

  describe('NasaGistempService - Real API Integration', () => {
    describe('Constructor', () => {
      test('should create service instance', () => {
        const service = new NasaGistempService();
        expect(service).toBeInstanceOf(NasaGistempService);
      });

      test('should create service instance with custom baseUrl', () => {
        const customUrl = 'https://custom-api-url.com';
        const service = new NasaGistempService({ baseUrl: customUrl });
        expect(service.client.defaults.baseURL).toBe(customUrl);
      });
    });

    describe('fetchTemperatureData - Real API Calls', () => {
      // Teste único que busca dados e valida estrutura + salvamento
      test('should fetch and save real temperature data from NASA GISTEMP API', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping API test');
          return;
        }

        // Contar documentos antes
        const countBefore = await GlobalTemperatureModel.countDocuments({ stationType: StationType.LAND_OCEAN });

        // Buscar dados (salva automaticamente) - deve retornar 200 OK
        const temperatureData = await nasaGistempService.fetchTemperatureData(StationType.LAND_OCEAN);

        // Cache para outros testes
        cachedTemperatureData = temperatureData;

        expect(temperatureData).toBeInstanceOf(Array);
        expect(temperatureData.length).toBeGreaterThan(0);
        
        // Verificar estrutura dos dados reais
        const firstRecord = temperatureData[0];
        expect(firstRecord).toHaveProperty('year');
        expect(firstRecord).toHaveProperty('month');
        expect(firstRecord).toHaveProperty('anomaly');
        expect(firstRecord).toHaveProperty('stationType');
        expect(typeof firstRecord.year).toBe('number');
        expect(typeof firstRecord.anomaly).toBe('number');
        expect(firstRecord.year).toBeGreaterThanOrEqual(1880);
        expect(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']).toContain(firstRecord.month);

        // Aguardar saves serem processados (reduzido para 1s)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar que dados foram salvos
        const countAfter = await GlobalTemperatureModel.countDocuments({ stationType: StationType.LAND_OCEAN });
        expect(countAfter).toBeGreaterThanOrEqual(countBefore);
      }, 45000);
    });

    describe('syncTemperatureData - Real API to MongoDB Integration', () => {
      test('should sync real temperature data from API to MongoDB', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping sync test');
          return;
        }

        // Contar documentos antes da sincronização
        const countBefore = await GlobalTemperatureModel.countDocuments({ stationType: StationType.LAND_OCEAN });

        // Sincronizar dados reais da API - deve retornar 200 OK
        const result = await nasaGistempService.syncTemperatureData(StationType.LAND_OCEAN);
        
        expect(result).toHaveProperty('saved');
        expect(result).toHaveProperty('updated');
        expect(result).toHaveProperty('skipped');
        expect(result).toHaveProperty('errors');
        expect(typeof result.saved).toBe('number');
        expect(typeof result.updated).toBe('number');
        expect(typeof result.skipped).toBe('number');
        expect(typeof result.errors).toBe('number');

        // Verificar que dados foram salvos no MongoDB
        const countAfter = await GlobalTemperatureModel.countDocuments({ stationType: StationType.LAND_OCEAN });
        
        // Deve ter salvado ou atualizado dados
        expect(result.saved + result.updated).toBeGreaterThan(0);
        expect(countAfter).toBeGreaterThanOrEqual(countBefore);
        
        // Buscar um documento salvo e verificar estrutura
        const savedRecord = await GlobalTemperatureModel.findOne({ stationType: StationType.LAND_OCEAN }).sort({ year: -1 });
        expect(savedRecord).toBeDefined();
        expect(savedRecord).toHaveProperty('year');
        expect(savedRecord).toHaveProperty('month');
        expect(savedRecord).toHaveProperty('anomaly');
        expect(savedRecord).toHaveProperty('stationType');
        expect(savedRecord.stationType).toBe(StationType.LAND_OCEAN);
      }, 60000);
    });

    describe('getTemperatureData - MongoDB Queries', () => {
      test('should get and filter temperature data from MongoDB', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping query test');
          return;
        }

        // Usar dados já salvos ou buscar se necessário
        if (!cachedTemperatureData) {
          await nasaGistempService.fetchTemperatureData(StationType.LAND_OCEAN);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Teste 1: Buscar todos os dados
        const allData = await nasaGistempService.getTemperatureData({
          stationType: StationType.LAND_OCEAN
        });

        expect(allData).toBeInstanceOf(Array);
        expect(allData.length).toBeGreaterThan(0);
        
        expect(allData[0]).toHaveProperty('year');
        expect(allData[0]).toHaveProperty('month');
        expect(allData[0]).toHaveProperty('anomaly');
        expect(allData[0]).toHaveProperty('stationType');

        // Teste 2: Filtrar por ano
        const yearData = await nasaGistempService.getTemperatureData({
          startYear: 2020,
          endYear: 2024,
          stationType: StationType.LAND_OCEAN
        });

        expect(yearData).toBeInstanceOf(Array);
        expect(yearData.length).toBeGreaterThan(0);
        yearData.forEach(record => {
          expect(record.year).toBeGreaterThanOrEqual(2020);
          expect(record.year).toBeLessThanOrEqual(2024);
        });

        // Teste 3: Filtrar por mês
        const monthData = await nasaGistempService.getTemperatureData({
          month: 'Jan',
          stationType: StationType.LAND_OCEAN
        });

        expect(monthData).toBeInstanceOf(Array);
        expect(monthData.length).toBeGreaterThan(0);
        monthData.forEach(record => {
          expect(record.month).toBe('Jan');
        });
      }, 30000);
    });

    describe('Sync Service Management', () => {
      afterEach(() => {
        // Garantir que o serviço de sincronização seja parado após cada teste
        nasaGistempService.stopSync();
      });

      test('should start sync service', () => {
        nasaGistempService.startSync();
        
        const status = nasaGistempService.getSyncStatus();
        expect(status.isRunning).toBe(true);
        
        nasaGistempService.stopSync();
      });

      test('should stop sync service', () => {
        nasaGistempService.startSync();
        nasaGistempService.stopSync();
        
        const status = nasaGistempService.getSyncStatus();
        expect(status.isRunning).toBe(false);
      });

      test('should not start sync if already running', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        nasaGistempService.startSync();
        nasaGistempService.startSync(); // Tentar iniciar novamente
        
        expect(consoleSpy).toHaveBeenCalledWith('GISTEMP sync service is already running.');
        
        nasaGistempService.stopSync();
        consoleSpy.mockRestore();
      });

      test('should return sync status', () => {
        const status = nasaGistempService.getSyncStatus();
        
        expect(status).toHaveProperty('isRunning');
        expect(status).toHaveProperty('lastSyncTime');
        expect(status).toHaveProperty('interval');
        expect(typeof status.isRunning).toBe('boolean');
      });
    });
  });

  describe('NasaGistempController - Real Data Integration', () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        query: {},
        body: {}
      };
      mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
    });

    describe('getTemperature', () => {
      test('should return real temperature data from MongoDB', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping controller test');
          return;
        }

        // Usar dados já salvos ou buscar se necessário
        if (!cachedTemperatureData) {
          await nasaGistempService.fetchTemperatureData(StationType.LAND_OCEAN);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        mockReq.query = {};

        await nasaGistempController.getTemperature(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        expect(response).toHaveProperty('count');
        expect(response).toHaveProperty('data');
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.count).toBeGreaterThan(0);
      }, 30000);
    });

    describe('getTemperatureStats', () => {
      test('should return temperature statistics', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping stats test');
          return;
        }

        // Usar dados já salvos ou buscar se necessário
        if (!cachedTemperatureData) {
          await nasaGistempService.fetchTemperatureData(StationType.LAND_OCEAN);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        mockReq.query = {};

        await nasaGistempController.getTemperatureStats(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        expect(response).toHaveProperty('stationType');
        expect(response.stats).toBeDefined();
        expect(response.stats).toHaveProperty('minAnomaly');
        expect(response.stats).toHaveProperty('maxAnomaly');
        expect(response.stats).toHaveProperty('avgAnomaly');
        expect(response.stats).toHaveProperty('minYear');
        expect(response.stats).toHaveProperty('maxYear');
        expect(response.stats).toHaveProperty('totalRecords');
        expect(response.stats.totalRecords).toBeGreaterThan(0);
      }, 30000);
    });

    describe('getSyncStatus', () => {
      test('should return sync status', () => {
        nasaGistempController.getSyncStatus(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        expect(response).toHaveProperty('isRunning');
        expect(response).toHaveProperty('lastSyncTime');
        expect(response).toHaveProperty('interval');
      });
    });

    describe('triggerSync', () => {
      test('should trigger real manual sync', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping trigger sync test');
          return;
        }

        mockReq.body = { stationType: StationType.LAND_OCEAN };

        await nasaGistempController.triggerSync(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        
        // Deve retornar sucesso (200 OK) com estrutura completa
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('saved');
        expect(response).toHaveProperty('updated');
        expect(response).toHaveProperty('skipped');
        expect(response).toHaveProperty('errors');
        expect(typeof response.saved).toBe('number');
        expect(response.message).toBe('Temperature data sync completed.');
      }, 60000);
    });
  });

  describe('GlobalTemperatureModel - Real Data Structure', () => {
    test('should save real temperature data with correct structure', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, skipping model test');
        return;
      }

      // Usar dados já salvos ou buscar se necessário
      let realData = cachedTemperatureData;
      if (!realData) {
        realData = await nasaGistempService.fetchTemperatureData(StationType.LAND_OCEAN);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      expect(realData.length).toBeGreaterThan(0);

      // Buscar do MongoDB
      const savedRecord = await GlobalTemperatureModel.findOne({
        year: realData[0].year,
        month: realData[0].month,
        stationType: realData[0].stationType
      });

      expect(savedRecord).toBeDefined();
      expect(savedRecord).toHaveProperty('year');
      expect(savedRecord).toHaveProperty('month');
      expect(savedRecord).toHaveProperty('anomaly');
      expect(savedRecord).toHaveProperty('stationType');
      expect(savedRecord.year).toBe(realData[0].year);
      expect(savedRecord.month).toBe(realData[0].month);
      expect(savedRecord.stationType).toBe(realData[0].stationType);
      expect(typeof savedRecord.anomaly).toBe('number');
    }, 30000);

    test('should enforce unique constraint (year, month, stationType)', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Usar dados já salvos ou buscar se necessário
      let realData = cachedTemperatureData;
      if (!realData) {
        realData = await nasaGistempService.fetchTemperatureData(StationType.LAND_OCEAN);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      expect(realData.length).toBeGreaterThan(0);

      const testRecord = realData[0];

      // Tentar criar duplicado manualmente - deve falhar
      await expect(
        GlobalTemperatureModel.create({
          year: testRecord.year,
          month: testRecord.month,
          anomaly: testRecord.anomaly,
          stationType: testRecord.stationType
        })
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Constants and Types', () => {
    test('should have valid StationType enum values', () => {
      expect(StationType.LAND_OCEAN).toBe('Land-Ocean');
      expect(StationType.LAND_ONLY).toBe('Land-Only');
      expect(StationType.OCEAN_ONLY).toBe('Ocean-Only');
    });

    test('should have valid default values', () => {
      expect(DEFAULTS.STATION_TYPE).toBeDefined();
      expect(DEFAULTS.STATION_TYPE).toBe(StationType.LAND_OCEAN);
      expect(DEFAULTS.CRON_INTERVAL).toBeDefined();
      expect(DEFAULTS.TIMEZONE).toBe('UTC');
    });
  });
});
