# Testes — Extinction (GBIF)

Integração real com a [API GBIF](https://www.gbif.org/) e MongoDB. Sem mocks de resposta GBIF.

Requisitos: `MONGODB_URI` no `.env`, rede até `api.gbif.org`.

```bash
npm test -- src/__tests__/Extinction/Extinction.test.js
```

Rotas: `/api/extinction` — ver `src/infrastructure/apis/Extinction/README.md`.
