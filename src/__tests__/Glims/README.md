

# Testes — GLIMS Geleiras (`GLIMS`)

Integração mockada e validação de protocolo com o [GeoServer GLIMS.org](https://www.glims.org/geoserver/ows).

## Validações de Interface (`Middlewares`)

Os testes garantem que o proxy proteja o servidor upstream, rejeitando requisições malformadas com **HTTP 400**:

- **Nomes de Camada** — Bloqueia nomes que não seguem o padrão `GLIMS:<layer>` ou que não estão na lista de aliases permitidos.
- **Bounding Box (**`bbox`**)** — Valida se as coordenadas estão dentro dos limites globais (lon [-180, 180], lat [-90, 90]) e se a lógica `min < max` é respeitada.
- **Contagem de Feições** — Garante que o `feature_count` seja um inteiro positivo e não ultrapasse o limite de segurança (1000).
- **Projeções (**`srs`**)** — Restringe consultas a sistemas de coordenadas suportados (exclusivamente `EPSG:4326`).
- **Parâmetros WMS vs WFS** — Bloqueia o uso de parâmetros específicos de imagem (`width`, `height`) na rota que deveria entregar apenas dados vetoriais (GeoJSON).



## Serviço e Protocolo OGC

- `getCapabilities` — Valida se o serviço entrega metadados em formato **XML** legítimo (em vez de JSON), conforme o padrão WMS.
- **Mocking de API** — Utiliza `jest.fn()` para simular o GeoServer, garantindo que o `GlimsService` passe corretamente parâmetros como `cql_filter` e `typeName`.
- **Axios Spy** — Verifica se a instância do Axios é criada com as configurações corretas:
  - `timeout`: 20.000ms.
  - `User-Agent`: `BioScan-Backend/1.0 (GLIMS-WFS-proxy)`.



## Integração de Parâmetros

- Valida se filtros CQL complexos (como `name LIKE 'A%'`) são sanitizados e transmitidos corretamente para o serviço upstream.
- Garante o uso de valores padrão seguros para `maxFeatures` (25) caso nenhum limite seja especificado na query string.



## Executar

```bash
npm test -- src/__tests__/Glims/Glims.test.js
```

Rotas: `src/infrastructure/apis/GLIMS/` e `/api/glaciers`.
Normalização para o Globe: `src/infrastructure/apis/Globe/GlobeNormalization.ts`.