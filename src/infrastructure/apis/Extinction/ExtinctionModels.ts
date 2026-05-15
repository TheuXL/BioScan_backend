import mongoose, { Schema, Model, Document } from 'mongoose';
import { COLLECTION } from './ExtinctionTypes';

export interface IThreatenedOccurrence extends Document {
  gbifOccurrenceKey: number;
  latitude: number;
  longitude: number;
  scientificName: string;
  canonicalName?: string;
  iucnRedListCategory: string;
  taxonKey?: number;
  country?: string;
  eventDate?: string;
  basisOfRecord?: string;
  datasetKey?: string;
  publishingOrgKey?: string;
  lastSyncedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const threatenedOccurrenceSchema = new Schema<IThreatenedOccurrence>(
  {
    gbifOccurrenceKey: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    latitude: { type: Number, required: true, index: true },
    longitude: { type: Number, required: true, index: true },
    scientificName: { type: String, required: true, index: true },
    canonicalName: { type: String },
    iucnRedListCategory: { type: String, required: true, index: true },
    taxonKey: { type: Number, index: true },
    country: { type: String, index: true },
    eventDate: { type: String },
    basisOfRecord: { type: String },
    datasetKey: { type: String },
    publishingOrgKey: { type: String },
    lastSyncedAt: { type: Date, required: true, index: true }
  },
  { timestamps: true, collection: COLLECTION.NAME }
);

export const ThreatenedOccurrenceModel: Model<IThreatenedOccurrence> =
  mongoose.models.ThreatenedOccurrence ||
  mongoose.model<IThreatenedOccurrence>('ThreatenedOccurrence', threatenedOccurrenceSchema);
