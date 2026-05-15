/**
 * @deprecated Utilizar o módulo TypeScript `Extinction` (GBIF + MongoDB) em `GET /api/extinction/*`.
 */
class IUCNRedListApi {
  constructor() {
    // Initialize with necessary configurations
  }

  async getData() {
    throw new Error('Use o módulo Extinction (GBIF) em /api/extinction.');
  }
}

module.exports = IUCNRedListApi; 