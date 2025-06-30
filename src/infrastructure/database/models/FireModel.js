const mongoose = require('mongoose');

const fireSchema = new mongoose.Schema({
  type: { type: String, default: 'FeatureCollection' },
  features: [{
    type: { type: String, default: 'Feature' },
    geometry: {
      type: { type: String, enum: ['Point', 'MultiPoint'] },
      coordinates: [Number] // [longitude, latitude]
    },
    properties: {
      brightness: Number,
      scan: Number,
      track: Number,
      acq_date: String,
      acq_time: String,
      satellite: String,
      instrument: String,
      confidence: String,
      version: String,
      bright_t31: Number,
      frp: Number,
      daynight: String
    }
  }],
}, { timestamps: true });

const Fire = mongoose.model('Fire', fireSchema);

module.exports = Fire; 