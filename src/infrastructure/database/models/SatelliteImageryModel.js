const mongoose = require('mongoose');

const satelliteImagerySchema = new mongoose.Schema({
  product_id: { type: String, required: true, unique: true },
  title: String,
  platform: String, // e.g., Sentinel-1, Sentinel-2
  sensor_mode: String,
  acquisition_date: { type: Date, required: true },
  cloud_cover: Number,
  footprint_geojson: Object, // GeoJSON for the image footprint
  download_url: String,
  thumbnail_url: String,
  // Add more fields as per Copernicus API data structure
}, { timestamps: true });

const SatelliteImagery = mongoose.model('SatelliteImagery', satelliteImagerySchema);

module.exports = SatelliteImagery; 