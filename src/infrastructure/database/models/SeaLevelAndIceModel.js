const mongoose = require('mongoose');

const seaLevelAndIceSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  sea_level_anomaly: { type: Number, required: true }, // in mm
  source: String, // e.g., 'NASA Sea Level', 'NSIDC'
  // Add more fields if NSIDC provides specific ice melt data
}, { timestamps: true });

const SeaLevelAndIce = mongoose.model('SeaLevelAndIce', seaLevelAndIceSchema);

module.exports = SeaLevelAndIce; 