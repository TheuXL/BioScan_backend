# OpenAQ (qualidade do ar — API v3)

Módulo TypeScript alinhado à [arquitetura do backend](../../../../../Arquitetura.md): **Service** / **Controller** / **Routes** / **Types** / **Middleware**. Sem `Models` — proxy **on-demand** (sem MongoDB).

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
- Erros upstream → **502**.

## Testes

```bash
npm test -- src/__tests__/OpenAq/OpenAq.test.js
```

Exige `.env` com chave válida (integração real, sem mocks de resposta).

## Referências

- Catálogo: `FONTES.md` (OpenAQ)
