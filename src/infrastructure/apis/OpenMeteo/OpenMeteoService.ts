import axios, { AxiosInstance } from 'axios';
import {
  API_CONFIG,
  DEFAULT_FORECAST_PARAMS,
  DEFAULT_AIR_QUALITY_PARAMS,
  HTTP_CONFIG
} from './OpenMeteoTypes';

/**
 * Cliente on-demand para Open-Meteo (previsão, arquivo, qualidade do ar).
 * Não persiste em MongoDB — proxy stateless para o globo / camada contextual.
 */
export class OpenMeteoService {
  private readonly client: AxiosInstance;

  constructor(config?: { timeoutMs?: number }) {
    this.client = axios.create({
      timeout: config?.timeoutMs ?? HTTP_CONFIG.TIMEOUT_MS,
      headers: {
        'User-Agent': HTTP_CONFIG.USER_AGENT,
        Accept: 'application/json'
      }
    });
  }

  private toParamRecord(query: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;
      out[key] = Array.isArray(raw) ? raw.map(String).join(',') : String(raw);
    }
    return out;
  }

  /**
   * Previsão + tempo atual (api.open-meteo.com).
   * `params` deve incluir latitude e longitude (números ou strings).
   */
  async getForecast(params: Record<string, string>): Promise<unknown> {
    const merged: Record<string, string> = {
      ...DEFAULT_FORECAST_PARAMS,
      ...params
    };
    const response = await this.client.get<unknown>(API_CONFIG.FORECAST, { params: merged });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`Open-Meteo forecast failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  /**
   * Arquivo histórico (archive-api.open-meteo.com). Exige start_date, end_date (YYYY-MM-DD).
   */
  async getArchive(params: Record<string, string>): Promise<unknown> {
    const response = await this.client.get<unknown>(API_CONFIG.ARCHIVE, { params });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`Open-Meteo archive failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  /**
   * Qualidade do ar (air-quality-api.open-meteo.com).
   */
  async getAirQuality(params: Record<string, string>): Promise<unknown> {
    const merged: Record<string, string> = {
      ...DEFAULT_AIR_QUALITY_PARAMS,
      ...params
    };
    const response = await this.client.get<unknown>(API_CONFIG.AIR_QUALITY, { params: merged });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`Open-Meteo air quality failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  /** Normaliza req.query do Express para parâmetros Open-Meteo. */
  parseExpressQuery(query: Record<string, unknown>): Record<string, string> {
    return this.toParamRecord(query);
  }
}
