/**
 * Poluição marinha / lixo — fontes públicas.
 * EPA Region 9 — ArcGIS REST (sem chave).
 * @see https://gispub.epa.gov/arcgis/rest/services/R9MarineDebris
 */

export const API_CONFIG = {
  /** ArcGIS REST da EPA (GISpub). */
  EPA_ARCGIS_BASE: 'https://gispub.epa.gov/arcgis',
  /** Serviço de pasta R9MarineDebris. */
  EPA_R9_FOLDER: 'R9MarineDebris'
} as const;

/** MapServers documentados na pasta R9MarineDebris (alinhado ao catálogo público). */
export const EPA_R9_MARINE_DEBRIS_DATASETS = [
  'ER1402150_MarineDebrisData',
  'LosAngeles_ApproachingZeroTrash',
  'SanFranciscoBayArea_BaselineTrashLoadEstimate'
] as const;

export type EpaR9MarineDebrisDataset = (typeof EPA_R9_MARINE_DEBRIS_DATASETS)[number];

export const HTTP_CONFIG = {
  TIMEOUT_MS: 60_000,
  USER_AGENT: 'BioScan-Backend/1.0 (EPA-R9-MarineDebris-proxy)',
  MAX_WHERE_LEN: 500,
  DEFAULT_RESULT_RECORD_COUNT: 25,
  MAX_RESULT_RECORD_COUNT: 5000
} as const;
