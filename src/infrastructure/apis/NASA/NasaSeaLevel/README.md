# NASA Sea Level (nível do mar / contexto degelo)

Módulo alinhado à estrutura `Service` / `Controller` / `Routes` / `Models` / `Types`.

## Fontes HTTP (por ordem)

1. **`SEA_LEVEL_DATA_URL`** — URL completa (recomendado em **produção**): JSON ou texto acessível (ex.: série GMSL espelhada no teu CDN, ou endpoint institucional).
2. **`https://api.climatetools.org/sea-level`** — legado; o DNS pode falhar.
3. **Fallback NASA CMR** — JSON estável com metadados de coleção GMSL (não substitui ficheiro de série temporal para gráficos finos).
4. **Snapshot empacotado** — `data/default-sea-level-snapshot.json` só quando **todas** as fontes HTTP falham e o ambiente o permite (ver abaixo).

Referência científica: [Sea Level Change — NASA](https://sealevel.nasa.gov/data/)

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `SEA_LEVEL_DATA_URL` | URL **completa** (https://…) para GET de JSON ou texto. Prioridade máxima. |
| `SEA_LEVEL_ALLOW_BUNDLED_FALLBACK` | `false` / `0` desativa o JSON empacotado. Em **`production`**, o empacotado **só** corre se for `true` (evita dados ilustrativos sem querer). Fora de `production`, o empacotado é tentado por defeito quando o HTTP falha. |

## Rotas (`/api/ice-melt`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Última fonte que respondeu (HTTP ou empacotado em dev). |
| `GET` | `/latest` | Último snapshot guardado no MongoDB (`nasa_sea_level`). |
| `POST` | `/sync` | Busca + `upsert` do documento único `climate_tools_global`. |
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

Integração real: exige `MONGODB_URI` e rede até pelo menos uma fonte (ou snapshot empacotado em ambiente não-produção).
