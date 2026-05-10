# BioScan Backend

API Node.js que agrega dados ambientais de **fontes públicas globais** (NASA, NOAA, organismos internacionais, etc.), persiste o que fizer sentido em **MongoDB** e expõe tudo via **REST** para aplicações cliente — em especial um **frontend com globo interativo** (estilo “Earth”), onde cada camada de dados pode ser mostrada como pontos ou geometrias sobre o planeta.

Este repositório contém **apenas o backend**. Documentação do frontend será mantida noutro projeto.

---

## Visão do produto (como encaixa o globo)

O objetivo da plataforma BioScan é **tornar visíveis** problemas ambientais globais: incêndios, poluição marinha, derretimento, temperatura, desmatamento, espécies ameaçadas, etc.

- O **backend** é responsável por **integrar dezenas de serviços públicos**, normalizar e guardar dados, e servir **JSON estável** e filtrável.
- O **frontend** (fora deste repo) apresentará um **globo 3D interativo** no qual o utilizador escolhe **que tipo de dados** ver e **onde** navegar; cada registo georreferenciado vindo desta API pode ser desenhado como **marcador**, **heatmap** ou outra camada suportada pela biblioteca de globo (ex.: Cesium, Three.js + globo, Mapbox GL, etc.).

Cada nova fonte pública deve seguir o mesmo padrão: **cliente HTTP → serviço → (opcional) modelo MongoDB → controlador → rota** — para o globo consumir sempre listas com **coordenadas** e metadados consistentes.

---

## Objetivos deste backend

| Objetivo | Descrição |
|----------|-----------|
| **Integração** | Conectar-se a APIs e downloads públicos confiáveis, com chaves onde exigido. |
| **Persistência** | Guardar séries e eventos em coleções MongoDB com índices úteis (tempo, geo, fonte). |
| **API REST** | Expor leitura filtrada e, quando aplicável, sincronização manual ou estado de jobs. |
| **Escalabilidade** | Suportar mais fontes e volume crescente (paginação, limites, quotas respeitadas). |
| **Contrato para o globo** | Respostas com **latitude/longitude** (ou geometria futura) por ponto, mais campos de estilo/cor no cliente. |

---

## Estado atual (resumo honesto)

### Implementado e alinhado com o globo (incêndios — NASA FIRMS)

