# NASA Sea Level (nível do mar / contexto degelo)

Módulo alinhado à estrutura `Service` / `Controller` / `Routes` / `Models` / `Types`.

## Fonte

- **HTTP:** `GET https://api.climatetools.org/sea-level` — JSON público (sem `MAP_KEY`).
- **Referência científica NASA:** [Sea Level Change](https://sealevel.nasa.gov/data/)

## Rotas (`/api/ice-melt`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Resposta **em direto** da API Climate Tools (200 + JSON). |
| `GET` | `/latest` | Último snapshot guardado no MongoDB (`nasa_sea_level`). |
| `POST` | `/sync` | Busca da API + `upsert` do documento único `climate_tools_global`. |
| `GET` | `/sync-status` | Estado do cron de sincronização. |

## MongoDB

- Coleção: **`nasa_sea_level`**
- Um documento lógico por `source: climate_tools_global`, campo `payload` (Mixed) + `fetchedAt`.

## Sincronização

- Cron semanal (domingo 00:00 UTC), configurável em `NasaSeaLevelTypes.SYNC_CONFIG`.

## Testes

```bash
npm test -- src/__tests__/NasaSeaLevel/NasaSeaLevel.test.js
```

Integração real: exige `MONGODB_URI` e rede até `api.climatetools.org` (HTTP 200).
