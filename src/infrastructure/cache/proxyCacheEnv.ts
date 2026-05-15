import type { ReconciliationMode } from './ProxyCacheTypes';

export function parseProxyReconciliationMode(
  raw: string | undefined,
  fallback: ReconciliationMode = 'hybrid_ttl'
): ReconciliationMode {
  const v = (raw ?? '').toLowerCase().trim();
  if (v === 'delta') return 'delta';
  if (v === 'snapshot') return 'snapshot';
  return fallback;
}

export function parseProxyTtlMsFromSeconds(
  raw: string | undefined,
  defaultSec: number
): number {
  const sec = parseInt(raw ?? String(defaultSec), 10);
  if (!Number.isFinite(sec) || sec <= 0) {
    return defaultSec * 1000;
  }
  return sec * 1000;
}
