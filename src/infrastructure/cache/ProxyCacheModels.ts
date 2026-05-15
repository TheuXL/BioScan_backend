import mongoose, { Schema, type Model } from 'mongoose';

export const PROXY_CACHE_COLLECTION = 'proxy_cache_entries';

export interface ProxyCacheEntryDoc extends mongoose.Document {
  source: string;
  scopeKey: string;
  resourceKey: string;
  payload: Record<string, unknown>;
  contentHash: string;
  lastRefreshedAt: Date;
}

const proxyCacheSchema = new Schema<ProxyCacheEntryDoc>(
  {
    source: { type: String, required: true },
    scopeKey: { type: String, required: true },
    resourceKey: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    contentHash: { type: String, required: true },
    lastRefreshedAt: { type: Date, required: true }
  },
  {
    timestamps: true,
    collection: PROXY_CACHE_COLLECTION
  }
);

proxyCacheSchema.index({ source: 1, scopeKey: 1, resourceKey: 1 }, { unique: true });
proxyCacheSchema.index({ source: 1, scopeKey: 1, lastRefreshedAt: 1 });

const MODEL_NAME = 'ProxyCacheEntry';

export function getProxyCacheEntryModel(): Model<ProxyCacheEntryDoc> {
  if (mongoose.models[MODEL_NAME]) {
    return mongoose.models[MODEL_NAME] as Model<ProxyCacheEntryDoc>;
  }
  return mongoose.model<ProxyCacheEntryDoc>(MODEL_NAME, proxyCacheSchema);
}
