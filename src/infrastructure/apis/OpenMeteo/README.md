# Open-Meteo (meteorologia contextual)

Módulo TypeScript alinhado à [arquitetura do backend](../../../../Arquitetura.md): **Service** / **Controller** / **Routes** / **Types** / **Middleware**. Proxy on-demand à Open-Meteo; com **MongoDB** ligado, `OpenMeteoController` usa **`proxy_cache_entries`** (`OpenMeteoProxyCacheConfig.ts`, env `OPENMETEO_PROXY_RECONCILIATION_MODE`, `OPENMETEO_PROXY_TTL_SEC`).

## Estrutura

```
OpenMeteo/
├── OpenMeteoController.ts   # Respostas HTTP
├── OpenMeteoService.ts      # Pedidos à API Open-Meteo
├── OpenMeteoRoutes.ts       # Montagem em /api/meteo
├── OpenMeteoTypes.ts        # URLs, defaults, timeout
├── OpenMeteoMiddleware.ts   # Validação de query
└── README.md
```

## Fonte

- **Forecast:** [Open-Meteo Forecast](https://open-meteo.com/en/docs) — `api.open-meteo.com`
- **Archive:** [Historical API](https://open-meteo.com/en/docs/historical-weather-api) — `archive-api.open-meteo.com`
- **Air quality:** [Air Quality API](https://open-meteo.com/en/docs/air-quality-api) — `air-quality-api.open-meteo.com`
- **Autenticação:** tier gratuito **sem chave**; respeitar termos e uso justo do fornecedor.

## Rotas (`/api/meteo`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/forecast` | Tempo atual e previsão. Query obrigatória: `latitude`, `longitude`. Demais parâmetros repassados à API (ex.: `forecast_days`, `hourly`, `daily`, `models`). |
| `GET` | `/archive` | Série histórica. Obrigatórios: `latitude`, `longitude`, `start_date`, `end_date` (`YYYY-MM-DD`). |
| `GET` | `/air-quality` | Qualidade do ar. Obrigatórios: `latitude`, `longitude`. |

Defaults de forecast e air quality em `OpenMeteoTypes.ts` (`DEFAULT_FORECAST_PARAMS`, `DEFAULT_AIR_QUALITY_PARAMS`).

## Integração no servidor

- Registo em `src/index.js` **antes** da ligação ao MongoDB (proxy stateless).
- Erros upstream → **502** com mensagem genérica.

## Uso no globo

Contexto **local** ao clicar no globo ou camada “meteo”; não substitui séries climáticas longas (GISTEMP).

## Testes

```bash
npm test -- src/__tests__/OpenMeteo/OpenMeteo.test.js
```

Integração real contra Open-Meteo (sem mocks). Ver `src/__tests__/OpenMeteo/README.md`.

## Referências

- Catálogo: `FONTES.md` (secção Open-Meteo)
