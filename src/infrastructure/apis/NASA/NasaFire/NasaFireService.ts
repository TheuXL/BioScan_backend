import axios, { AxiosInstance } from 'axios';
import * as cron from 'node-cron';
import { 
  FireSource, 
  DEFAULTS, 
  API_CONFIG, 
  SYNC_CONFIG,
  FireData,
  GetActiveFiresOptions,
  GetActiveFiresByCountryOptions,
  SyncResult,
  SyncStatus,
  COUNTRY_BBOX
} from './NasaFireTypes';
import { NasaFireModel } from './NasaFireModels';

function parseOptionalFloat(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = parseFloat(value);
  return Number.isNaN(n) ? undefined : n;
}

/** Parse NASA FIRMS CSV (MODIS or VIIRS column sets) into FireData rows. */
function parseFirmsCsv(csvText: string): FireData[] {
  const trimmed = csvText.trim();
  if (!trimmed.toLowerCase().startsWith('latitude')) {
    return [];
  }
  const lines = trimmed.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const out: FireData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = cols[j] ?? '';
    });

    const lat = parseFloat(row.latitude);
    const lon = parseFloat(row.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;

    const brightness =
      row.brightness !== undefined && row.brightness !== ''
        ? parseOptionalFloat(row.brightness)
        : parseOptionalFloat(row.bright_ti4);

    out.push({
      latitude: lat,
      longitude: lon,
      brightness,
      scan: parseOptionalFloat(row.scan),
      track: parseOptionalFloat(row.track),
      acq_date: row.acq_date ?? '',
      acq_time: row.acq_time !== undefined && row.acq_time !== '' ? String(row.acq_time) : undefined,
      satellite: row.satellite || undefined,
      instrument: row.instrument || undefined,
      confidence: row.confidence !== undefined && row.confidence !== '' ? String(row.confidence) : undefined,
      version: row.version || undefined,
      bright_t31: parseOptionalFloat(row.bright_t31 ?? row.bright_ti5),
      frp: parseOptionalFloat(row.frp),
      daynight: row.daynight === 'D' || row.daynight === 'N' ? row.daynight : undefined
    });
  }

  return out;
}

/**
 * NASA Fire Service
 * Handles business logic for NASA FIRMS API interactions and data synchronization
 */
export class NasaFireService {
  private apiKey: string;
  private client: AxiosInstance;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private lastSyncTime: Date | null = null;

  constructor(config: { apiKey: string; baseUrl?: string }) {
    if (!config.apiKey) {
      throw new Error('NASA FIRMS API key is required.');
    }
    this.apiKey = config.apiKey.trim();
    this.client = axios.create({
      baseURL: config.baseUrl || API_CONFIG.BASE_URL,
    });
  }

