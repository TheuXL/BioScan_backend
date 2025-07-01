const mongoose = require('mongoose');

const endangeredSpeciesSchema = new mongoose.Schema({
  scientific_name: { type: String, required: true, unique: true },
  common_name: String,
  conservation_status: { type: String, required: true }, // e.g., 'Critically Endangered', 'Endangered', 'Vulnerable'
  habitat: String,
  population_trend: String,
  redlist_url: String,
  // Add more fields as per IUCN Red List API data structure
}, { timestamps: true });

const EndangeredSpecies = mongoose.model('EndangeredSpecies', endangeredSpeciesSchema);

module.exports = EndangeredSpecies; 