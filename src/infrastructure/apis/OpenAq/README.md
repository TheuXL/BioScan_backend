# OpenAQ (qualidade do ar — API v3)

Módulo TypeScript alinhado à [arquitetura do backend](../../../../../Arquitetura.md): **Service** / **Controller** / **Routes** / **Types** / **Middleware**.

## Cache MongoDB (`GET /locations`)

Se o **MongoDB** estiver ligado ao processo, `GET /api/openaq/locations` grava entradas na coleção **`proxy_cache_entries`** (um documento por `id` de local dentro de um **âmbito** derivado da query). Três modos (env):

| Variável | Valores | Comportamento |
|----------|---------|----------------|
| `OPENAQ_LOCATIONS_RECONCILIATION_MODE` | `delta` | Só actualiza o que veio na resposta; **não** apaga por omissão (listagem parcial). |
| | `snapshot` | Trata esta resposta como **conjunto completo** do âmbito (`scopeKey`): remove cache de chaves que **não** vieram (usar só quando souberes que a listagem cobre todo o âmbito). |
| | `hybrid_ttl` (**predefinido**) | Como delta nos upserts + remove entradas **deste** âmbito com `lastRefreshedAt` &lt; agora − TTL. |
| `OPENAQ_LOCATIONS_TTL_SEC` | segundos (default `3600`) | Usado apenas com `hybrid_ttl`. |

Modo **`snapshot`:** se a resposta tiver **0** locais, o backend **não** executa limpeza por omissão (evita apagar todo o âmbito por erro de formato ou corpo incompleto). Só faz remoções quando há **pelo menos** um elemento na lista.

Se o **upstream** falhar e existir cache para o mesmo âmbito, a API responde **200** com `meta.fromBioScanCache: true`. Sem Mongo ou sem cache → **502** como antes.

## Fonte

- **API:** [OpenAQ v3](https://docs.openaq.org/about/about) — `https://api.openaq.org/v3`
- **Chave:** obrigatória; cabeçalho `X-API-Key` em cada pedido ([API key](https://docs.openaq.org/using-the-api/api-key)). Registo em [explore.openaq.org/register](https://explore.openaq.org/register).
- **v1/v2:** descontinuados (410 Gone desde 31/01/2025); usar apenas v3.
- **Termos:** [Terms of use](https://docs.openaq.org/about/terms-of-use); respeitar [rate limits](https://docs.openaq.org/using-the-api/rate-limits).

## Variável de ambiente

Use **`OPENAQ_API_KEY`** no `.env` (recomendado em Node). O serviço aceita também a chave legada **`OPENAQ-API-KEY`** se ainda existir no ficheiro.

**Não** exponhas a chave ao browser: só o backend envia `X-API-Key`.

## Rotas (`/api/openaq`)

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/locations` | Lista locais; query repassada à API (ex.: `limit`, `countries_id`, coordenadas — ver [geospatial](https://docs.openaq.org/using-the-api/geospatial-queries) na doc). |
| `GET` | `/locations/:id` | Detalhe de um local (ex. quick start: local 8118). |
| `GET` | `/locations/:id/latest` | Medições recentes do local. |
| `GET` | `/countries` | Países. |
| `GET` | `/parameters` | Parâmetros (PM2.5, PM10, …). |

## Integração no servidor

- Registo em `src/index.js` apenas se `OPENAQ_API_KEY` (ou legado) estiver definida; caso contrário aviso em consola e rotas não montadas.
- Erros upstream em **`/locations`** → **502** se não houver cache Mongo para o mesmo âmbito; caso contrário **200** com dados em cache (`meta.fromBioScanCache`).

## Testes

```bash
npm test -- src/__tests__/OpenAq/OpenAq.test.js
```

Exige `.env` com chave válida (integração real, sem mocks de resposta).

## Referências

- Catálogo: `FONTES.md` (OpenAQ)
