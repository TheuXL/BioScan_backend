import axios, { AxiosInstance } from 'axios';
import type { AnyBulkWriteOperation } from 'mongoose';
import * as cron from 'node-cron';
import {
  API_CONFIG,
  DEFAULT_SYNC_CATEGORIES,
  GBIF_IUCN_CATEGORIES,
  GbifIucnCategory,
  HTTP_CONFIG,
  SOURCE_ID,
  SYNC_CONFIG
} from './ExtinctionTypes';
import { ThreatenedOccurrenceModel, IThreatenedOccurrence } from './ExtinctionModels';

export interface ExtinctionSyncResult {
  savedCount: number;
  processedPages: number;
  fetchedAt: Date;
  categories: string[];
}

export interface ExtinctionSyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  lastError: string | null;
  interval: string;
}

interface GbifOccurrenceHit {
  key?: number;
  decimalLatitude?: number;
  decimalLongitude?: number;
  scientificName?: string;
  genericName?: string;
  specificEpithet?: string;
  taxonKey?: number;
  iucnRedListCategory?: string;
  country?: string;
  eventDate?: string;
  basisOfRecord?: string;
  datasetKey?: string;
  publishingOrgKey?: string;
}

interface GbifOccurrenceSearchBody {
  offset?: number;
  limit?: number;
  endOfRecords?: boolean;
  results?: GbifOccurrenceHit[];
}

/** Conjunto de categorias IUCN válidas no GBIF para validação. */
const CATEGORY_SET = new Set<string>(GBIF_IUCN_CATEGORIES);

export function resolveSyncCategoriesFromEnv(): GbifIucnCategory[] {
  const raw = process.env.EXTINCTION_GBIF_IUCN_CATEGORIES?.trim();
  if (!raw) {
    return [...DEFAULT_SYNC_CATEGORIES];
  }
  const parts = raw.split(',').map((s) => s.trim().toUpperCase());
  const valid = parts.filter((p) => CATEGORY_SET.has(p)) as GbifIucnCategory[];
  return valid.length > 0 ? valid : [...DEFAULT_SYNC_CATEGORIES];
}

export function resolveMaxRecordsPerSync(): number {
  const raw = process.env.EXTINCTION_GBIF_MAX_RECORDS_PER_SYNC?.trim();
  const n = raw ? Number.parseInt(raw, 10) : SYNC_CONFIG.DEFAULT_MAX_RECORDS_PER_SYNC;
  if (!Number.isFinite(n) || n < 1) return SYNC_CONFIG.DEFAULT_MAX_RECORDS_PER_SYNC;
  return Math.min(n, 50_000);
}

export function resolvePageSize(): number {
  const raw = process.env.EXTINCTION_GBIF_PAGE_SIZE?.trim();
  const n = raw ? Number.parseInt(raw, 10) : SYNC_CONFIG.DEFAULT_PAGE_SIZE;
  if (!Number.isFinite(n) || n < 1) return SYNC_CONFIG.DEFAULT_PAGE_SIZE;
  return Math.min(n, SYNC_CONFIG.MAX_PAGE_SIZE);
}

/**
 * Sincroniza ocorrências GBIF com categorias Lista Vermelha IUCN indexadas (CR, EN, VU, …).
 * Persistência em MongoDB — dados reais da API pública GBIF.
 */
export class ExtinctionService {
  private readonly client: AxiosInstance;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunningCron: boolean = false;
  private lastSyncTime: Date | null = null;
  private lastSyncError: string | null = null;

