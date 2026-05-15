import mongoose from 'mongoose';
import { createHash } from 'crypto';
import type { ProxyCacheItem, ReconciliationMode } from './ProxyCacheTypes';
import { stableSerialize } from './proxyCanonical';
import { getProxyCacheEntryModel } from './ProxyCacheModels';

export function payloadContentHash(payload: unknown): string {
  return createHash('sha256').update(stableSerialize(payload)).digest('hex');
}

/** Hash estável do âmbito (namespacing + query normalizada em objeto com chaves ordenadas). */
export function buildScopeKey(namespace: string, query: Record<string, string>): string {
  const sortedKeys = Object.keys(query).sort();
  const normalized: Record<string, string> = {};
  for (const k of sortedKeys) {
    normalized[k] = query[k];
  }
  return createHash('sha256')
    .update(stableSerialize({ ns: namespace, q: normalized }))
    .digest('hex');
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Após fetch bem-sucedido: grava alterações e aplica regras do modo.
 * - **delta**: apenas upserts / refresh de timestamp.
 * - **snapshot**: remove chaves do âmbito que não vieram nesta resposta (conjunto autoritativo).
 * - **hybrid_ttl**: igual ao delta + apaga entradas neste scope com `lastRefreshedAt` < now - ttlMs.
 */
export async function reconcileProxyScope(args: {
  mode: ReconciliationMode;
  source: string;
  scopeKey: string;
  items: ProxyCacheItem[];
  /** Obrigatório para `hybrid_ttl` (milissegundos). */
  ttlMs?: number;
  now?: Date;
}): Promise<void> {
  if (!isMongoConnected()) {
    return;
  }

  const Model = getProxyCacheEntryModel();
  const now = args.now ?? new Date();
  const incomingKeys = new Set(args.items.map((i) => i.resourceKey));

  for (const item of args.items) {
    const contentHash = payloadContentHash(item.payload);
    const filter = {
      source: args.source,
      scopeKey: args.scopeKey,
      resourceKey: item.resourceKey
    };

    const existing = await Model.findOne(filter).lean();
    if (existing && existing.contentHash === contentHash) {
      await Model.updateOne({ _id: existing._id }, { $set: { lastRefreshedAt: now } });
      continue;
    }

    await Model.findOneAndUpdate(
      filter,
      {
        $set: {
          payload: item.payload as Record<string, unknown>,
          contentHash,
          lastRefreshedAt: now
        }
      },
      { upsert: true, new: true }
    );
  }

  if (args.mode === 'snapshot' && incomingKeys.size > 0) {
    await Model.deleteMany({
      source: args.source,
      scopeKey: args.scopeKey,
      resourceKey: { $nin: [...incomingKeys] }
    });
  }

  if (args.mode === 'hybrid_ttl') {
    const ttl = args.ttlMs;
    if (ttl !== undefined && ttl > 0) {
      const cutoff = new Date(now.getTime() - ttl);
      await Model.deleteMany({
        source: args.source,
        scopeKey: args.scopeKey,
        lastRefreshedAt: { $lt: cutoff }
      });
    }
  }
}

/** Lê todos os `payload` guardados neste âmbito (para fallback quando o upstream falha). */
export async function readScopePayloads(source: string, scopeKey: string): Promise<unknown[]> {
  if (!isMongoConnected()) {
    return [];
  }
  const Model = getProxyCacheEntryModel();
  const docs = await Model.find({ source, scopeKey }).sort({ resourceKey: 1 }).lean();
  return docs.map((d) => d.payload);
}

/** Primeiro payload do âmbito — típico de cache por blob único (`__response__`). */
export async function readScopeFirstPayload(
  source: string,
  scopeKey: string
): Promise<unknown | null> {
  const payloads = await readScopePayloads(source, scopeKey);
  return payloads[0] ?? null;
}
