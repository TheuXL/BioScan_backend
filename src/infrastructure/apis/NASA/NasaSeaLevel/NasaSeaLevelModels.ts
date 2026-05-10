import mongoose, { Schema, Model, Document } from 'mongoose';
import { COLLECTION, SEA_LEVEL_SOURCE_ID, SeaLevelPayload } from './NasaSeaLevelTypes';

export interface ISeaLevelSnapshot extends Document {
  source: typeof SEA_LEVEL_SOURCE_ID;
  payload: SeaLevelPayload;
  fetchedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const seaLevelSchema = new Schema<ISeaLevelSnapshot>(
  {
    source: {
      type: String,
      required: true,
      enum: [SEA_LEVEL_SOURCE_ID],
      default: SEA_LEVEL_SOURCE_ID,
      unique: true
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true
    },
    fetchedAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true,
    collection: COLLECTION.NAME
  }
);

export const SeaLevelSnapshotModel: Model<ISeaLevelSnapshot> = mongoose.model<ISeaLevelSnapshot>(
  'SeaLevelSnapshot',
  seaLevelSchema,
  COLLECTION.NAME
);