- **Fonte:** [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (`firms.modaps.eosdis.nasa.gov`), via endpoint **`/api/area/csv/...`** (o formato JSON da área devolve erro neste serviço; o CSV é o suportado).
- **Autenticação:** variável de ambiente **`MAP_KEY`** (Map Key gratuita da NASA), enviada no **path** do URL, nunca ao browser.
- **Persistência:** coleção MongoDB **`nasa_fire`**, modelo Mongoose **`NasaFire`** (`src/infrastructure/apis/NASA/NasaFire/NasaFireModels.ts`).
- **Campos principais para o globo:** `latitude`, `longitude` (obrigatórios), mais `acq_date`, `acq_time`, `source`, `confidence`, `frp`, `daynight`, etc.
- **Deduplicação:** campo **`fireId`** (derivado de posição + data/hora + fonte) para não duplicar a mesma deteção em sincronizações repetidas.
- **Sincronização:** `NasaFireService.startSync()` (cron) + `POST /api/fires/sync` para disparo manual.
- **Testes:** integração real com FIRMS e MongoDB em `src/__tests__/NasaFire/` e `src/__tests__/MongoDB/`.

**Uso no frontend para pontos de incêndio:** `GET /api/fires` devolve `{ count, data: [ ... ] }` onde cada elemento tem `latitude` e `longitude` — pronto para projetar no globo.

### Outras peças no repositório (grau de maturidade variável)

- **Temperatura global (GISTEMP):** módulo TypeScript em `NasaGistemp/` com rotas dedicadas (sincronização e leitura conforme implementação atual).
- **Nível do mar / degelo (proxy):** `GET /api/ice-melt` via cliente em `NasaSeaLevel/` (API intermédia pública).
- **Stubs / clientes legados:** `GlobalForestWatch`, `Copernicus`, `IUCNRedList`, `NSIDC`, `MarineDebrisTracker`, `OpenWeatherMap` — estrutura preparada; integração completa e persistência para o globo são **próximas fases**.
- **Rotas placeholder:** `GET /api/deforestation`, `/api/ocean-pollution`, `/api/extinction` podem responder `501` até haver implementação.

---

## Variáveis de ambiente

Cria um ficheiro `.env` na raiz do projeto:

```env
PORT=3000
NODE_ENV=development

# MongoDB (local ou Docker)
MONGODB_URI=mongodb://localhost:27017/bio_scan_db

# NASA FIRMS — obrigatória para sincronizar e expor incêndios
# Pedido em: https://firms.modaps.eosdis.nasa.gov/api/map_key
MAP_KEY=sua_map_key_aqui
```

Opcional:

- **`FIRMS_SYNC_MAX_RECORDS`** — em **testes**, o Jest define um limite por defeito para não processar CSV mundial completo; em **produção** normalmente **não** defines esta variável (processa todos os registos devolvidos).

---

## Como correr

**Requisitos:** Node.js 18+ recomendado, MongoDB acessível.

```bash
npm install
npm run dev    # nodemon + ts-node para módulos .ts
# ou
npm start
```

**Docker:** `docker-compose up --build` (app + MongoDB; repassa `MAP_KEY` do ambiente do host).

---

## API HTTP (backend)

### Incêndios (dados sincronizados no MongoDB — ideal para o globo)

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/fires` | Lista pontos da coleção `nasa_fire`. Query: `limit`, `source`, `startDate`, `endDate` (YYYY-MM-DD). |
| `GET` | `/api/fires/by-country` | FIRMS por país (hoje via **bbox** interna; códigos ISO3 suportados estão em `COUNTRY_BBOX` em `NasaFireTypes.ts`). |
| `GET` | `/api/fires/sync-status` | Estado do job de sincronização. |
| `POST` | `/api/fires/sync` | Corpo opcional: `{ "source": "MODIS_NRT" \| "VIIRS_SNPP_NRT" \| "VIIRS_NOAA20_NRT" }`. |

### Outros

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/global-temperature` | Dados GISTEMP (conforme rotas do módulo). |
| `GET` | `/api/ice-melt` | Dados de variação do nível do mar (cliente atual). |
| `GET` | `/health` | Saúde da API, MongoDB e estado dos syncs expostos. |

Rotas ainda não implementadas podem devolver `501` com mensagem explicativa.

---

## Estrutura relevante do código

```
src/
├── index.js                          # Express, MongoDB, montagem das rotas NASA
├── infrastructure/apis/NASA/
│   ├── NasaFire/                     # FIRMS: serviço, modelo, controlador, rotas
│   ├── NasaGistemp/
│   └── NasaSeaLevel/
├── infrastructure/apis/              # Outros clientes (GFW, Copernicus, …)
└── __tests__/                        # Jest + ts-jest; ver src/__tests__/README.md
```

Documentação detalhada por módulo: `src/infrastructure/apis/NASA/NasaFire/README.md`, `src/infrastructure/apis/NASA/README.md`.

---

## Próximos passos (integração contínua)

1. **FIRMS:** monitorizar quotas NASA; alargar `COUNTRY_BBOX` ou alternativa GeoJSON quando o endpoint país voltar a estar estável.
2. **Camadas para o globo:** definir para cada fonte um **contrato mínimo** (`type`, `lat`, `lon`, `recordedAt`, `sourceId`) — possível evolução para endpoint agregado tipo `/api/globe/layers`.
3. **Prioridade sugerida:** poluição marinha / lixo (fontes públicas), gelo e nível do mar (NSIDC, NASA), desmatamento (GFW ou Copernicus), espécies (IUCN onde a licença permitir).
4. **Qualidade:** paginação em listas grandes, cache ou tiles para muitos pontos, autenticação se a API passar a ser pública na Internet.

---

## Licença

ISC License.
