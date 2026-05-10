import axios, { AxiosInstance } from 'axios';
import * as cron from 'node-cron';
import { 
  StationType,
  DEFAULTS,
  API_CONFIG,
  SYNC_CONFIG,
  TemperatureData,
  GetTemperatureOptions,
  SyncResult,
  SyncStatus
} from './NasaGistempTypes';
import { GlobalTemperatureModel } from './NasaGistempModels';

/**
 * NASA GISTEMP Service
 * Handles business logic for NASA GISTEMP data ingestion and synchronization
 */
export class NasaGistempService {
  private client: AxiosInstance;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private lastSyncTime: Date | null = null;

  constructor(config?: { baseUrl?: string }) {
    this.client = axios.create({
      baseURL: config?.baseUrl || API_CONFIG.BASE_URL,
      timeout: 60000, // 60 seconds timeout (increased for large TXT files)
      responseType: 'text', // Receive as text for TXT format
      headers: {
        'User-Agent': 'BioScan-Backend/1.0',
        'Accept': 'text/plain'
      }
    });
  }

  /**
   * Fetches temperature data from NASA GISTEMP API and saves to MongoDB
   */
  async fetchTemperatureData(stationType: StationType = DEFAULTS.STATION_TYPE): Promise<TemperatureData[]> {
    try {
      let endpoint: string = API_CONFIG.ENDPOINTS.MONTHLY_ANOMALIES;
      
      // Select endpoint based on station type
      if (stationType === StationType.LAND_ONLY) {
        endpoint = API_CONFIG.ENDPOINTS.LAND_ONLY;
      } else if (stationType === StationType.OCEAN_ONLY) {
        endpoint = API_CONFIG.ENDPOINTS.OCEAN_ONLY;
      }

      const response = await this.client.get<string>(endpoint);

      if (response.status === 200 && response.data) {
        const temperatureData = this.parseTemperatureData(response.data, stationType);
        
        // Save to MongoDB automatically on every request (async, don't wait)
        if (temperatureData.length > 0) {
          this.saveTemperatureData(temperatureData).catch(error => {
            console.error('Error auto-saving temperature data:', error.message);
          });
        }
        
        return temperatureData;
      } else {
        throw new Error(`Failed to fetch GISTEMP data. Status: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error fetching NASA GISTEMP data:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
        console.error('Status:', error.response.status);
      }
      throw new Error('Could not fetch temperature data from NASA GISTEMP.');
    }
  }

  /**
   * Saves temperature data to MongoDB (used internally)
   * Called automatically by fetchTemperatureData to save data on every request
   */
  private async saveTemperatureData(temperatureData: TemperatureData[]): Promise<{ saved: number; updated: number }> {
    let saved = 0;
    let updated = 0;

    for (const data of temperatureData) {
      try {
        const result = await GlobalTemperatureModel.updateOne(
          { 
            year: data.year, 
            month: data.month, 
            stationType: data.stationType 
          },
          { 
            $set: { 
              anomaly: data.anomaly,
              uncertainty: data.uncertainty,
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          saved++;
        } else if (result.modifiedCount > 0) {
          updated++;
        }
      } catch (error: any) {
        // Log error but continue processing other records
        console.error(`Error saving temperature data for ${data.year}-${data.month}:`, error.message);
      }
    }

    return { saved, updated };
  }

  /**
   * Parses raw GISTEMP TXT data into structured format
   * Format: Fixed-width text with Year, Jan-Dec columns
   * Example: "1880   -19  -25  -10  -17  -11  -22  -19  -11  -15  -24  -23  -18    -18 ***   ****  -13  -17  -21  1880"
   */
  private parseTemperatureData(rawText: string, stationType: StationType): TemperatureData[] {
    const temperatureData: TemperatureData[] = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Invalid GISTEMP data: expected text string');
    }

    const lines = rawText.split('\n');
    
    // Find the start of data rows (after header lines)
    let dataStartIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('Year') && lines[i].includes('Jan')) {
        // Found header row, data starts 2 lines after (skip header and separator)
        dataStartIndex = i + 2;
        break;
      }
    }

    // Process data rows
    for (let i = dataStartIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines, header repeats, and footer
      if (!line || !line.trim() || 
          line.trim().startsWith('Year') || 
          line.trim().startsWith('Divide by') || 
          line.trim().startsWith('Example') ||
          line.trim().startsWith('____')) {
        continue;
      }

      // Parse fixed-width format
      // Format: Year (4 chars) + spaces + Jan (5-6 chars) + Feb (5-6 chars) + ... + Dec (5-6 chars)
      // Example: "1880   -19  -25  -10..."
      
      // Extract year (first 4 digits at the start)
      const yearMatch = line.match(/^\s*(\d{4})/);
      if (!yearMatch) {
        continue; // Skip lines that don't start with a year
      }

      const year = parseInt(yearMatch[1]);
      if (isNaN(year) || year < 1880 || year > new Date().getFullYear() + 1) {
        continue; // Skip invalid years
      }

      // Extract monthly values - split by whitespace and take first 12 numeric values after year
      // Remove year from line and split by whitespace
      const lineWithoutYear = line.substring(4).trim();
      const parts = lineWithoutYear.split(/\s+/);
      
      // Process first 12 parts as monthly values (Jan-Dec)
      for (let monthIndex = 0; monthIndex < 12 && monthIndex < parts.length; monthIndex++) {
        const valueStr = parts[monthIndex].trim();
        
        // Skip missing values (marked as ***** or *** or empty)
        if (!valueStr || valueStr === '*****' || valueStr === '***' || valueStr === '') {
          continue;
        }

        // Parse value (GISTEMP uses scale 100x, e.g., 120 = 1.2°C, -19 = -0.19°C)
        const numValue = parseFloat(valueStr);
        
        if (isNaN(numValue)) {
          continue; // Skip non-numeric values
        }

        // Convert from scale 100x to actual Celsius
        const anomaly = numValue / 100;
        
        if (!isNaN(anomaly)) {
          temperatureData.push({
            year,
            month: months[monthIndex],
            anomaly,
            stationType
          });
        }
      }
    }

    return temperatureData;
  }

  /**
   * Synchronizes temperature data from API to MongoDB
   * Note: fetchTemperatureData already saves automatically, this method provides detailed sync statistics
   */
  async syncTemperatureData(stationType: StationType = DEFAULTS.STATION_TYPE): Promise<SyncResult> {
    try {
      console.log(`[${new Date().toISOString()}] Starting GISTEMP data sync...`);
      
      // Temporarily disable auto-save to get detailed statistics
      // We'll save manually and track results
      let endpoint: string = API_CONFIG.ENDPOINTS.MONTHLY_ANOMALIES;
      
      if (stationType === StationType.LAND_ONLY) {
        endpoint = API_CONFIG.ENDPOINTS.LAND_ONLY;
      } else if (stationType === StationType.OCEAN_ONLY) {
        endpoint = API_CONFIG.ENDPOINTS.OCEAN_ONLY;
      }

      const response = await this.client.get<string>(endpoint);

      if (response.status !== 200 || !response.data) {
        throw new Error(`Failed to fetch GISTEMP data. Status: ${response.status}`);
      }

      const temperatureData = this.parseTemperatureData(response.data, stationType);

      if (!Array.isArray(temperatureData) || temperatureData.length === 0) {
        console.log(`[${new Date().toISOString()}] No temperature data received.`);
        return { saved: 0, updated: 0, skipped: 0, errors: 0 };
      }

      console.log(`[${new Date().toISOString()}] Received ${temperatureData.length} temperature records.`);

      // Save and get detailed statistics
      const saveStats = await this.saveTemperatureData(temperatureData);

      let saved = saveStats.saved;
      let updated = saveStats.updated;
      let skipped = Math.max(0, temperatureData.length - saved - updated);
      let errors = 0;

      console.log(`[${new Date().toISOString()}] Sync completed: ${saved} saved, ${updated} updated, ${skipped} skipped, ${errors} errors.`);

      return { saved, updated, skipped, errors };
    } catch (error: any) {
      console.error('Error in syncTemperatureData:', error.message);
      throw error;
    }
  }

  /**
   * Gets temperature data from MongoDB
   */
  async getTemperatureData(options: GetTemperatureOptions = {}): Promise<TemperatureData[]> {
    const {
      startYear,
      endYear,
      stationType = DEFAULTS.STATION_TYPE,
      month
    } = options;

    const query: any = {
      stationType
    };

    if (startYear || endYear) {
      query.year = {};
      if (startYear) query.year.$gte = startYear;
      if (endYear) query.year.$lte = endYear;
    }

    if (month) {
      query.month = month;
    }

    const documents = await GlobalTemperatureModel.find(query)
      .sort({ year: 1, month: 1 })
      .lean();

    return documents.map(doc => ({
      year: doc.year,
      month: doc.month,
      anomaly: doc.anomaly,
      uncertainty: doc.uncertainty,
      stationType: doc.stationType as StationType
    }));
  }

  /**
   * Starts automatic synchronization service
   */
  startSync(interval: string = SYNC_CONFIG.INTERVAL): void {
    if (this.isRunning) {
      console.log('GISTEMP sync service is already running.');
      return;
    }

    console.log(`Starting NASA GISTEMP Sync Service (interval: ${interval})`);

    this.cronJob = cron.schedule(interval, async () => {
      try {
        await this.syncTemperatureData();
        this.lastSyncTime = new Date();
      } catch (error: any) {
        console.error('Error in scheduled GISTEMP sync:', error.message);
      }
    }, {
      timezone: SYNC_CONFIG.TIMEZONE
    });

    this.isRunning = true;
    console.log('NASA GISTEMP Sync Service started successfully.');
  }

  /**
   * Stops automatic synchronization service
   */
  stopSync(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log('NASA GISTEMP Sync Service stopped.');
    }
  }

  /**
   * Gets current sync service status
   */
  getSyncStatus(): SyncStatus {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      interval: SYNC_CONFIG.INTERVAL
    };
  }
}
