import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, HTTP_CONFIG } from './NasaEonetTypes';

/**
 * Proxy on-demand para NASA EONET v2.1 (eventos naturais georreferenciados).
 * Sem MongoDB — camadas toggláveis no globo.
 */
export class NasaEonetService {
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

  private async getJson(url: string, params?: Record<string, string>): Promise<unknown> {
    const response = await this.client.get<unknown>(url, { params });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`EONET request failed. HTTP ${response.status} for ${url}`);
    }
    return response.data;
  }

  /** GET /events — source, status, limit, days (ver documentação EONET). */
  async getEvents(params: Record<string, string>): Promise<unknown> {
    return this.getJson(API_CONFIG.EVENTS, params);
  }

  /** Lista de categorias ou eventos filtrados por categoria (path id). */
  async getCategories(categoryId?: string, params?: Record<string, string>): Promise<unknown> {
    const url = categoryId ? `${API_CONFIG.CATEGORIES}/${categoryId}` : API_CONFIG.CATEGORIES;
    return this.getJson(url, params);
  }

  /** Catálogo de fontes EONET. */
  async getSources(): Promise<unknown> {
    return this.getJson(API_CONFIG.SOURCES);
  }

  /** Camadas WMS/WMTS por categoria (path id opcional). */
  async getLayers(categoryId?: string): Promise<unknown> {
    const url = categoryId ? `${API_CONFIG.LAYERS}/${categoryId}` : API_CONFIG.LAYERS;
    return this.getJson(url);
  }

  parseExpressQuery(query: Record<string, unknown>): Record<string, string> {
    return this.toParamRecord(query);
  }
}
