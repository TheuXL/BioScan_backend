import axios, { AxiosInstance } from 'axios';
import {
  API_CONFIG,
  DEFAULT_QUERY_PARAMS,
  FeedWindow,
  HTTP_CONFIG
} from './UsgsEarthquakeTypes';

/**
 * Proxy on-demand para USGS Earthquakes (FDSNWS + feeds GeoJSON).
 * Sem MongoDB — adequado a camada de pontos no globo.
 */
export class UsgsEarthquakeService {
  private readonly client: AxiosInstance;

  constructor(config?: { timeoutMs?: number }) {
    this.client = axios.create({
      timeout: config?.timeoutMs ?? HTTP_CONFIG.TIMEOUT_MS,
      headers: {
        'User-Agent': HTTP_CONFIG.USER_AGENT,
        Accept: 'application/json, application/geo+json'
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
   * Consulta FDSNWS Event (formato GeoJSON por omissão).
   * Parâmetros USGS: starttime, endtime, minmagnitude, bbox, limit, eventid, etc.
   */
  async queryEvents(params: Record<string, string>): Promise<unknown> {
    const merged: Record<string, string> = {
      ...DEFAULT_QUERY_PARAMS,
      ...params
    };
    const response = await this.client.get<unknown>(API_CONFIG.QUERY, { params: merged });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`USGS event query failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  /** Feed GeoJSON agregado (ex. significant_week). */
  async getFeed(window: FeedWindow): Promise<unknown> {
    const url = `${API_CONFIG.FEED_BASE}/${window}.geojson`;
    const response = await this.client.get<unknown>(url);
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`USGS feed "${window}" failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  parseExpressQuery(query: Record<string, unknown>): Record<string, string> {
    return this.toParamRecord(query);
  }
}
