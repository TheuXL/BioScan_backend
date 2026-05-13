import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, HTTP_CONFIG, QUERY_LIMIT_MAX } from './OpenAqTypes';

/** Lê chave do servidor: `OPENAQ_API_KEY` (recomendado) ou legado `OPENAQ-API-KEY` no .env. */
export function resolveOpenAqApiKey(): string | undefined {
  const k =
    process.env.OPENAQ_API_KEY?.trim() ||
    process.env['OPENAQ-API-KEY']?.trim();
  return k || undefined;
}

/**
 * Cliente OpenAQ v3. Requer `X-API-Key` em cada pedido (ver docs).
 * @see https://docs.openaq.org/using-the-api/api-key
 */
export class OpenAqService {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(config?: { apiKey?: string; timeoutMs?: number }) {
    const key = config?.apiKey ?? resolveOpenAqApiKey();
    if (!key) {
      throw new Error(
        'OpenAQ: defina OPENAQ_API_KEY no .env (chave em https://explore.openaq.org/register).'
      );
    }
    this.apiKey = key;
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: config?.timeoutMs ?? HTTP_CONFIG.TIMEOUT_MS,
      headers: {
        'User-Agent': HTTP_CONFIG.USER_AGENT,
        Accept: 'application/json',
        [HTTP_CONFIG.API_KEY_HEADER]: this.apiKey
      }
    });
  }

  private toParamRecord(query: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;
      out[k] = Array.isArray(raw) ? raw.map(String).join(',') : String(raw);
    }
    if (out.limit) {
      const n = parseInt(out.limit, 10);
      if (!Number.isNaN(n) && n > QUERY_LIMIT_MAX) {
        out.limit = String(QUERY_LIMIT_MAX);
      }
    }
    return out;
  }

  private async getJson(path: string, params?: Record<string, string>): Promise<unknown> {
    const response = await this.client.get<unknown>(path, { params });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`OpenAQ GET ${path} failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  async getLocations(params: Record<string, string>): Promise<unknown> {
    return this.getJson('/locations', params);
  }

  async getLocationById(id: string): Promise<unknown> {
    return this.getJson(`/locations/${encodeURIComponent(id)}`);
  }

  async getLocationLatest(id: string): Promise<unknown> {
    return this.getJson(`/locations/${encodeURIComponent(id)}/latest`);
  }

  async getCountries(params?: Record<string, string>): Promise<unknown> {
    return this.getJson('/countries', params);
  }

  async getParameters(params?: Record<string, string>): Promise<unknown> {
    return this.getJson('/parameters', params);
  }

  parseExpressQuery(query: Record<string, unknown>): Record<string, string> {
    return this.toParamRecord(query);
  }
}