  constructor(config?: { timeoutMs?: number }) {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: config?.timeoutMs ?? HTTP_CONFIG.TIMEOUT_MS,
      headers: {
        'User-Agent': HTTP_CONFIG.USER_AGENT,
        Accept: 'application/json'
      },
      paramsSerializer: {
        indexes: null
      }
    });
  }

  /**
   * Pesquisa uma página na API GBIF (HTTP real).
   */
  async fetchGbifOccurrencePage(params: {
    categories: string[];
    offset: number;
    limit: number;
  }): Promise<GbifOccurrenceSearchBody> {
    const searchParams = new URLSearchParams();
    searchParams.set('hasCoordinate', 'true');
    searchParams.set('limit', String(params.limit));
    searchParams.set('offset', String(params.offset));
    for (const c of params.categories) {
      searchParams.append('iucnRedListCategory', c);
    }

    const url = `${API_CONFIG.OCCURRENCE_SEARCH}?${searchParams.toString()}`;
    const response = await this.client.get<GbifOccurrenceSearchBody>(url);

    if (response.status !== 200 || !response.data) {
      throw new Error(`GBIF occurrence search failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  mapHitToDoc(hit: GbifOccurrenceHit, syncedAt: Date): Partial<IThreatenedOccurrence> | null {
    const key = hit.key;
    const lat = hit.decimalLatitude;
    const lon = hit.decimalLongitude;
    const name = hit.scientificName?.trim();
    const cat = hit.iucnRedListCategory?.trim();

    if (
      key === undefined ||
      lat === undefined ||
      lon === undefined ||
      name === undefined ||
      cat === undefined
    ) {
      return null;
    }
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return null;
    }

    const canonical =
      hit.genericName && hit.specificEpithet
        ? `${hit.genericName} ${hit.specificEpithet}`.trim()
        : undefined;

    return {
      gbifOccurrenceKey: key,
      latitude: lat,
      longitude: lon,
      scientificName: name,
      canonicalName: canonical || name,
      iucnRedListCategory: cat,
      taxonKey: hit.taxonKey,
      country: hit.country,
      eventDate: hit.eventDate,
      basisOfRecord: hit.basisOfRecord,
      datasetKey: hit.datasetKey,
      publishingOrgKey: hit.publishingOrgKey,
      lastSyncedAt: syncedAt
    };
  }

  async upsertOccurrenceBatch(hits: GbifOccurrenceHit[]): Promise<number> {
    const syncedAt = new Date();
    const ops: AnyBulkWriteOperation<IThreatenedOccurrence>[] = [];

    for (const hit of hits) {
      const doc = this.mapHitToDoc(hit, syncedAt);
      if (!doc) continue;
      ops.push({
        updateOne: {
          filter: { gbifOccurrenceKey: doc.gbifOccurrenceKey },
          update: { $set: doc },
          upsert: true
        }
      });
    }

    if (ops.length === 0) {
      return 0;
    }

    await ThreatenedOccurrenceModel.bulkWrite(ops, { ordered: false });
    return ops.length;
  }

  /**
   * Sincronização completa: várias páginas até `maxRecords` ou fim do conjunto GBIF.
   */
  async syncThreatenedOccurrences(options?: {
    maxRecords?: number;
    categories?: GbifIucnCategory[];
  }): Promise<ExtinctionSyncResult> {
    const categories = (options?.categories?.length
      ? options.categories
      : resolveSyncCategoriesFromEnv()) as string[];
    const maxRecords = options?.maxRecords ?? resolveMaxRecordsPerSync();
    const pageSize = resolvePageSize();

    let offset = 0;
    let savedCount = 0;
    let processedPages = 0;
    const fetchedAt = new Date();

    while (savedCount < maxRecords) {
      const limit = Math.min(pageSize, maxRecords - savedCount);
      const body = await this.fetchGbifOccurrencePage({ categories, offset, limit });
      processedPages += 1;

      const results = body.results ?? [];
      if (results.length === 0) {
        break;
      }

      const written = await this.upsertOccurrenceBatch(results);
      savedCount += written;

      if (body.endOfRecords) {
        break;
      }
      offset += results.length;
    }

    this.lastSyncTime = fetchedAt;
    this.lastSyncError = null;
    return { savedCount, processedPages, fetchedAt, categories };
  }

  async listOccurrences(filters: {
    limit: number;
    category?: string;
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  }): Promise<IThreatenedOccurrence[]> {
    const q = this.buildMongoFilter(filters);

    return ThreatenedOccurrenceModel.find(q)
      .sort({ lastSyncedAt: -1 })
      .limit(filters.limit)
      .lean()
      .exec();
  }

  async countOccurrences(filters: {
    category?: string;
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  }): Promise<number> {
    const q = this.buildMongoFilter(filters);
    return ThreatenedOccurrenceModel.countDocuments(q);
  }

  private buildMongoFilter(filters: {
    category?: string;
    minLatitude?: number;
    maxLatitude?: number;
    minLongitude?: number;
    maxLongitude?: number;
  }): Record<string, unknown> {
    const q: Record<string, unknown> = {};
    if (filters.category) {
      q.iucnRedListCategory = filters.category;
    }
    if (
      filters.minLatitude !== undefined &&
      filters.maxLatitude !== undefined &&
      filters.minLongitude !== undefined &&
      filters.maxLongitude !== undefined
    ) {
      q.latitude = { $gte: filters.minLatitude, $lte: filters.maxLatitude };
      q.longitude = { $gte: filters.minLongitude, $lte: filters.maxLongitude };
    }
    return q;
  }

  startSync(interval: string = SYNC_CONFIG.INTERVAL): void {
    if (this.isRunningCron) {
      console.log('Extinction (GBIF) sync service is already running.');
      return;
    }

    console.log(`Starting Extinction / GBIF sync service (interval: ${interval})`);

    this.syncThreatenedOccurrences()
      .then((r) => {
        console.log(
          `[extinction] Initial GBIF sync saved ${r.savedCount} occurrence updates across ${r.processedPages} page(s).`
        );
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.lastSyncError = msg;
        console.error('Initial extinction (GBIF) sync failed:', msg);
      });

    this.cronJob = cron.schedule(
      interval,
      async () => {
        try {
          const r = await this.syncThreatenedOccurrences();
          console.log(
            `[extinction] Scheduled GBIF sync: ${r.savedCount} updates, ${r.processedPages} page(s).`
          );
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          this.lastSyncError = msg;
          console.error('Scheduled extinction (GBIF) sync failed:', msg);
        }
      },
      { timezone: SYNC_CONFIG.TIMEZONE }
    );

    this.isRunningCron = true;
    console.log('Extinction / GBIF sync service started successfully.');
  }

  stopSync(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      this.isRunningCron = false;
      console.log('Extinction / GBIF sync service stopped.');
    }
  }

  getSyncStatus(): ExtinctionSyncStatus {
    return {
      isRunning: this.isRunningCron,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastSyncError,
      interval: SYNC_CONFIG.INTERVAL
    };
  }

  /** Identificador lógico da fonte (metadados / health). */
  getSourceId(): typeof SOURCE_ID {
    return SOURCE_ID;
  }
}
