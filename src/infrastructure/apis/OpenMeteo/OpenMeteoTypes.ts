/**
 * Open-Meteo — meteorologia e qualidade do ar (tier gratuito, sem chave).
 * @see https://open-meteo.com/en/docs
 */

export const API_CONFIG = {
  FORECAST: 'https://api.open-meteo.com/v1/forecast',
  ARCHIVE: 'https://archive-api.open-meteo.com/v1/archive',
  AIR_QUALITY: 'https://air-quality-api.open-meteo.com/v1/air-quality'
} as const;

/** Valores por omissão úteis para contexto no globo (sobrescrevíveis via query). */
export const DEFAULT_FORECAST_PARAMS = {
  current:
    'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',
  hourly: 'temperature_2m,precipitation_probability,weather_code',
  daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum',
  timezone: 'auto',
  forecast_days: '7'
} as const;

export const DEFAULT_AIR_QUALITY_PARAMS = {
  current: 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone',
  timezone: 'auto'
} as const;

export const HTTP_CONFIG = {
  TIMEOUT_MS: 30_000,
  USER_AGENT: 'BioScan-Backend/1.0 (Open-Meteo)'
} as const;
