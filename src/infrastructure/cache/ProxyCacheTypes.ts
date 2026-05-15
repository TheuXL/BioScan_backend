/**
 * Modos de reconciliação entre respostas upstream e MongoDB (proxy cache).
 *
 * - **delta**: só UPSERT do que veio; ausência na listagem **não** apaga.
 * - **snapshot**: o conjunto devolvido define o âmbito completo — remove do BioScan o que deixou de vir.
 * - **hybrid_ttl**: como delta nos upserts; remove entradas neste `scopeKey` com `lastRefreshedAt` mais antigo que TTL
 *   (trata listagens parciais sem apagar imediatamente o que não apareceu na página).
 */
export type ReconciliationMode = 'delta' | 'snapshot' | 'hybrid_ttl';

export interface ProxyCacheItem {
  resourceKey: string;
  payload: unknown;
}
