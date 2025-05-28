/**
 * Fire entity representing a wildfire or active fire detection
 */
class Fire {
  /**
   * Create a new Fire instance
   * @param {Object} fireData - Raw fire data from API
   */
  constructor(fireData) {
    this.id = fireData.id || `fire-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.latitude = fireData.latitude;
    this.longitude = fireData.longitude;
    this.brightness = fireData.brightness;
    this.scanDate = fireData.scan_date || fireData.scanDate || new Date().toISOString();
    this.confidence = fireData.confidence || 'nominal';
    this.source = fireData.source || 'NASA FIRMS';
    this.satellite = fireData.satellite || 'VIIRS';
    this.countryCode = fireData.countryCode || null;
  }

  /**
   * Get the location as GeoJSON point
   * @returns {Object} GeoJSON point object
   */
  toGeoJSON() {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [this.longitude, this.latitude]
      },
      properties: {
        id: this.id,
        brightness: this.brightness,
        scanDate: this.scanDate,
        confidence: this.confidence,
        source: this.source,
        satellite: this.satellite,
        countryCode: this.countryCode
      }
    };
  }

  /**
   * Create Fire instances from an array of raw data
   * @param {Array} rawData - Array of raw fire data from API
   * @returns {Array<Fire>} Array of Fire instances
   */
  static createFromArray(rawData) {
    if (!Array.isArray(rawData)) {
      throw new Error('Input must be an array');
    }
    
    return rawData.map(item => new Fire(item));
  }
}

module.exports = Fire; 