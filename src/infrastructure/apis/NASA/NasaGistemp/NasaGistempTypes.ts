/**
 * Constants and type definitions for NASA GISTEMP API
 */

// Data source types
export enum StationType {
  LAND_OCEAN = 'Land-Ocean',
  LAND_ONLY = 'Land-Only',
  OCEAN_ONLY = 'Ocean-Only'
}

// Default values
export const DEFAULTS = {
  STATION_TYPE: StationType.LAND_OCEAN,
  CRON_INTERVAL: '0 0 * * 0', // Every Sunday at midnight
  TIMEZONE: 'UTC'
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://data.giss.nasa.gov/gistemp',
  ENDPOINTS: {
    MONTHLY_ANOMALIES: '/tabledata_v4/GLB.Ts+dSST.txt' as const, // Land-Ocean
    LAND_ONLY: '/tabledata_v4/GLB.Ts.txt' as const, // Land only
    OCEAN_ONLY: '/tabledata_v4/GLB.Ts+dSST.txt' as const // Ocean only
  }
} as const;

// MongoDB Collection
export const COLLECTION = {
  NAME: 'nasa_gistemp'
} as const;

// Sync Service Configuration
export const SYNC_CONFIG = {
  INTERVAL: '0 0 * * 0', // Every Sunday at midnight (weekly)
  TIMEZONE: 'UTC'
} as const;

// Type definitions
export interface TemperatureData {
  year: number;
  month: string;
  anomaly: number; // Temperature anomaly in Celsius
  uncertainty?: number; // Uncertainty margin
  stationType: StationType;
}

// Raw data is now plain text (TXT format)
// No interface needed - we parse the text directly

export interface SyncResult {
  saved: number;
  updated: number;
  skipped: number;
  errors: number;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  interval: string;
}

export interface GetTemperatureOptions {
  startYear?: number;
  endYear?: number;
  stationType?: StationType;
  month?: string;
}
