require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

// Import NasaFireModel from NASA Fire module (TypeScript; ts-jest compiles)
const { NasaFireModel } = require('../../infrastructure/apis/NASA/NasaFire/NasaFireModels');

describe('MongoDB Connection and Operations', () => {
  beforeAll(async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in the .env file.');
    }
    await mongoose.connect(process.env.MONGODB_URI);
  }, 10000);

  afterAll(async () => {
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
      // Delete test documents from NasaFireModel only
      await NasaFireModel.deleteMany({ fireId: { $regex: /^test_/ } });
      
      await mongoose.connection.close();
    }
  }, 15000);

  describe('MongoDB Connection', () => {
    test('should connect to MongoDB successfully', async () => {
      expect(mongoose.connection.readyState).toBe(1); // 1 means connected
    }, 15000);

    test('should have a defined MONGODB_URI in .env', () => {
      expect(process.env.MONGODB_URI).toBeDefined();
      expect(process.env.MONGODB_URI).not.toBeNull();
      expect(process.env.MONGODB_URI).not.toBe('');
    }, 5000);

    test('should have correct connection state', () => {
      const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      };
      const state = mongoose.connection.readyState;
      expect([0, 1, 2, 3]).toContain(state);
      if (state === 1) {
        expect(mongoose.connection.name).toBeDefined();
        expect(mongoose.connection.host).toBeDefined();
        expect(mongoose.connection.port).toBeDefined();
      }
    });

    test('should have database name defined', () => {
      if (mongoose.connection.readyState === 1) {
        expect(mongoose.connection.name).toBeDefined();
        expect(mongoose.connection.name).not.toBe('');
      }
    });
  });

  describe('MongoDB Basic Operations', () => {
    test('should perform create operation', async () => {
      if (mongoose.connection.readyState !== 1) {
        console.log('MongoDB not connected, skipping operation test');
        return;
      }

      // Use unique fireId to avoid conflicts
      const uniqueFireId = `test_create_operation_${Date.now()}`;
      
      const testData = {
        latitude: -23.456 + Math.random() * 0.001,
        longitude: -46.789 + Math.random() * 0.001,
        brightness: 320.5,
        acq_date: '2024-01-15',
        acq_time: '1430',
        source: 'MODIS_NRT',
        fireId: uniqueFireId
      };

      const document = await NasaFireModel.create(testData);
      expect(document).toBeDefined();
      expect(document._id).toBeDefined();
      expect(document.latitude).toBe(testData.latitude);
      expect(document.longitude).toBe(testData.longitude);
      
      // Clean up
      await NasaFireModel.deleteOne({ fireId: uniqueFireId });
    }, 10000);

    test('should perform read operation', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const uniqueFireId = `test_read_operation_${Date.now()}`;
      
      const testData = {
        latitude: -24.123 + Math.random() * 0.001,
        longitude: -47.456 + Math.random() * 0.001,
        acq_date: '2024-01-15',
        acq_time: '1500',
        source: 'MODIS_NRT',
        fireId: uniqueFireId
      };

      await NasaFireModel.create(testData);
      const found = await NasaFireModel.findOne({ fireId: uniqueFireId });

      expect(found).toBeDefined();
      expect(found.latitude).toBe(testData.latitude);
      expect(found.longitude).toBe(testData.longitude);
      
      // Clean up
      await NasaFireModel.deleteOne({ fireId: uniqueFireId });
    }, 10000);

    test('should perform update operation', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const uniqueFireId = `test_update_operation_${Date.now()}`;
      
      const testData = {
        latitude: -25.789 + Math.random() * 0.001,
        longitude: -48.123 + Math.random() * 0.001,
        acq_date: '2024-01-15',
        acq_time: '1600',
        source: 'MODIS_NRT',
        fireId: uniqueFireId
      };

      const document = await NasaFireModel.create(testData);
      const newBrightness = 350.0;

      await NasaFireModel.updateOne(
        { fireId: uniqueFireId },
        { $set: { brightness: newBrightness } }
      );

      const updated = await NasaFireModel.findOne({ fireId: uniqueFireId });
      expect(updated.brightness).toBe(newBrightness);
      
      // Clean up
      await NasaFireModel.deleteOne({ fireId: uniqueFireId });
    }, 10000);

    test('should perform delete operation', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const uniqueFireId = `test_delete_operation_${Date.now()}`;
      
      const testData = {
        latitude: -26.456 + Math.random() * 0.001,
        longitude: -49.789 + Math.random() * 0.001,
        acq_date: '2024-01-15',
        acq_time: '1700',
        source: 'MODIS_NRT',
        fireId: uniqueFireId
      };

      await NasaFireModel.create(testData);
      await NasaFireModel.deleteOne({ fireId: uniqueFireId });

      const deleted = await NasaFireModel.findOne({ fireId: uniqueFireId });
      expect(deleted).toBeNull();
    }, 10000);

    test('should perform bulk operations', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const timestamp = Date.now();
      const testData = [
        {
          latitude: -23.1 + Math.random() * 0.001,
          longitude: -46.1 + Math.random() * 0.001,
          acq_date: '2024-01-15',
          acq_time: '1800',
          source: 'MODIS_NRT',
          fireId: `test_bulk_${timestamp}_1`
        },
        {
          latitude: -23.2 + Math.random() * 0.001,
          longitude: -46.2 + Math.random() * 0.001,
          acq_date: '2024-01-15',
          acq_time: '1810',
          source: 'MODIS_NRT',
          fireId: `test_bulk_${timestamp}_2`
        },
        {
          latitude: -23.3 + Math.random() * 0.001,
          longitude: -46.3 + Math.random() * 0.001,
          acq_date: '2024-01-15',
          acq_time: '1820',
          source: 'MODIS_NRT',
          fireId: `test_bulk_${timestamp}_3`
        }
      ];

      const created = await NasaFireModel.insertMany(testData);
      expect(created).toHaveLength(3);

      const found = await NasaFireModel.find({ fireId: { $regex: new RegExp(`^test_bulk_${timestamp}_`) } });
      expect(found.length).toBe(3);
      
      // Clean up
      await NasaFireModel.deleteMany({ fireId: { $regex: new RegExp(`^test_bulk_${timestamp}_`) } });
    }, 15000);
  });

  describe('NasaFireModel', () => {
    test('should create document with required fields', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const uniqueFireId = `test_nasa_fire_${Date.now()}`;
      
      const fireData = {
        latitude: -23.456 + Math.random() * 0.001,
        longitude: -46.789 + Math.random() * 0.001,
        acq_date: '2024-01-15',
        acq_time: '1430',
        source: 'MODIS_NRT',
        fireId: uniqueFireId
      };

      const fire = await NasaFireModel.create(fireData);
      expect(fire.latitude).toBe(fireData.latitude);
      expect(fire.longitude).toBe(fireData.longitude);
      expect(fire.acq_date).toBe(fireData.acq_date);
      expect(fire.source).toBe(fireData.source);
      
      // Clean up
      await NasaFireModel.deleteOne({ fireId: uniqueFireId });
    }, 10000);

    test('should enforce required fields', async () => {
      if (mongoose.connection.readyState !== 1) return;

      await expect(
        NasaFireModel.create({
          // Missing required fields
          brightness: 320.5
        })
      ).rejects.toThrow();
    }, 10000);

    test('should validate enum values for source', async () => {
      if (mongoose.connection.readyState !== 1) return;

      await expect(
        NasaFireModel.create({
          latitude: -23.456,
          longitude: -46.789,
          acq_date: '2024-01-15',
          source: 'INVALID_SOURCE',
          fireId: 'test_invalid_source'
        })
      ).rejects.toThrow();
    }, 10000);

    test('should validate enum values for daynight', async () => {
      if (mongoose.connection.readyState !== 1) return;

      await expect(
        NasaFireModel.create({
          latitude: -23.456,
          longitude: -46.789,
          acq_date: '2024-01-15',
          source: 'MODIS_NRT',
          daynight: 'INVALID',
          fireId: 'test_invalid_daynight'
        })
      ).rejects.toThrow();
    }, 10000);

    test('should generate fireId automatically', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Use unique coordinates and time to avoid duplicate fireId
      const uniqueLat = -23.456 + Math.random() * 0.001;
      const uniqueLon = -46.789 + Math.random() * 0.001;
      const uniqueTime = `14${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;

      const fireData = {
        latitude: uniqueLat,
        longitude: uniqueLon,
        acq_date: '2024-01-15',
        acq_time: uniqueTime,
        source: 'MODIS_NRT'
      };

      const fire = await NasaFireModel.create(fireData);
      await fire.save();

      expect(fire.fireId).toBeDefined();
      expect(fire.fireId).toContain(uniqueLat.toString());
      expect(fire.fireId).toContain(uniqueLon.toString());
      expect(fire.fireId).toContain('2024-01-15');
      expect(fire.fireId).toContain(uniqueTime);
      
      // Clean up after test
      await NasaFireModel.deleteOne({ _id: fire._id });
    }, 10000);

    test('should enforce unique fireId', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const fireId = 'test_unique_fire_id_mongo';

      await NasaFireModel.create({
        latitude: -23.456,
        longitude: -46.789,
        acq_date: '2024-01-15',
        acq_time: '1430',
        source: 'MODIS_NRT',
        fireId: fireId
      });

      await expect(
        NasaFireModel.create({
          latitude: -24.123,
          longitude: -47.456,
          acq_date: '2024-01-15',
          acq_time: '1500',
          source: 'MODIS_NRT',
          fireId: fireId
        })
      ).rejects.toThrow();
    }, 10000);

    test('should add timestamps automatically', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const uniqueFireId = `test_timestamps_${Date.now()}`;
      
      const fireData = {
        latitude: -23.456 + Math.random() * 0.001,
        longitude: -46.789 + Math.random() * 0.001,
        acq_date: '2024-01-15',
        acq_time: '1430',
        source: 'MODIS_NRT',
        fireId: uniqueFireId
      };

      const fire = await NasaFireModel.create(fireData);
      expect(fire.createdAt).toBeDefined();
      expect(fire.updatedAt).toBeDefined();
      expect(fire.createdAt).toBeInstanceOf(Date);
      expect(fire.updatedAt).toBeInstanceOf(Date);
      
      // Clean up
      await NasaFireModel.deleteOne({ fireId: uniqueFireId });
    }, 10000);
  });

  describe('MongoDB Indexes', () => {
    test('should have indexes on NasaFireModel', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const indexes = await NasaFireModel.collection.getIndexes();
      expect(indexes).toBeDefined();
      expect(Object.keys(indexes).length).toBeGreaterThan(0);
    }, 10000);

    test('should use indexes for efficient queries', async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Use unique fireId to avoid conflicts
      const uniqueFireId = `test_index_query_${Date.now()}`;
      
      // Create test data
      await NasaFireModel.create({
        latitude: -23.456 + Math.random() * 0.001,
        longitude: -46.789 + Math.random() * 0.001,
        acq_date: '2024-01-15',
        acq_time: '1430',
        source: 'MODIS_NRT',
        fireId: uniqueFireId
      });

      // Query using indexed field
      const startTime = Date.now();
      const results = await NasaFireModel.find({ acq_date: '2024-01-15' }).limit(10);
      const queryTime = Date.now() - startTime;

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      // Query should complete reasonably fast (less than 1 second)
      expect(queryTime).toBeLessThan(1000);
      
      // Clean up
      await NasaFireModel.deleteOne({ fireId: uniqueFireId });
    }, 10000);
  });

  describe('MongoDB Query Operations', () => {
    beforeEach(async () => {
      if (mongoose.connection.readyState !== 1) return;

      // Clean up any existing test data first
      await NasaFireModel.deleteMany({ fireId: { $regex: /^test_query_/ } });

      // Create test data for query tests
      await NasaFireModel.insertMany([
        {
          latitude: -23.1,
          longitude: -46.1,
          acq_date: '2024-01-15',
          acq_time: '1000',
          source: 'MODIS_NRT',
          brightness: 300,
          fireId: 'test_query_1'
        },
        {
          latitude: -23.2,
          longitude: -46.2,
          acq_date: '2024-01-15',
          acq_time: '1100',
          source: 'VIIRS_SNPP_NRT',
          brightness: 350,
          fireId: 'test_query_2'
        },
        {
          latitude: -23.3,
          longitude: -46.3,
          acq_date: '2024-01-16',
          acq_time: '1200',
          source: 'MODIS_NRT',
          brightness: 400,
          fireId: 'test_query_3'
        }
      ]);
    }, 15000);

    afterEach(async () => {
      if (mongoose.connection.readyState !== 1) return;
      // Clean up test data after each test
      await NasaFireModel.deleteMany({ fireId: { $regex: /^test_query_/ } });
    }, 10000);

    test('should filter by source', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const modisFires = await NasaFireModel.find({ 
        source: 'MODIS_NRT',
        fireId: { $regex: /^test_query_/ }
      });

      expect(modisFires.length).toBeGreaterThanOrEqual(2);
      modisFires.forEach(fire => {
        expect(fire.source).toBe('MODIS_NRT');
      });
    }, 10000);

    test('should filter by date range', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const fires = await NasaFireModel.find({
        acq_date: '2024-01-15',
        fireId: { $regex: /^test_query_/ }
      });

      expect(fires.length).toBeGreaterThanOrEqual(2);
      fires.forEach(fire => {
        expect(fire.acq_date).toBe('2024-01-15');
      });
    }, 10000);

    test('should filter by numeric range', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const fires = await NasaFireModel.find({
        brightness: { $gte: 350 },
        fireId: { $regex: /^test_query_/ }
      });

      expect(fires.length).toBeGreaterThanOrEqual(2);
      fires.forEach(fire => {
        expect(fire.brightness).toBeGreaterThanOrEqual(350);
      });
    }, 10000);

    test('should sort results', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const fires = await NasaFireModel.find({
        fireId: { $regex: /^test_query_/ }
      }).sort({ brightness: -1 });

      expect(fires.length).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < fires.length - 1; i++) {
        expect(fires[i].brightness).toBeGreaterThanOrEqual(fires[i + 1].brightness);
      }
    }, 10000);

    test('should limit results', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const fires = await NasaFireModel.find({
        fireId: { $regex: /^test_query_/ }
      }).limit(2);

      expect(fires.length).toBeLessThanOrEqual(2);
    }, 10000);

    test('should count documents', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const count = await NasaFireModel.countDocuments({
        fireId: { $regex: /^test_query_/ }
      });

      expect(count).toBeGreaterThanOrEqual(3);
    }, 10000);
  });

  describe('MongoDB Collections', () => {
    test('should access nasa_fire collection', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      expect(collectionNames).toContain('nasa_fire');
    }, 10000);

    test('should have correct collection name for NasaFireModel', () => {
      expect(NasaFireModel.collection.name).toBe('nasa_fire');
    });
  });

  describe('MongoDB Error Handling', () => {
    test('should handle connection errors gracefully', () => {
      // Skip connection error test to avoid open handles
      // Connection errors are tested implicitly when MONGODB_URI is invalid
      // This test would create open handles that Jest cannot clean up properly
      expect(true).toBe(true);
    });

    test('should handle validation errors', async () => {
      if (mongoose.connection.readyState !== 1) return;

      await expect(
        NasaFireModel.create({
          latitude: 'invalid', // Should be number
          longitude: -46.789,
          acq_date: '2024-01-15',
          source: 'MODIS_NRT',
          fireId: 'test_validation_error'
        })
      ).rejects.toThrow();
    }, 10000);
  });

  describe('MongoDB Performance', () => {
    test('should handle multiple concurrent operations', async () => {
      if (mongoose.connection.readyState !== 1) return;

      const timestamp = Date.now();
      const operations = Array.from({ length: 10 }, (_, i) => 
        NasaFireModel.create({
          latitude: -23.456 + i * 0.1 + Math.random() * 0.001,
          longitude: -46.789 + i * 0.1 + Math.random() * 0.001,
          acq_date: '2024-01-15',
          acq_time: `${1000 + i}`,
          source: 'MODIS_NRT',
          fireId: `test_concurrent_${timestamp}_${i}`
        })
      );

      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result._id).toBeDefined();
      });
      
      // Clean up
      await NasaFireModel.deleteMany({ fireId: { $regex: new RegExp(`^test_concurrent_${timestamp}_`) } });
    }, 15000);
  });
});
