import mongoose, { Schema, Model, Document } from 'mongoose';
import { StationType, COLLECTION } from './NasaGistempTypes';

export interface IGlobalTemperature extends Document {
  year: number;
  month: string;
  anomaly: number;
  uncertainty?: number;
  stationType: StationType;
  createdAt?: Date;
  updatedAt?: Date;
}

const globalTemperatureSchema = new Schema<IGlobalTemperature>({
  year: {
    type: Number,
    required: true,
    index: true,
    min: 1880 // GISTEMP data starts from 1880
  },
  month: {
    type: String,
    required: true,
    enum: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    index: true
  },
  anomaly: {
    type: Number,
    required: true
  },
  uncertainty: {
    type: Number,
    required: false
  },
  stationType: {
    type: String,
    required: true,
    enum: Object.values(StationType),
    default: StationType.LAND_OCEAN
  }
}, { 
  timestamps: true,
  collection: COLLECTION.NAME
});

// Create compound index for efficient queries and uniqueness
globalTemperatureSchema.index({ year: 1, month: 1, stationType: 1 }, { unique: true });
globalTemperatureSchema.index({ year: -1 }); // For recent data queries
globalTemperatureSchema.index({ stationType: 1 }); // For filtering by type

export const GlobalTemperatureModel: Model<IGlobalTemperature> = mongoose.model<IGlobalTemperature>(
  'GlobalTemperature', 
  globalTemperatureSchema, 
  COLLECTION.NAME
);
