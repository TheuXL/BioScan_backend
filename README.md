# BioScan Backend

API Node.js que agrega dados ambientais de **fontes públicas** (NASA, EPA, GBIF, USGS, etc.), persiste o que fizer sentido em **MongoDB** e expõe **REST** para clientes — sobretudo um **frontend com globo** onde cada camada vira pontos ou geometrias no planeta.

Este repositório contém **apenas o backend**. O frontend é outro projeto.

---

## Visão do produto

O BioScan torna **visíveis** incêndios, oceano, clima, sismos, desmatamento, espécies em risco, etc. O backend **integra** serviços públicos, **normaliza** quando necessário e serve **JSON estável** e filtrável. O utilizador no globo escolhe **o quê** ver e **onde** navegar; cada registo georreferenciado pode ser marcador, heatmap ou outra visualização.

Padrão por fonte: **cliente HTTP → serviço → (opcional) MongoDB → controlador → rota**.

---

## Objetivos

| Objetivo | Descrição |
|----------|-----------|
| **Integração** | Ligação a APIs e ficheiros públicos, com chaves onde for obrigatório. |
| **Persistência** | Séries e eventos em MongoDB com índices úteis (tempo, geo, fonte). |
| **API REST** | Leitura filtrada; sync manual ou estado de jobs quando aplicável. |
| **Escalabilidade** | Paginação, limites, respeito a quotas upstream. |
| **Contrato do globo** | Um formato de **ponto** comum (`PontoGloboV1`) onde fizer sentido, para o frontend não depender de um JSON por instituição. |

---

## Contrato do globo e URLs (`PontoGloboV1`)

Para camadas no globo, o cliente deve poder tratar **um único formato de ponto**: campos como `lat`, `lon`, `tipo`, `momento`, `origem`, `idFonte`, `severidade`, embebidos em `schemaVersion`, `camada`, `count`, `pontos[]`.

**Domínio + fornecedor** — o path reflete primeiro o tema, depois quem fornece os dados:

| Domínio | Índice (lista fornecedores) | Exemplo de camada |
|---------|----------------------------|-------------------|
| Fogo | `GET /api/fire` | `GET /api/fire/nasa` — NASA FIRMS (Mongo + sync). |
| Oceano | `GET /api/ocean` | `GET /api/ocean/epa` — EPA R9 Marine Debris (ArcGIS). |

- **`GET /api/globe`** — índice de todas as camadas normalizadas e links para `/api/fire/*`, `/api/ocean/*`; inclui também `GET /api/globe/sismos` e `GET /api/globe/especies-ameacadas` até terem domínio dedicado, se fizer sentido no produto.
- **Dados no formato “cru” da fonte** (legacy ou proxy directo) mantêm prefixos próprios, por exemplo **`/api/fires`** (FIRMS em Mongo) e **`/api/ocean-pollution`** (ArcGIS sem normalização de pontos).

Novo fornecedor de fogo: novo segmento `GET /api/fire/<slug>` + entrada no JSON de **`GET /api/fire`**; a forma do **ponto** mantém-se.

---

## Duas formas de integração (conceito)

1. **Sincronização + MongoDB** — a rotina de sync **descarrega** da fonte, **grava** no BioScan e os **GET** leem principalmente do banco. Inclui hoje, entre outros: **FIRMS**, **GISTEMP**, **nível do mar** (com live + snapshot conforme módulo), **Extinction/GBIF**.
2. **Proxy on-demand** — cada pedido ao BioScan **encaminha** (ou adapta) o pedido à API externa; **não** há modelo Mongo obrigatório nesses módulos. Exemplos atuais: **Open-Meteo**, **USGS**, **NASA EONET**, **OpenAQ**, **GFW**, **EPA ArcGIS** em `/api/ocean-pollution`. O `GlobeController` pode **normalizar à vôo** (ex.: sismos, lixo marinho via EPA) para `PontoGloboV1`.

**Direcção de produto:** para proxies, pode definir-se por serviço **cache em Mongo** com política de reconciliação (por exemplo: *delta* quando a listagem é parcial; *snapshot completo* quando o âmbito é autoritativo; *TTL por chave* dentro de um âmbito para expirar o que não foi refrescado). Isso evita apagar dados bons em listagens paginadas e permite servir **último estado válido** se o upstream falhar. A escolha concreta fixa-se **por integração** ao implementá-la.

---

## O que influencia o servidor ao arrancar

| Condição | Efeito |
|----------|--------|
| **MongoDB indisponível** na primeira ligação | Não se registam rotas de **FIRMS**, **GISTEMP**, **ice-melt**, **extinction** (o ramo `.then` do `mongoose.connect` não corre). |
| **Sem `MAP_KEY`** | Não há sync FIRMS nem **`/api/fires`**. `GET /api/fire/nasa` continua registada mas pode responder **503**. |
| **Sem `OPENAQ_API_KEY`** | **`/api/openaq`** não é montado. |
| **GFW** | Metadados em **`/api/deforestation`** sem chave; **`query/json`** e **`fields`** precisam de **`GFW_API_KEY`** e **`GFW_API_ORIGIN`** coerente com a key. |

---

## Catálogo de rotas (estado)

