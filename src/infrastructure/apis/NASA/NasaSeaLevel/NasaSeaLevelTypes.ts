/**
 * NASA Sea Level module — types and config.
 *
 * Ordem de pedidos HTTP (primeiro 200 válido ganha):
 * 1. `process.env.SEA_LEVEL_DATA_URL` — URL completa (recomendado em produção)
 * 2. `{NasaSeaLevelService baseURL}/sea-level` — legado Climate Tools (DNS frequentemente indisponível)
 * 3. `FALLBACK_URLS` — metadados NASA CMR (JSON estável; não é série temporal GMSL)
 * 4. Se ainda falhar e o ambiente permitir: ficheiro empacotado `data/default-sea-level-snapshot.json` (só dev/test por defeito)
 *
 * Referência: https://sealevel.nasa.gov/data/
 */

export const API_CONFIG = {
  BASE_URL: 'https://api.climatetools.org',
  ENDPOINT: '/sea-level',
  /**
   * URLs HTTP adicionais (GET JSON). O antigo `sealevel.nexus.jpl.nasa.gov` falha muito com ENOTFOUND.
   * CMR devolve metadados de coleção GMSL (útil como “último recurso” HTTP antes do snapshot empacotado).
   */
  FALLBACK_URLS: [
    'https://cmr.earthdata.nasa.gov/search/collections.json?keyword=NASA_SSH_GMSL&page_size=1'
  ] as const
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
