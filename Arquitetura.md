apis/
└── function-name/
    ├── Function-nameController.ts  # Controllers HTTP
    ├── Function-nameService.ts     # Lógica de negócio
    ├── Function-nameRoutes.ts       # Definição de rotas
    ├── Function-nameTypes.ts       # Tipos TypeScript
    ├── Function-nameModels.ts       # MongoDB Models (se necessário)
    ├── Function-nameMiddleware.ts  # Middlewares (se necessário)
    └── README.md                   # Documentação

### Como usar na prática

- **Delta / listagem parcial** — ideal quando a API só devolve **páginas**, **cursor**, **“últimos N”** ou **mudanças recentes**, sem garantir o conjunto completo.
- **Snapshot completo do âmbito** — quando consegues um pedido (ou sequência controlada) que cobre **100% das entidades** para um filtro bem definido (região, lista de ids, dataset).
- **Híbrido TTL + âmbito** — quando não tens snapshot barato nem eventos de remoção, mas queres **limpeza** e **sem apagar à torto** por causa da paginação.

### Sugestão de disciplina no projeto

Para cada integração (OpenAQ, GFW, USGS só leitura, etc.), num **comentário de módulo** ou numa linha na doc interna, regista:

- **Modo de reconciliação:** delta | snapshot | híbrido TTL.  
- **Âmbito:** o que indexa o cache (ex.: `queryHash` + bbox, ou `locationId` + parâmetro).  
- **Parâmetros:** TTL *T*, ou “full snapshot a cada N horas”.

Assim evitas misturar regras entre serviços e manténs o comportamento **previsível** para o frontend.

### Implementação (`src/infrastructure/cache/`)

- Coleção **`proxy_cache_entries`** (Mongoose `ProxyCacheEntry`), funções `reconcileProxyScope`, `buildScopeKey`, `readScopePayloads`, tipos **`delta` \| `snapshot` \| `hybrid_ttl`** em `ProxyCacheTypes.ts`.
- **Exemplos:** OpenAQ `GET /api/openaq/locations` (`OpenAqLocationsCacheConfig.ts`); Open-Meteo (`OpenMeteoProxyCacheConfig.ts`); USGS (`UsgsEarthquakeProxyCacheConfig.ts`); GFW (`GlobalForestWatchProxyCacheConfig.ts`). Variáveis `.env` correspondentes documentadas em `.env.example`.
