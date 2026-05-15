# Testes — OpenAQ v3 (`OpenAq`)

Integração real com [OpenAQ API v3](https://docs.openaq.org/about/about). Requer **`OPENAQ_API_KEY`** no `.env` (cabeçalho `X-API-Key`).

## Importante

- Sem mocks de corpo HTTP — pedidos reais a `api.openaq.org`.
- Se a chave não estiver definida, a suíte **é ignorada** (`describe.skip`) e aparece um aviso em consola.

## Executar

```bash
npm test -- src/__tests__/OpenAq/OpenAq.test.js
```

## Rotas REST

- `GET /api/openaq/locations`, `/locations/:id`, `/locations/:id/latest`
- `GET /api/openaq/countries`, `/parameters`

Código: `src/infrastructure/apis/OpenAq/`.