  /**
   * Fetches active fire data for a global area (worldwide)
   */
  async getActiveFires(options: GetActiveFiresOptions = {}): Promise<FireData[]> {
    const { 
      source = DEFAULTS.SOURCE, 
      days = DEFAULTS.DAYS, 
      bbox = DEFAULTS.BBOX_GLOBAL 
    } = options;

    // Validate source
    if (!Object.values(FireSource).includes(source)) {
      throw new Error(`Unsupported source: ${source}. Valid sources: ${Object.values(FireSource).join(', ')}`);
    }

    // Validate days
    if (days < DEFAULTS.MIN_DAYS || days > DEFAULTS.MAX_DAYS) {
      throw new Error(`Days parameter must be between ${DEFAULTS.MIN_DAYS} and ${DEFAULTS.MAX_DAYS}.`);
    }

    try {
      // Build URL: /api/area/csv/{MAP_KEY}/{source}/{bbox}/{days}
      const requestPath = `${API_CONFIG.ENDPOINTS.AREA}/${this.apiKey}/${source}/${bbox}/${days}`;

      const response = await this.client.get<string>(requestPath, { responseType: 'text' });

      if (response.status === 200 && typeof response.data === 'string') {
        const fires = parseFirmsCsv(response.data);
        if (fires.length === 0 && response.data.length > 0 && !response.data.trim().toLowerCase().startsWith('latitude')) {
          console.error('NASA FIRMS area response was not CSV:', response.data.slice(0, 500));
          throw new Error('NASA FIRMS returned a non-CSV body for area request.');
        }
        return fires;
      }
      throw new Error(`Failed to fetch fire data. Status: ${response.status}`);
    } catch (error: unknown) {
      if (error instanceof Error && (error.message.includes('Unsupported source') || error.message.includes('Days parameter must be between'))) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('NASA FIRMS returned a non-CSV')) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const raw = error.response?.data;
        const snippet =
          typeof raw === 'string'
            ? raw.slice(0, 300)
            : raw !== undefined
              ? JSON.stringify(raw).slice(0, 300)
              : '';
        console.error('Error fetching NASA FIRMS data:', error.message, status ?? '', snippet);
        throw new Error(
          `Could not fetch active fire data from NASA FIRMS.${status != null ? ` HTTP ${status}` : ''}${snippet ? ` — ${snippet}` : ''}`
        );
      }
      console.error('Error fetching NASA FIRMS data:', error);
      throw new Error('Could not fetch active fire data from NASA FIRMS.');
    }
  }

  /**
   * Fetches active fire data for a specific country
   */
  async getActiveFiresByCountry(options: GetActiveFiresByCountryOptions): Promise<FireData[]> {
    const { 
      countryCode, 
      source = DEFAULTS.SOURCE, 
      days = DEFAULTS.DAYS 
    } = options;

    if (!countryCode) {
      throw new Error('Country code is required.');
    }

    if (!Object.values(FireSource).includes(source)) {
      throw new Error(`Unsupported source: ${source}. Valid sources: ${Object.values(FireSource).join(', ')}`);
    }

    if (days < DEFAULTS.MIN_DAYS || days > DEFAULTS.MAX_DAYS) {
      throw new Error(`Days parameter must be between ${DEFAULTS.MIN_DAYS} and ${DEFAULTS.MAX_DAYS}.`);
    }

    const code = countryCode.toUpperCase();
    const bbox = COUNTRY_BBOX[code];
    if (!bbox) {
      throw new Error(
        `Unsupported country code: ${countryCode}. FIRMS country endpoints are unreliable; add "${code}" to COUNTRY_BBOX in NasaFireTypes or call getActiveFires with a bbox.`
      );
    }

    return this.getActiveFires({ source, days, bbox });
  }

  /**
   * Synchronizes fire data from API to MongoDB
   */
  async syncFireData(source: FireSource = DEFAULTS.SOURCE): Promise<SyncResult> {
    try {
      console.log(`[${new Date().toISOString()}] Starting fire data sync...`);
      
      // Fetch global fire data (last 24 hours)
      const fireData = await this.getActiveFires({ 
        source, 
        days: DEFAULTS.DAYS,
        bbox: DEFAULTS.BBOX_GLOBAL
      });

      if (!Array.isArray(fireData) || fireData.length === 0) {
        console.log(`[${new Date().toISOString()}] No fire data received.`);
        return { saved: 0, skipped: 0, errors: 0 };
      }

      const maxRaw = process.env.FIRMS_SYNC_MAX_RECORDS;
      const maxRecords = maxRaw !== undefined && maxRaw !== '' ? parseInt(maxRaw, 10) : NaN;
      const toProcess =
        Number.isFinite(maxRecords) && maxRecords > 0 && fireData.length > maxRecords
          ? fireData.slice(0, maxRecords)
          : fireData;

      if (toProcess.length < fireData.length) {
        console.log(
          `[${new Date().toISOString()}] FIRMS_SYNC_MAX_RECORDS=${maxRecords}: processing ${toProcess.length} of ${fireData.length} detections.`
        );
      }

      console.log(`[${new Date().toISOString()}] Received ${fireData.length} fire detections; processing ${toProcess.length}.`);

      let saved = 0;
      let skipped = 0;
      let errors = 0;

      // Process each fire detection
      for (const fire of toProcess) {
        try {
          // Create unique identifier for duplicate detection
          const fireId = `${fire.latitude}_${fire.longitude}_${fire.acq_date}_${fire.acq_time}_${source}`;

          // Check if fire already exists
          const existingFire = await NasaFireModel.findOne({ fireId });
          
          if (existingFire) {
            skipped++;
            continue;
          }

          // Create new fire document
          const fireDocument = new NasaFireModel({
            latitude: fire.latitude,
            longitude: fire.longitude,
            brightness: fire.brightness,
            scan: fire.scan,
            track: fire.track,
            acq_date: fire.acq_date,
            acq_time: fire.acq_time,
            satellite: fire.satellite,
            instrument: fire.instrument,
            confidence: fire.confidence,
            version: fire.version,
            bright_t31: fire.bright_t31,
            frp: fire.frp,
            daynight: fire.daynight,
            source: source,
            fireId: fireId
          });

          await fireDocument.save();
          saved++;
        } catch (error: any) {
          // Handle duplicate key errors gracefully
          if (error.code === 11000) {
            skipped++;
          } else {
            errors++;
            console.error(`Error saving fire detection:`, error.message);
          }
        }
      }

      this.lastSyncTime = new Date();
      console.log(`[${new Date().toISOString()}] Sync completed: ${saved} saved, ${skipped} skipped, ${errors} errors.`);
      
      return { saved, skipped, errors };
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Error in fire data sync:`, error.message);
      throw error;
    }
  }

  /**
   * Starts the cron job to sync fire data periodically
   */
  startSync(interval: string = SYNC_CONFIG.INTERVAL): void {
    if (this.isRunning) {
      console.log('Fire sync service is already running.');
      return;
    }

    console.log(`Starting NASA Fire Sync Service (interval: ${interval})`);
    
    // Run immediately on start
    this.syncFireData().catch(err => {
      console.error('Initial sync failed:', err.message);
    });

    // Schedule periodic sync
    this.cronJob = cron.schedule(interval, async () => {
      try {
        await this.syncFireData();
      } catch (error: any) {
        console.error('Scheduled sync failed:', error.message);
      }
    }, {
      timezone: SYNC_CONFIG.TIMEZONE
    });

    this.isRunning = true;
    console.log('NASA Fire Sync Service started successfully.');
  }

  /**
   * Stops the cron job
   */
  stopSync(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log('NASA Fire Sync Service stopped.');
    }
  }

  /**
   * Gets the status of the sync service
   */
  getSyncStatus(): SyncStatus {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      interval: SYNC_CONFIG.INTERVAL
    };
  }
}
