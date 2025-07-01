const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  location_name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  temperature: Number, // in Celsius or Fahrenheit
  humidity: Number, // percentage
  pressure: Number, // hPa
  weather_description: String, // e.g., 'clear sky', 'rain'
  wind_speed: Number,
  // Add more fields as per OpenWeatherMap API data structure
}, { timestamps: true });

const Weather = mongoose.model('Weather', weatherSchema);

module.exports = Weather; 