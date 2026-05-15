/**
 * NASA EONET (Earth Observatory Natural Event Tracker) — API v2.1.
 * @see https://eonet.gsfc.nasa.gov/docs/v2.1
 */

export const API_CONFIG = {
  BASE_URL: 'https://eonet.gsfc.nasa.gov/api/v2.1',
  EVENTS: 'https://eonet.gsfc.nasa.gov/api/v2.1/events',
  CATEGORIES: 'https://eonet.gsfc.nasa.gov/api/v2.1/categories',
  SOURCES: 'https://eonet.gsfc.nasa.gov/api/v2.1/sources',
  LAYERS: 'https://eonet.gsfc.nasa.gov/api/v2.1/layers'
} as const;

export const HTTP_CONFIG = {
  TIMEOUT_MS: 30_000,
  USER_AGENT: 'BioScan-Backend/1.0 (NASA-EONET)'
} as const;

export const EVENT_STATUS = ['open', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];
