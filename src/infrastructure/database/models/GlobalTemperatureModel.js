const mongoose = require('mongoose');

const globalTemperatureSchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  value: { type: Number, required: true }, // Temperature anomaly value
  datatype: String, // e.g., TAVG (Temperature Average)
  station: String, // Identifier for the station or source if available
  // Add more fields if NOAA NCEI API returns other relevant data
}, { timestamps: true });

const GlobalTemperature = mongoose.model('GlobalTemperature', globalTemperatureSchema);

module.exports = GlobalTemperature; 