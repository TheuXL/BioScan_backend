/**
 * Espécies ameaçadas / risco — ocorrências georreferenciadas via GBIF.
 * Filtra por categorias da Lista Vermelha IUCN tal como indexadas no GBIF (ex.: CR, EN, VU).
 * @see https://www.gbif.org/
 * @see https://www.gbif.org/citation-guidelines
 */

export const API_CONFIG = {
  BASE_URL: 'https://api.gbif.org/v1',
  OCCURRENCE_SEARCH: '/occurrence/search'
} as const;

/** Categorias IUCN usadas no índice de ocorrências GBIF (campo facet IUCN_RED_LIST_CATEGORY). */
export const GBIF_IUCN_CATEGORIES = [
  'EX',
  'EW',
  'CR',
  'EN',
  'VU',
  'NT',
  'LC',
  'DD',
  'CD'
] as const;

export type GbifIucnCategory = (typeof GBIF_IUCN_CATEGORIES)[number];

export const DEFAULT_SYNC_CATEGORIES: readonly GbifIucnCategory[] = ['CR', 'EN', 'VU'];

export const COLLECTION = {
  NAME: 'extinction_gbif_occurrence'
} as const;

export const SOURCE_ID = 'gbif_threatened_occurrences' as const;

export const SYNC_CONFIG = {
  /** Semanal — domingo 05:00 UTC (pedidos moderados à API GBIF). */
  INTERVAL: '0 5 * * 0',
  TIMEZONE: 'UTC',
  DEFAULT_MAX_RECORDS_PER_SYNC: 600,
  DEFAULT_PAGE_SIZE: 300,
  MAX_PAGE_SIZE: 300,
  MAX_QUERY_LIMIT: 500
} as const;

export const HTTP_CONFIG = {
  TIMEOUT_MS: 120_000,
  USER_AGENT: 'BioScan-Backend/1.0 (GBIF-occurrence-sync; https://github.com/)'
} as const;
