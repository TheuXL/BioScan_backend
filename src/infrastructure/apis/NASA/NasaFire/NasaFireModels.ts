import mongoose, { Schema, Model, Document } from 'mongoose';
import { FireSource, COLLECTION } from './NasaFireTypes';

export interface INasaFire extends Document {
  latitude: number;
  longitude: number;
  brightness?: number;
  scan?: number;
  track?: number;
  acq_date: string;
  acq_time?: string;
  satellite?: string;
  instrument?: string;
  confidence?: string;
  version?: string;
  bright_t31?: number;
  frp?: number;
  daynight?: 'D' | 'N';
  source: FireSource;
  fireId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const nasaFireSchema = new Schema<INasaFire>({
  latitude: {
    type: Number,
    required: true,
    index: true
  },
  longitude: {
    type: Number,
    required: true,
    index: true
  },
  brightness: {
    type: Number,
    required: false
  },
  scan: {
    type: Number,
    required: false
  },
  track: {
    type: Number,
    required: false
  },
  acq_date: {
    type: String,
    required: true,
    index: true
  },
  acq_time: {
    type: String,
    required: false
  },
  satellite: {
    type: String,
    required: false
  },
  instrument: {
    type: String,
    required: false
  },
  confidence: {
    type: String,
    required: false
  },
  version: {
    type: String,
    required: false
  },
  bright_t31: {
    type: Number,
    required: false
  },
  frp: {
    type: Number,
    required: false
  },
  daynight: {
    type: String,
    enum: ['D', 'N'],
    required: false
  },
  source: {
    type: String,
    required: true,
    enum: Object.values(FireSource)
  },
  fireId: {
    type: String,
    unique: true,
    sparse: true
  }
}, { 
  timestamps: true,
  collection: COLLECTION.NAME
});

// Create compound index for efficient queries
nasaFireSchema.index({ latitude: 1, longitude: 1, acq_date: 1 });
nasaFireSchema.index({ acq_date: -1 });

// Generate unique fireId before saving
nasaFireSchema.pre('save', function(next) {
  if (!this.fireId && this.latitude && this.longitude && this.acq_date && this.acq_time) {
    this.fireId = `${this.latitude}_${this.longitude}_${this.acq_date}_${this.acq_time}_${this.source}`;
  }
  next();
});

export const NasaFireModel: Model<INasaFire> = mongoose.model<INasaFire>('NasaFire', nasaFireSchema, COLLECTION.NAME);
