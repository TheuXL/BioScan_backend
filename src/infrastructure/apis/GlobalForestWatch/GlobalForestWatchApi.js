/**
 * @deprecated Use o módulo TypeScript (`GlobalForestWatchService`, `createGlobalForestWatchRoutes`) e `/api/deforestation`.
 */
class GlobalForestWatchApi {
  constructor() {}

  async getData() {
    throw new Error('Use GlobalForestWatchService (TypeScript) e rotas /api/deforestation.');
  }
}

module.exports = GlobalForestWatchApi; 