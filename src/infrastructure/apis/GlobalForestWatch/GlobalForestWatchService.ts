import axios, { AxiosInstance } from 'axios';
import { API_CONFIG, HTTP_CONFIG } from './GlobalForestWatchTypes';

/** Chave GFW Data API (criar em https://data-api.globalforestwatch.org/ — ver documentação Auth). */
export function resolveGfwApiKey(): string | undefined {
  const k =
    process.env.GFW_API_KEY?.trim() ||
    process.env.GFW_DATA_API_KEY?.trim();
  return k || undefined;
}

/**
 * Cabeçalho `Origin` enviado com `x-api-key`. Deve coincidir com um dos `domains`
 * registados na criação da chave (ex.: `http://localhost` se a allowlist tiver `localhost`).
 */
export function resolveGfwApiOrigin(): string {
  const o = process.env.GFW_API_ORIGIN?.trim();
  return o || 'http://localhost';
}

/**
 * Cliente proxy para GFW Data API.
 * `ping`, `datasets` e `fields` funcionam sem chave; `query/json` exige `x-api-key`.
 */
export class GlobalForestWatchService {
  private readonly client: AxiosInstance;
  private readonly apiKey?: string;

  constructor(config?: { apiKey?: string; timeoutMs?: number }) {
    this.apiKey = config?.apiKey ?? resolveGfwApiKey();
    const headers: Record<string, string> = {
      'User-Agent': HTTP_CONFIG.USER_AGENT,
      Accept: 'application/json'
    };
    if (this.apiKey) {
      headers[HTTP_CONFIG.API_KEY_HEADER] = this.apiKey;
      headers.Origin = resolveGfwApiOrigin();
    }
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: config?.timeoutMs ?? HTTP_CONFIG.TIMEOUT_MS,
      headers
    });
  }

  hasApiKey(): boolean {
    return Boolean(this.apiKey);
  }

  private async getJson(path: string, params?: Record<string, string>): Promise<unknown> {
    const response = await this.client.get<unknown>(path, { params });
    if (response.status !== 200 || response.data === undefined) {
      throw new Error(`GFW GET ${path} failed. HTTP ${response.status}`);
    }
    return response.data;
  }

  async getPing(): Promise<unknown> {
    return this.getJson('/ping');
  }

  async getDatasets(): Promise<unknown> {
    return this.getJson('/datasets');
  }

  async getFields(dataset: string, version: string): Promise<unknown> {
    const path = `/dataset/${encodeURIComponent(dataset)}/${encodeURIComponent(version)}/fields`;
    return this.getJson(path);
  }

  /**
   * Consulta SQL sobre um dataset/versão. Requer chave API (403 sem chave).
   * @see https://data-api.globalforestwatch.org/dataset/{dataset}/{version}/query/json
   */
  async queryJson(
    dataset: string,
    version: string,
    params: { sql: string; geostore_id?: string; geostore_origin?: string }
  ): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error(
        'GFW Data API: defina GFW_API_KEY no .env para executar consultas SQL (query/json).'
      );
    }
    const path = `/dataset/${encodeURIComponent(dataset)}/${encodeURIComponent(version)}/query/json`;
    const q: Record<string, string> = { sql: params.sql };
    if (params.geostore_id) q.geostore_id = params.geostore_id;
    if (params.geostore_origin) q.geostore_origin = params.geostore_origin;
    return this.getJson(path, q);
  }

  parseExpressQuery(query: Record<string, unknown>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, raw] of Object.entries(query)) {
      if (raw === undefined || raw === null) continue;
      out[k] = Array.isArray(raw) ? raw.map(String).join(',') : String(raw);
    }
    return out;
  }
}
