const mongoose = require('mongoose');

const oceanPollutionSchema = new mongoose.Schema({
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  report_date: { type: Date, default: Date.now },
  reporter_id: String, // If applicable
  // Add more fields as per Marine Debris Tracker data structure
}, { timestamps: true });

const OceanPollution = mongoose.model('OceanPollution', oceanPollutionSchema);

module.exports = OceanPollution; 