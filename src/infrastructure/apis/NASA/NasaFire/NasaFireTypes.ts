/**
 * Constants and type definitions for NASA Fire API
 */

// Valid satellite data sources
export enum FireSource {
  MODIS_NRT = 'MODIS_NRT',
  VIIRS_SNPP_NRT = 'VIIRS_SNPP_NRT',
  VIIRS_NOAA20_NRT = 'VIIRS_NOAA20_NRT'
}

// Default values
export const DEFAULTS = {
  SOURCE: FireSource.MODIS_NRT,
  DAYS: 1,
  /** NASA FIRMS Area API accepts day range 1–5 only */
  MAX_DAYS: 5,
  MIN_DAYS: 1,
  /** Use literal `world` per FIRMS docs (equivalent to -180,-90,180,90) */
  BBOX_GLOBAL: 'world',
  LIMIT: 1000
} as const;

// API Configuration
/** FIRMS Area CSV is the supported bulk format; /area/json currently returns HTTP 400. */
export const API_CONFIG = {
  BASE_URL: 'https://firms.modaps.eosdis.nasa.gov/api',
  ENDPOINTS: {
    AREA: '/area/csv'
  }
} as const;

/**
 * Approximate west,south,east,north bounding boxes (ISO 3166-1 alpha-3).
 * FIRMS /country/* endpoints often return "Invalid API call" (2025+); we query /area/csv with these boxes instead.
 */
export const COUNTRY_BBOX: Record<string, string> = {
  BRA: '-75,-35,-30,5'
};

// MongoDB Collection
export const COLLECTION = {
  NAME: 'nasa_fire'
} as const;

// Sync Service Configuration
export const SYNC_CONFIG = {
  INTERVAL: '*/1 * * * *', // Every minute
  TIMEZONE: 'UTC'
} as const;

// Type definitions
export interface FireData {
  latitude: number;
  longitude: number;
  brightness?: number;
  scan?: number;
  track?: number;
  acq_date: string;
  acq_time?: string;
  satellite?: string;
  instrument?: string;
  confidence?: string;
  version?: string;
  bright_t31?: number;
  frp?: number;
  daynight?: 'D' | 'N';
}

export interface GetActiveFiresOptions {
  source?: FireSource;
  days?: number;
  bbox?: string;
}

export interface GetActiveFiresByCountryOptions {
  countryCode: string;
  source?: FireSource;
  days?: number;
}

export interface SyncResult {
  saved: number;
  skipped: number;
  errors: number;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  interval: string;
}
