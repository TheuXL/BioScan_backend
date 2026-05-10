/**
 * NASA Sea Level module — types and config.
 *
 * Ordem de pedidos HTTP (primeiro 200 válido ganha):
 * 1. `process.env.SEA_LEVEL_DATA_URL` — URL completa (ex.: ficheiro NASA/NOAA que consigas hospedar ou aceder)
 * 2. `{NasaSeaLevelService baseURL}/sea-level` — legado Climate Tools (muitos DNS já não resolvem `api.climatetools.org`)
 * 3. `FALLBACK_URLS` — JSON estático NASA/JPL (amostra; não substitui série GMSL oficial para ciência)
 *
 * Referência: https://sealevel.nasa.gov/data/
 */

export const API_CONFIG = {
  BASE_URL: 'https://api.climatetools.org',
  ENDPOINT: '/sea-level',
  /** Respostas JSON reais servidas pela NASA/JPL quando o primário falha (rede/DNS). */
  FALLBACK_URLS: ['https://sealevel.nexus.jpl.nasa.gov/assets/sample.json'] as const
} as const;

/** Documento único na coleção (id lógico; conteúdo pode vir de vários URLs). */
export const SEA_LEVEL_SOURCE_ID = 'climate_tools_global' as const;

export const COLLECTION = {
  NAME: 'nasa_sea_level'
} as const;

export const SYNC_CONFIG = {
  INTERVAL: '0 0 * * 0', // Weekly Sunday 00:00 UTC
  TIMEZONE: 'UTC'
} as const;

/** Raw JSON from Climate Tools — shape may evolve; stored as Mixed in MongoDB. */
export type SeaLevelPayload = Record<string, unknown> | unknown[];

export interface SyncResult {
  saved: boolean;
  fetchedAt: Date;
}

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  interval: string;
}