**Legenda:** **Completo** — útil com rede e sem depender de Mongo para *existir* a rota. **Condicional** — depende de Mongo, chaves ou sync. **Planeado** — ainda não há implementação alinhada ao produto.

### Globo normalizado (`PontoGloboV1`)

| Método | Rota | Estado |
|--------|------|--------|
| `GET` | `/api/globe` | Completo |
| `GET` | `/api/globe/sismos` | Completo |
| `GET` | `/api/globe/especies-ameacadas` | Condicional (Mongo + sync GBIF) |
| `GET` | `/api/fire` | Completo |
| `GET` | `/api/fire/nasa` | Condicional (`MAP_KEY`, Mongo, dados em `nasa_fire`) |
| `GET` | `/api/ocean` | Completo |
| `GET` | `/api/ocean/epa` | Completo |

### Proxies (formato upstream; sem persistência obrigatória)

| Rotas principais | Estado |
|------------------|--------|
| `GET /api/meteo/forecast`, `/archive`, `/air-quality` | Completo |
| `GET /api/earthquakes`, `/earthquakes/feed/:window` | Completo |
| `GET /api/events` e sub-rotas (sources, categories, layers, …) | Completo |
| `GET /api/openaq/*` | Condicional (chave + arranque com `OPENAQ_API_KEY`) |
| `GET /api/deforestation` … | Metadados completos; `dataset/.../query/json` e `.../fields` condicionais (GFW) |
| `GET /api/ocean-pollution/*` | Completo |

### Mongo + sync (leitura após persistência)

| Rotas | Estado |
|-------|--------|
| `/api/fires`, `/by-country`, `/sync-status`, `POST /sync` | Condicional (Mongo + `MAP_KEY`) |
| `/api/global-temperature`, `/stats`, sync | Condicional (Mongo) |
| `/api/ice-melt`, `/latest`, sync | Condicional (Mongo; ver `NasaSeaLevel/README.md`) |
| `/api/extinction`, sync | Condicional (Mongo + GBIF) |

### Outros

| Método | Rota | Estado |
|--------|------|--------|
| `GET` | `/health` | Completo |

### Roadmap (extracto)

- Mais fornecedores em **`/api/fire/*`** e **`/api/ocean/*`** com o mesmo contrato de pontos.
- `PontoGloboV1` para mais domínios hoje só expostos como proxy.
- OpenAPI, autenticação se a API for pública, cache persistente por serviço conforme política acima.
- Ideias de produto em **`IDEIA.md`**.

---

## Referência rápida por prefixo

| Prefixo | Conteúdo |
|---------|----------|
| `/api/globe`, `/api/fire`, `/api/ocean` | Contrato de globo normalizado |
| `/api/fires` | FIRMS em Mongo (formato legacy) |
| `/api/meteo` | Open-Meteo |
| `/api/earthquakes` | USGS |
| `/api/events` | NASA EONET |
| `/api/openaq` | OpenAQ (com chave) |
| `/api/deforestation` | GFW Data API |
| `/api/ocean-pollution` | EPA ArcGIS |
| `/api/global-temperature` | GISTEMP |
| `/api/ice-melt` | Nível do mar / degelo |
| `/api/extinction` | GBIF + IUCN |
| `/health` | Estado do processo |

---

## Variáveis de ambiente

Cria `.env` na raiz (ex.: a partir de `.env.example`):

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bio_scan_db

# NASA FIRMS — https://firms.modaps.eosdis.nasa.gov/api/map_key
MAP_KEY=

# OpenAQ v3 — https://explore.openaq.org/register
OPENAQ_API_KEY=

# GFW — https://data-api.globalforestwatch.org/
GFW_API_KEY=
# GFW_API_ORIGIN=http://localhost

# Nível do mar — ver src/infrastructure/apis/NASA/NasaSeaLevel/README.md
# SEA_LEVEL_DATA_URL=https://...
# SEA_LEVEL_ALLOW_BUNDLED_FALLBACK=false
```

Opcional: `FIRMS_SYNC_MAX_RECORDS` (sobretudo testes), `EXTINCTION_GBIF_*`, `SEA_LEVEL_*`.

---

## Como correr

**Requisitos:** Node.js 18+, MongoDB acessível.

```bash
npm install
npm run dev
# ou
npm start
```

**Docker:** `docker-compose up --build` (variáveis conforme `docker-compose.yml` / `.env`).

---

## Estrutura do código

```
src/
├── index.js
├── infrastructure/apis/Globe/        # PontoGloboV1, /api/globe, /api/fire, /api/ocean
├── infrastructure/apis/NASA/         # NasaFire, NasaGistemp, NasaSeaLevel, NasaEonet
├── infrastructure/apis/OpenMeteo/
├── infrastructure/apis/UsgsEarthquake/
├── infrastructure/apis/OpenAq/
├── infrastructure/apis/GlobalForestWatch/
├── infrastructure/apis/OceanPollution/
├── infrastructure/apis/Extinction/
└── __tests__/
```

Documentação por módulo: pastas `README.md` sob `src/infrastructure/apis/...` (ex.: `NASA/NasaFire/README.md`).

---

## Licença

ISC License.
