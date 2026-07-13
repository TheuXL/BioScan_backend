/**
 * Contrato BioScan globo — v1 (pontos normalizados).
 * O frontend pode consumir qualquer `/api/globe/*` com o mesmo formato de objeto.
 */

export const GLOBE_SCHEMA_VERSION = '1.0' as const;

/** Identificadores lógicos de camada (valor de `tipo` + id de rota). */
export const GLOBE_LAYER_IDS = [
  'incendio',
  'ameacada_gbif',
  'sismo',
  'lixo_marinho',
  'geleira'
] as const;

export type GlobeLayerId = (typeof GLOBE_LAYER_IDS)[number];

/** Um ponto no globo (campos em português). */
export interface PontoGloboV1 {
  lat: number;
  lon: number;
  tipo: string;
  /** ISO 8601 ou null quando desconhecido. */
  momento: string | null;
  /** Nome da fonte de dados (ex.: NASA FIRMS, GBIF). */
  origem: string;
  /** Identificador estável na fonte (único dentro do `tipo` + `origem`). */
  idFonte: string;
  /** Escala textual ou numérica (magnitude, confiança, categoria IUCN, …). */
  severidade: string | number | null;
  titulo?: string;
  /** Campos específicos da fonte sem quebrar o contrato base. */
  detalhes?: Record<string, unknown>;
}

export interface RespostaCamadaGloboV1 {
  schemaVersion: typeof GLOBE_SCHEMA_VERSION;
  camada: string;
  /** Pontos nesta resposta (= `pontos.length`). */
  count: number;
  /** Total que satisfaz os filtros (ex.: Mongo antes de limit/offset). */
  totalMatching?: number;
  /** Índice inicial desta página (query `offset`). */
  offset?: number;
  /** Tamanho de página pedido (query `limit`). */
  limit?: number;
  /** true se ainda existem registos após esta página. */
  hasMore?: boolean;
  pontos: PontoGloboV1[];
}

/**
 * Limites por pedido HTTP.
 * - `MAX` elevado para permitir carregar conjuntos grandes (ex. todos os focos FIRMS) num ou poucos pedidos.
 * - Preferir `offset` + várias páginas no frontend quando o volume for enorme.
 * - Tecto de segurança contra OOM / timeout; não é o total disponível no Mongo.
 */
export const LIMITS = {
  DEFAULT: 500,
  MIN: 1,
  MAX: 50_000
} as const;

export const OFFSET = {
  DEFAULT: 0,
  MIN: 0,
  MAX: 5_000_000
} as const;
