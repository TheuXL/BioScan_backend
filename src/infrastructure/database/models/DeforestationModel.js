const mongoose = require('mongoose');

const deforestationSchema = new mongoose.Schema({
  data: Object, // General object to store raw deforestation data from GFW
  timestamp: { type: Date, default: Date.now },
  // You might want to add more specific fields here based on GFW API response
  // For example: 
  // alerts: [{}],
  // loss_gain: {},
  // region: String,
});

const Deforestation = mongoose.model('Deforestation', deforestationSchema);

module.exports = Deforestation; 