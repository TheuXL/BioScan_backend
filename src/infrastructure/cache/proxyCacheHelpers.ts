import type { ProxyCacheItem } from './ProxyCacheTypes';

/** Chave Mongoose quando a resposta upstream é tratada como um único blob (preserva GeoJSON/metadata). */
export const SINGLE_PAYLOAD_RESOURCE_KEY = '__response__' as const;

export function singlePayloadCacheItems(payload: unknown): ProxyCacheItem[] {
  return [{ resourceKey: SINGLE_PAYLOAD_RESOURCE_KEY, payload }];
}

export function withBioscanCacheMeta(payload: unknown, note: string): unknown {
  if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
    return {
      ...(payload as Record<string, unknown>),
      bioscan_meta: { fromBioScanCache: true as const, note }
    };
  }
  return {
    value: payload,
    bioscan_meta: { fromBioScanCache: true as const, note }
  };
}
