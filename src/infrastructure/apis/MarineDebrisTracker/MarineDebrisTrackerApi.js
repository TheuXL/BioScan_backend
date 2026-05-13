/**
 * @deprecated Usar o módulo TypeScript `OceanPollution` e rotas `GET /api/ocean-pollution/*`
 * (proxy EPA R9 ArcGIS — ver `src/infrastructure/apis/OceanPollution/`).
 */
class MarineDebrisTrackerApi {
  constructor() {
    // Initialize with necessary configurations
  }

  async getData() {
    throw new Error('Use o módulo OceanPollution (TypeScript) e GET /api/ocean-pollution/*.');
  }
}

module.exports = MarineDebrisTrackerApi; 