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
  /** Opcional: total que satisfaz os filtros (ex.: Mongo antes do `limit`). */
  totalMatching?: number;
  pontos: PontoGloboV1[];
}

export const LIMITS = {
  DEFAULT: 150,
  MIN: 1,
  MAX: 500
} as const;
