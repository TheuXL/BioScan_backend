import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as cron from 'node-cron';
import {
  API_CONFIG,
  SYNC_CONFIG,
  SeaLevelPayload,
  SyncResult,
  SyncStatus,
  SEA_LEVEL_SOURCE_ID
} from './NasaSeaLevelTypes';
import { SeaLevelSnapshotModel } from './NasaSeaLevelModels';

/**
 * Sea level / ice-melt: tenta várias URLs públicas até obter HTTP 200 (ver NasaSeaLevelTypes).
 */
export class NasaSeaLevelService {
  public readonly client: AxiosInstance;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private lastSyncTime: Date | null = null;

  constructor(config?: { baseUrl?: string }) {
    this.client = axios.create({
      baseURL: config?.baseUrl || API_CONFIG.BASE_URL,
      timeout: 60000,
      headers: {
        'User-Agent': 'BioScan-Backend/1.0',
        Accept: 'application/json, text/plain, */*'
      }
    });
  }

  private resolveCandidateUrls(): string[] {
    const base = String(this.client.defaults.baseURL || '').replace(/\/$/, '');
    const primaryFromClient = `${base}${API_CONFIG.ENDPOINT}`;
    const raw = [
      process.env.SEA_LEVEL_DATA_URL?.trim(),
      primaryFromClient,
      ...API_CONFIG.FALLBACK_URLS
    ].filter((u): u is string => Boolean(u));
    return [...new Set(raw)];
  }

  private normalizeBody(data: unknown, url: string): SeaLevelPayload {
    if (data === null || data === undefined) {
      throw new Error(`Empty body from ${url}`);
    }
    if (typeof data === 'string') {
      return { _format: 'text', _sourceUrl: url, text: data } as Record<string, unknown>;
    }
    if (typeof data !== 'object') {
      throw new Error(`Non-object body from ${url}`);
    }
    if (Array.isArray(data)) {
      return data;
    }
    return { ...(data as Record<string, unknown>), _bioScanSourceUrl: url };
  }

  private formatAggregateError(lastErr: unknown, urls: string[]): string {
    const tail = axios.isAxiosError(lastErr)
      ? `${lastErr.message}${lastErr.code ? ` (${lastErr.code})` : ''}`
      : lastErr instanceof Error
        ? lastErr.message
        : String(lastErr);
    return (
      `Could not fetch sea level data from any URL. Last error: ${tail}. ` +
      `Tried: ${urls.join(', ')}. Set SEA_LEVEL_DATA_URL in .env to a reachable JSON or text URL. ` +
      `In development/test, a bundled snapshot is used if SEA_LEVEL_ALLOW_BUNDLED_FALLBACK is not false. ` +
      `In production, set SEA_LEVEL_DATA_URL or SEA_LEVEL_ALLOW_BUNDLED_FALLBACK=true (not recommended for science use).`
    );
  }

  /**
   * Fetches sea level / related JSON (or text) from the first reachable candidate URL.
   */
  async fetchGlobalSeaLevel(): Promise<SeaLevelPayload> {
    const urls = this.resolveCandidateUrls();
    let lastErr: unknown;

    for (const url of urls) {
      try {
        const response = await axios.get<unknown>(url, {
          timeout: 60000,
          headers: {
            'User-Agent': 'BioScan-Backend/1.0',
            Accept: 'application/json, text/plain, */*'
          }
        });

        if (response.status !== 200) {
          lastErr = new Error(`HTTP ${response.status} for ${url}`);
          continue;
        }

        return this.normalizeBody(response.data, url);
      } catch (e) {
        lastErr = e;
      }
    }

    const bundled = this.tryReadBundledFallback();
    if (bundled !== null) {
      console.warn(
        '[ice-melt] Todas as fontes HTTP falharam — a usar snapshot empacotado (desenvolvimento). ' +
          'Defina SEA_LEVEL_DATA_URL no .env com um URL JSON/txt acessível para dados reais (ex.: NASA PO.DAAC / espelho).'
      );
      return this.normalizeBody(bundled, 'bundled://default-sea-level-snapshot.json');
    }

    throw new Error(this.formatAggregateError(lastErr, urls));
  }

  /**
   * Último recurso: JSON versionado no repo. Ativo em `development` / `test` por defeito;
   * em `production` só se `SEA_LEVEL_ALLOW_BUNDLED_FALLBACK=true`.
   * Desativar: `SEA_LEVEL_ALLOW_BUNDLED_FALLBACK=false`.
   */
  private tryReadBundledFallback(): unknown | null {
    const explicit = process.env.SEA_LEVEL_ALLOW_BUNDLED_FALLBACK?.trim().toLowerCase();
    if (explicit === 'false' || explicit === '0') {
      return null;
    }
    const nodeEnv = process.env.NODE_ENV || 'development';
    const allowInProd = explicit === 'true';
    if (nodeEnv === 'production' && !allowInProd) {
      return null;
    }
    try {
      const filePath = path.join(__dirname, 'data', 'default-sea-level-snapshot.json');
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }

  /**
   * Fetches from API and upserts the single snapshot document in MongoDB.
   */
  async syncSeaLevelData(): Promise<SyncResult> {
    const payload = await this.fetchGlobalSeaLevel();
    const fetchedAt = new Date();

    await SeaLevelSnapshotModel.findOneAndUpdate(
      { source: SEA_LEVEL_SOURCE_ID },
      {
        source: SEA_LEVEL_SOURCE_ID,
        payload,
        fetchedAt
      },
      { upsert: true, new: true }
    );

    this.lastSyncTime = fetchedAt;
    return { saved: true, fetchedAt };
  }

  /**
   * Returns the latest snapshot from MongoDB, or null.
   */
  async getLatestSnapshotFromDb(): Promise<{ source: string; payload: SeaLevelPayload; fetchedAt: Date } | null> {
    const doc = await SeaLevelSnapshotModel.findOne({ source: SEA_LEVEL_SOURCE_ID })
      .sort({ fetchedAt: -1 })
      .lean();

    if (!doc) {
      return null;
    }

    return {
      source: doc.source,
      payload: doc.payload as SeaLevelPayload,
      fetchedAt: doc.fetchedAt
    };
  }

  startSync(interval: string = SYNC_CONFIG.INTERVAL): void {
    if (this.isRunning) {
      console.log('Sea level sync service is already running.');
      return;
    }

    console.log(`Starting NASA Sea Level Sync Service (interval: ${interval})`);

    this.syncSeaLevelData().catch((err) => {
      console.error('Initial sea level sync failed:', err.message);
    });

    this.cronJob = cron.schedule(
      interval,
      async () => {
        try {
          await this.syncSeaLevelData();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error('Scheduled sea level sync failed:', msg);
        }
      },
      { timezone: SYNC_CONFIG.TIMEZONE }
    );

    this.isRunning = true;
    console.log('NASA Sea Level Sync Service started successfully.');
  }

  stopSync(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunning = false;
      console.log('NASA Sea Level Sync Service stopped.');
    }
  }

  getSyncStatus(): SyncStatus {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      interval: SYNC_CONFIG.INTERVAL
    };
  }
}
