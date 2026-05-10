# Testes — NASA Sea Level (`NasaSeaLevel`)

Integração **real** com:

- `https://api.climatetools.org/sea-level` (esperado **HTTP 200** e corpo JSON objeto/array)
- MongoDB (`MONGODB_URI` no `.env`)

## Regra do projeto

Não simular sucesso: os testes chamam a API e a base reais. Se o serviço Climate Tools estiver indisponível (503, DNS, etc.), os testes falham até a rede/API voltar.

## Executar

```bash
npm test -- src/__tests__/NasaSeaLevel/NasaSeaLevel.test.js
```

## O que é coberto

- `NasaSeaLevelService.fetchGlobalSeaLevel` — pedido real
- `syncSeaLevelData` — upsert na coleção `nasa_sea_level`
- `getLatestSnapshotFromDb`
- Cron `startSync` / `stopSync` / `getSyncStatus`
- `NasaSeaLevelController` — rotas equivalentes a `GET /`, `GET /latest`, `POST /sync`, `GET /sync-status`
- Modelo único por `source`
