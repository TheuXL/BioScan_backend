/**
 * USGS FDSNWS Event — sismos (GeoJSON).
 * @see https://earthquake.usgs.gov/fdsnws/event/1/
 */

export const API_CONFIG = {
  QUERY: 'https://earthquake.usgs.gov/fdsnws/event/1/query',
  /** Feeds GeoJSON pré-agregados (path `summary/{window}.geojson`). */
  FEED_BASE: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'
} as const;

/** Parâmetros por omissão no proxy BioScan (sobrescrevíveis via query). */
export const DEFAULT_QUERY_PARAMS = {
  format: 'geojson',
  orderby: 'time',
  limit: '100'
} as const;

export const HTTP_CONFIG = {
  TIMEOUT_MS: 30_000,
  USER_AGENT: 'BioScan-Backend/1.0 (USGS-Earthquakes)'
} as const;

/** Janelas de feed suportadas em GET /api/earthquakes/feed/:window */
export const FEED_WINDOWS = [
  'all_hour',
  'all_day',
  'all_week',
  'all_month',
  'significant_hour',
  'significant_day',
  'significant_week',
  'significant_month'
] as const;

export type FeedWindow = (typeof FEED_WINDOWS)[number];
