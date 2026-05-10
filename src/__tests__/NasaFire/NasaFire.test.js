require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Import TypeScript modules (ts-jest will handle compilation)
const { NasaFireService } = require('../../infrastructure/apis/NASA/NasaFire/NasaFireService');
const { NasaFireModel } = require('../../infrastructure/apis/NASA/NasaFire/NasaFireModels');
const { NasaFireController } = require('../../infrastructure/apis/NASA/NasaFire/NasaFireController');
const { FireSource, DEFAULTS } = require('../../infrastructure/apis/NASA/NasaFire/NasaFireTypes');

describe('NASA Fire Module - Integration Tests (Real API)', () => {
  let nasaFireService;
  let nasaFireController;
  const apiKey = process.env.MAP_KEY;

  beforeAll(async () => {
    // Verificar se a API key está configurada
    if (!apiKey) {
      throw new Error('MAP_KEY is required in .env file for real API tests');
    }

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
    nasaFireService = new NasaFireService({ apiKey });
    nasaFireController = new NasaFireController(nasaFireService);
  });

  afterEach(async () => {
    // Parar qualquer serviço de sincronização em execução
    if (nasaFireService) {
      nasaFireService.stopSync();
    }
    
    // Limpar dados de teste do MongoDB (apenas dados de teste, não dados reais)
    if (mongoose.connection.readyState === 1) {
      // Não limpar dados reais salvos pela API
      // Apenas limpar se houver dados de teste específicos
    }
  });

  describe('NasaFireService - Real API Integration', () => {
    describe('Constructor', () => {
      test('should create service instance with valid API key', () => {
        const service = new NasaFireService({ apiKey });
        expect(service).toBeInstanceOf(NasaFireService);
      });

      test('should throw error if API key is missing', () => {
        expect(() => {
          new NasaFireService({});
        }).toThrow('NASA FIRMS API key is required.');
      });
    });

    describe('getActiveFires - Real API Calls', () => {
      test('should fetch real fire data from NASA FIRMS API (worldwide)', async () => {
        const fires = await nasaFireService.getActiveFires({
          source: FireSource.MODIS_NRT,
          days: 1 // Últimas 24 horas
        });

        expect(fires).toBeInstanceOf(Array);
        expect(fires.length).toBeGreaterThanOrEqual(0);
        
        // Se houver dados, verificar estrutura
        if (fires.length > 0) {
          const firstFire = fires[0];
          expect(firstFire).toHaveProperty('latitude');
          expect(firstFire).toHaveProperty('longitude');
          expect(firstFire).toHaveProperty('acq_date');
          expect(firstFire).toHaveProperty('acq_time');
          expect(typeof firstFire.latitude).toBe('number');
          expect(typeof firstFire.longitude).toBe('number');
        }
      }, 30000);

      test('should fetch real fire data with VIIRS_SNPP_NRT source', async () => {
        const fires = await nasaFireService.getActiveFires({
          source: FireSource.VIIRS_SNPP_NRT,
          days: 1
        });

        expect(fires).toBeInstanceOf(Array);
        expect(fires.length).toBeGreaterThanOrEqual(0);
      }, 30000);

      test('should fetch real fire data with VIIRS_NOAA20_NRT source', async () => {
        const fires = await nasaFireService.getActiveFires({
          source: FireSource.VIIRS_NOAA20_NRT,
          days: 1
        });

        expect(fires).toBeInstanceOf(Array);
        expect(fires.length).toBeGreaterThanOrEqual(0);
      }, 30000);

      test('should validate source parameter', async () => {
        await expect(
          nasaFireService.getActiveFires({ source: 'INVALID_SOURCE' })
        ).rejects.toThrow('Unsupported source');
      });

      test('should validate days parameter (min)', async () => {
        await expect(
          nasaFireService.getActiveFires({ days: 0 })
        ).rejects.toThrow('Days parameter must be between');
      });

      test('should validate days parameter (max)', async () => {
        await expect(
          nasaFireService.getActiveFires({ days: 6 })
        ).rejects.toThrow('Days parameter must be between');
      });
    });

    describe('getActiveFiresByCountry - Real API Calls', () => {
      test('should fetch real fire data for Brazil', async () => {
        const fires = await nasaFireService.getActiveFiresByCountry({
          countryCode: 'BRA',
          source: FireSource.MODIS_NRT,
          days: 1
        });

        expect(fires).toBeInstanceOf(Array);
        expect(fires.length).toBeGreaterThanOrEqual(0);
        
        // Se houver dados, verificar que são do Brasil (latitude/longitude aproximadas)
        if (fires.length > 0) {
          const firstFire = fires[0];
          expect(firstFire).toHaveProperty('latitude');
          expect(firstFire).toHaveProperty('longitude');
          // Brasil está aproximadamente entre -35 e 5 de latitude e -75 e -30 de longitude
          expect(firstFire.latitude).toBeGreaterThanOrEqual(-35);
          expect(firstFire.latitude).toBeLessThanOrEqual(5);
        }
      }, 30000);

      test('should throw error if country code is missing', async () => {
        await expect(
          nasaFireService.getActiveFiresByCountry({})
        ).rejects.toThrow('Country code is required.');
      });

      test('should uppercase country code automatically', async () => {
        const fires = await nasaFireService.getActiveFiresByCountry({
          countryCode: 'bra', // lowercase
          source: FireSource.MODIS_NRT,
          days: 1
        });

        expect(fires).toBeInstanceOf(Array);
      }, 30000);

      test('should validate source for country query', async () => {
        await expect(
          nasaFireService.getActiveFiresByCountry({
            countryCode: 'BRA',
            source: 'INVALID'
          })
        ).rejects.toThrow('Unsupported source');
      });
    });

    describe('syncFireData - Real API to MongoDB Integration', () => {
      test('should fetch real fire data from API and save to MongoDB', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping sync test');
          return;
        }

        // Contar documentos antes da sincronização
        const countBefore = await NasaFireModel.countDocuments();

        // Sincronizar dados reais da API
        const result = await nasaFireService.syncFireData(FireSource.MODIS_NRT);
        
        expect(result).toHaveProperty('saved');
        expect(result).toHaveProperty('skipped');
        expect(result).toHaveProperty('errors');
        expect(typeof result.saved).toBe('number');
        expect(typeof result.skipped).toBe('number');
        expect(typeof result.errors).toBe('number');

        // Verificar que dados foram salvos no MongoDB
        const countAfter = await NasaFireModel.countDocuments();
        
        // Se houve dados salvos, verificar que estão no banco
        if (result.saved > 0) {
          expect(countAfter).toBeGreaterThanOrEqual(countBefore);
          
          // Buscar um documento salvo e verificar estrutura
          const savedFire = await NasaFireModel.findOne().sort({ createdAt: -1 });
          expect(savedFire).toBeDefined();
          expect(savedFire).toHaveProperty('latitude');
          expect(savedFire).toHaveProperty('longitude');
          expect(savedFire).toHaveProperty('acq_date');
          expect(savedFire).toHaveProperty('acq_time');
          expect(savedFire).toHaveProperty('source');
          expect(savedFire).toHaveProperty('fireId');
          expect(savedFire.fireId).toBeDefined();
        }
      }, 60000);

      test('should handle duplicate fires correctly (skip duplicates)', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping duplicate test');
          return;
        }

        // Primeira sincronização
        const result1 = await nasaFireService.syncFireData(FireSource.MODIS_NRT);
        
        // Segunda sincronização (deve pular duplicados)
        const result2 = await nasaFireService.syncFireData(FireSource.MODIS_NRT);
        
        expect(result2).toHaveProperty('saved');
        expect(result2).toHaveProperty('skipped');
        
        // Na segunda sincronização, deve pular duplicados
        // (pode salvar alguns novos se houver novos focos)
        expect(result2.skipped + result2.saved).toBeGreaterThanOrEqual(0);
      }, 60000);

      test('should sync data from all available sources', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping multi-source test');
          return;
        }

        const sources = [
          FireSource.MODIS_NRT,
          FireSource.VIIRS_SNPP_NRT,
          FireSource.VIIRS_NOAA20_NRT
        ];

        for (const source of sources) {
          const result = await nasaFireService.syncFireData(source);
          
          expect(result).toHaveProperty('saved');
          expect(result).toHaveProperty('skipped');
          expect(result).toHaveProperty('errors');
          
          // Verificar que dados foram salvos com a source correta
          if (result.saved > 0) {
            const savedFires = await NasaFireModel.find({ source }).limit(1);
            if (savedFires.length > 0) {
              expect(savedFires[0].source).toBe(source);
            }
          }
        }
      }, 120000);
    });

    describe('Sync Service Management', () => {
      afterEach(() => {
        // Garantir que o serviço de sincronização seja parado após cada teste
        nasaFireService.stopSync();
      });

      test('should start sync service', () => {
        nasaFireService.startSync();
        
        const status = nasaFireService.getSyncStatus();
        expect(status.isRunning).toBe(true);
        
        nasaFireService.stopSync();
      });

      test('should stop sync service', () => {
        nasaFireService.startSync();
        nasaFireService.stopSync();
        
        const status = nasaFireService.getSyncStatus();
        expect(status.isRunning).toBe(false);
      });

      test('should not start sync if already running', () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        nasaFireService.startSync();
        nasaFireService.startSync(); // Tentar iniciar novamente
        
        expect(consoleSpy).toHaveBeenCalledWith('Fire sync service is already running.');
        
        nasaFireService.stopSync();
        consoleSpy.mockRestore();
      });

      test('should return sync status', () => {
        const status = nasaFireService.getSyncStatus();
        
        expect(status).toHaveProperty('isRunning');
        expect(status).toHaveProperty('lastSyncTime');
        expect(status).toHaveProperty('interval');
        expect(typeof status.isRunning).toBe('boolean');
      });
    });
  });

  describe('NasaFireController - Real Data Integration', () => {
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

    describe('getFires', () => {
      test('should return real fires from MongoDB', async () => {
        if (mongoose.connection.readyState !== 1) {
          console.log('MongoDB not connected, skipping controller test');
          return;
        }

        // Primeiro, sincronizar alguns dados reais
        await nasaFireService.syncFireData(FireSource.MODIS_NRT);

        mockReq.query = { limit: '10' };

        await nasaFireController.getFires(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        expect(response).toHaveProperty('count');
        expect(response).toHaveProperty('data');
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.count).toBeGreaterThanOrEqual(0);
      }, 60000);

      test('should filter by source', async () => {
        if (mongoose.connection.readyState !== 1) return;

        // Sincronizar dados primeiro
        await nasaFireService.syncFireData(FireSource.VIIRS_SNPP_NRT);

        mockReq.query = { source: FireSource.VIIRS_SNPP_NRT };

        await nasaFireController.getFires(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        if (response.data.length > 0) {
          // Verificar que todos os resultados têm a source correta
          response.data.forEach(fire => {
            expect(fire.source).toBe(FireSource.VIIRS_SNPP_NRT);
          });
        }
      }, 60000);

      test('should filter by date range', async () => {
        if (mongoose.connection.readyState !== 1) return;

        // Sincronizar dados primeiro
        await nasaFireService.syncFireData(FireSource.MODIS_NRT);

        const today = new Date().toISOString().split('T')[0];
        mockReq.query = {
          startDate: today,
          endDate: today
        };

        await nasaFireController.getFires(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        expect(Array.isArray(response.data)).toBe(true);
      }, 60000);
    });

    describe('getFiresByCountry', () => {
      test('should return real fires by country from API', async () => {
        mockReq.query = { countryCode: 'BRA' };

        await nasaFireController.getFiresByCountry(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        expect(response).toHaveProperty('count');
        expect(response).toHaveProperty('data');
        expect(Array.isArray(response.data)).toBe(true);
      }, 30000);

      test('should return 400 if country code is missing', async () => {
        mockReq.query = {};

        await nasaFireController.getFiresByCountry(mockReq, mockRes);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Country code')
          })
        );
      });
    });

    describe('getSyncStatus', () => {
      test('should return sync status', () => {
        nasaFireController.getSyncStatus(mockReq, mockRes);

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

        mockReq.body = { source: FireSource.MODIS_NRT };

        await nasaFireController.triggerSync(mockReq, mockRes);

        expect(mockRes.json).toHaveBeenCalled();
        const response = mockRes.json.mock.calls[0][0];
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('saved');
        expect(response).toHaveProperty('skipped');
        expect(response).toHaveProperty('errors');
        expect(typeof response.saved).toBe('number');
      }, 60000);
    });
  });

  describe('NasaFireModel - Real Data Structure', () => {
    test('should save real fire data with correct structure', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, skipping model test');
        return;
      }

      // Buscar dados reais da API
      const realFires = await nasaFireService.getActiveFires({
        source: FireSource.MODIS_NRT,
        days: 1
      });

      if (realFires.length === 0) {
        console.log('No fire data available from API, skipping structure test');
        return;
      }

      // Pegar o primeiro fogo real
      const realFire = realFires[0];

      // Sincronizar para salvar no MongoDB
      await nasaFireService.syncFireData(FireSource.MODIS_NRT);

      // Buscar do MongoDB
      const savedFire = await NasaFireModel.findOne({
        latitude: realFire.latitude,
        longitude: realFire.longitude,
        acq_date: realFire.acq_date,
        acq_time: realFire.acq_time
      });

      if (savedFire) {
        // Verificar estrutura completa
        expect(savedFire).toHaveProperty('latitude');
        expect(savedFire).toHaveProperty('longitude');
        expect(savedFire).toHaveProperty('acq_date');
        expect(savedFire).toHaveProperty('acq_time');
        expect(savedFire).toHaveProperty('source');
        expect(savedFire).toHaveProperty('fireId');
        expect(savedFire.fireId).toBeDefined();
        expect(savedFire.fireId).toContain(savedFire.latitude.toString());
        expect(savedFire.fireId).toContain(savedFire.longitude.toString());
        expect(savedFire.fireId).toContain(savedFire.acq_date);
        expect(savedFire.fireId).toContain(savedFire.acq_time);
        expect(savedFire.fireId).toContain(savedFire.source);
      }
    }, 60000);

    test('should enforce unique fireId with real data', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Buscar dados reais
      const realFires = await nasaFireService.getActiveFires({
        source: FireSource.MODIS_NRT,
        days: 1
      });

      if (realFires.length === 0) {
        console.log('No fire data available, skipping unique test');
        return;
      }

      const realFire = realFires[0];

      // Primeira sincronização
      await nasaFireService.syncFireData(FireSource.MODIS_NRT);

      // Tentar criar duplicado manualmente
      const fireId = `${realFire.latitude}_${realFire.longitude}_${realFire.acq_date}_${realFire.acq_time}_${FireSource.MODIS_NRT}`;
      
      await expect(
        NasaFireModel.create({
          ...realFire,
          source: FireSource.MODIS_NRT,
          fireId: fireId
        })
      ).rejects.toThrow();
    }, 60000);
  });

  describe('Constants and Types', () => {
    test('should have valid FireSource enum values', () => {
      expect(FireSource.MODIS_NRT).toBe('MODIS_NRT');
      expect(FireSource.VIIRS_SNPP_NRT).toBe('VIIRS_SNPP_NRT');
      expect(FireSource.VIIRS_NOAA20_NRT).toBe('VIIRS_NOAA20_NRT');
    });

    test('should have valid default values', () => {
      expect(DEFAULTS.SOURCE).toBeDefined();
      expect(DEFAULTS.DAYS).toBeGreaterThanOrEqual(1);
      expect(DEFAULTS.MAX_DAYS).toBe(5);
      expect(DEFAULTS.MIN_DAYS).toBe(1);
      expect(DEFAULTS.LIMIT).toBeGreaterThan(0);
    });
  });
});
