const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Environment configuration
const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Keys
  apiKeys: {
    firmsApiKey: process.env.FIRMS_API_KEY,
    gfwApiKey: process.env.GFW_API_KEY,
    oceanPollutionApiKey: process.env.OCEAN_POLLUTION_API_KEY,
    globalTempApiKey: process.env.GLOBAL_TEMP_API_KEY,
    iceMeltApiKey: process.env.ICE_MELT_API_KEY,
    extinctionApiKey: process.env.EXTINCTION_API_KEY
  },
  
  // API Base URLs
  apiUrls: {
    firmsBaseUrl: process.env.FIRMS_BASE_URL || 'https://firms.modaps.eosdis.nasa.gov/api',
    gfwBaseUrl: process.env.GFW_BASE_URL || 'https://api.globalforestwatch.org',
    oceanPollutionBaseUrl: process.env.OCEAN_POLLUTION_BASE_URL,
    globalTempBaseUrl: process.env.GLOBAL_TEMP_BASE_URL,
    iceMeltBaseUrl: process.env.ICE_MELT_BASE_URL,
    extinctionBaseUrl: process.env.EXTINCTION_BASE_URL
  }
};

module.exports = config; 