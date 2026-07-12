# API GLIMS

Esta pasta contém o módulo de integração com o **GLIMS (Global Land Ice Measurements from Space)**, utilizado pelo backend do BioScan para consultar dados públicos de geleiras e disponibilizá-los tanto em formato **GeoJSON** quanto em um formato normalizado para o módulo **Globe**.

O módulo atua como um **proxy on-demand** para os serviços WMS/WFS do GLIMS, preservando o contrato original do GeoServer e oferecendo integração transparente com o restante da arquitetura do BioScan.

---

# 1. GLIMS Glacier Database

**Pasta:** `GLIMS/`

**Arquivos principais:** `GlimsService.ts`, `GlimsController.ts`, `GlimsRoutes.ts`, `GlimsTypes.ts`

**O que faz:**

Este módulo expõe um proxy para os serviços públicos do **GLIMS Glacier Database**, permitindo consultar informações de geleiras diretamente do GeoServer oficial.

Além de disponibilizar os dados em formato GeoJSON, o módulo também serve como fornecedor de dados para o módulo **Globe**, onde as geometrias das geleiras são convertidas para o contrato unificado `PontoGloboV1`.

---

# Fonte dos dados

- **Provedor:** GLIMS Glacier Database
- **Documentação:** https://www.glims.org/glacierdata/
- **GeoServer:** https://www.glims.org/geoserver/ows
- **Organização responsável:** NSIDC (National Snow and Ice Data Center)
- **Termos de uso:** https://nsidc.org/about/data-use-and-copyright
- **Autenticação:** Não exige chave de API.

---

# Status atual

Atualmente o módulo oferece:

- Proxy completo para os serviços WMS e WFS do GLIMS.
- Consulta de metadados através do endpoint `GetCapabilities`.
- Consulta de feições GeoJSON através de `GetFeature`.
- Resolução automática de aliases de camadas.
- Cache Proxy opcional em MongoDB.
- Fallback automático quando o upstream estiver indisponível.
- Integração com o módulo Globe.
- Normalização das geometrias para `PontoGloboV1`.
- Suporte aos principais conjuntos de dados públicos do GLIMS.

---

## Configuração

O módulo é configurado através de `GlimsTypes.ts`.

São definidos:

- URL do GeoServer
- Camada padrão
- Sistema de coordenadas padrão
- Timeout HTTP
- Aliases das camadas
- Valores padrão utilizados pelo proxy

---

## Requisições

O `GlimsService` utiliza **Axios** para comunicação com o GeoServer.

São suportadas duas operações principais:

### WMS

Consulta de metadados através de:

```
GetCapabilities
```

Retornando XML bruto.

### WFS

Consulta das feições através de:

```
GetFeature
```

Retornando GeoJSON.

---

## Rotas

O módulo registra as seguintes rotas:

| Método | Caminho | Descrição |
|---------|----------|-----------|
| GET | `/api/glaciers` | Informações do módulo GLIMS. |
| GET | `/api/glaciers/capabilities` | Retorna o XML GetCapabilities do GLIMS. |
| GET | `/api/glaciers/layers/:layerName/geojson` | Consulta uma camada WFS retornando GeoJSON. |

---

## Integração com o Globe

Além das rotas próprias do módulo, o GLIMS também é utilizado internamente pelo módulo Globe.

O endpoint

```
GET /api/globe/geleiras
```

utiliza o `GlimsService` para obter os dados do GeoServer e converte as geometrias para o contrato unificado `PontoGloboV1`, permitindo que o frontend desenhe geleiras utilizando a mesma estrutura de dados das demais camadas (incêndios, sismos, espécies ameaçadas e lixo marinho).

O endpoint `/api/globe/geleiras` **não substitui** as rotas do GLIMS.

Ele apenas reutiliza o serviço já existente para fornecer uma representação simplificada das geleiras ao mapa do BioScan.

---

## Controller

O `GlimsController` é responsável por:

- validar parâmetros da requisição;
- aplicar valores padrão definidos em `GlimsTypes.ts`;
- chamar o `GlimsService`;
- devolver o GeoJSON original ao cliente;
- tratar falhas do GeoServer;
- utilizar o cache proxy quando disponível.

Quando ocorre falha no serviço upstream e existe cache salvo, o controller devolve o último payload conhecido juntamente com:

```json
{
    "bioscan_meta": {
        "fromBioScanCache": true
    }
}
```

Caso não exista cache disponível, responde com:

```
HTTP 502
```

preservando o comportamento dos demais módulos do BioScan.

---

## Estrutura

```text
GLIMS/
├── GlimsController.ts          # Controlador HTTP
├── GlimsMiddleware.ts          # Validação dos parâmetros
├── GlimsProxyCacheConfig.ts    # Configuração do cache proxy
├── GlimsRoutes.ts              # Rotas do módulo
├── GlimsService.ts             # Cliente WMS/WFS
├── GlimsTypes.ts               # Tipos, aliases e configuração
└── README.md
```

## Exemplos de uso

### Informações do módulo

```bash
curl http://localhost:3000/api/glaciers
```

Resposta esperada:

```json
{
  "provider": "BioScan proxy — GLIMS glacier data",
  "basePath": "/api/glaciers",
  "defaultLayer": "GLIMS:GLIMS_Glacier_Outlines",
  "requiresApiKey": false
}
```

---

### Capabilities do GLIMS

```bash
curl http://localhost:3000/api/glaciers/capabilities
```

Esta rota retorna diretamente o XML produzido pelo serviço WMS do GLIMS.

O conteúdo não é modificado pelo BioScan.

---

### GeoJSON de contornos de geleiras

```bash
curl "http://localhost:3000/api/glaciers/layers/outlines/geojson?bbox=-180,-90,180,90&feature_count=100"
```

Resposta:

```json
{
    "type":"FeatureCollection",
    "features":[
        ...
    ]
}
```

---

### GeoJSON de geleiras RGI

```bash
curl "http://localhost:3000/api/glaciers/layers/rgi/geojson?feature_count=200"
```

---

### GeoJSON de geleiras RGI 7.0

```bash
curl "http://localhost:3000/api/glaciers/layers/rgi70/geojson?feature_count=500"
```

---

### GeoJSON de geleiras extintas

```bash
curl "http://localhost:3000/api/glaciers/layers/extinct/geojson?feature_count=100"
```

---

# Fluxo da consulta

Quando uma requisição chega ao backend, o fluxo executado é o seguinte.

```
Cliente
    │
    ▼
GET /api/glaciers/layers/outlines/geojson
    │
    ▼
GlimsRoutes
    │
    ▼
GlimsController
    │
    ▼
GlimsService
    │
    ▼
GeoServer GLIMS
    │
    ▼
GeoJSON
    │
    ▼
Proxy Cache
    │
    ▼
Resposta ao cliente
```

Caso o GeoServer esteja indisponível, o módulo tenta recuperar o último payload salvo no cache do MongoDB.

Quando isso acontece, o retorno recebe automaticamente:

```json
{
    "bioscan_meta":{
        "fromBioScanCache":true
    }
}
```

permitindo ao frontend identificar que a resposta veio do cache local.

---

# Cache Proxy

O GLIMS utiliza exatamente a mesma infraestrutura de cache proxy utilizada pelos demais módulos do BioScan.

O cache possui três modos de reconciliação.

|Modo|Descrição|
|----|---------|
|delta|Somente atualiza registros novos ou modificados.|
|snapshot|Sincroniza completamente o conjunto retornado pela consulta.|
|hybrid_ttl|Delta + remoção automática de registros expirados.|

As variáveis de ambiente são:

|Variável|Descrição|Default|
|---------|---------|-------|
|GLIMS_PROXY_RECONCILIATION_MODE|Modo do cache.|hybrid_ttl|
|GLIMS_PROXY_TTL_SEC|TTL das entradas.|3600|

Os seguintes escopos são gravados.

|Source|Conteúdo|
|-------|--------|
|glims.capabilities|Resposta XML do GetCapabilities.|
|glims.layer_geojson|Resposta GeoJSON da camada consultada.|

---

# Integração com o Globe

Além das rotas próprias do módulo, o GLIMS também fornece dados para o módulo Globe.

A rota

```
GET /api/globe/geleiras
```

consome internamente:

```
GlimsService.getLayerGeoJson(...)
```

e normaliza cada Feature do GeoJSON para o contrato comum do Globe (`PontoGloboV1`).

Cada geleira é convertida para:

```ts
{
    lat,
    lon,
    tipo: "geleira",
    momento: null,
    origem: "GLIMS",
    idFonte,
    severidade: null,
    titulo,
    detalhes
}
```

Isso permite que o frontend exiba incêndios, sismos, espécies ameaçadas, lixo marinho e geleiras utilizando exatamente o mesmo componente de mapa.

---

# Como testar

Executar apenas os testes do GLIMS:

```bash
npm test -- Glims.test.js
```

ou

```bash
npm.cmd test -- Glims.test.js
```

---

Iniciar o backend.

```bash
npm run dev
```

ou

```bash
npm.cmd run dev
```

---

Testar o endpoint principal.

```
http://localhost:3000/api/glaciers
```

---

Testar o endpoint GeoJSON.

```
http://localhost:3000/api/glaciers/layers/outlines/geojson
```

---

Testar uma quantidade maior de geleiras.

```
http://localhost:3000/api/glaciers/layers/outlines/geojson?feature_count=5000
```

---

Testar uma região específica.

```
http://localhost:3000/api/glaciers/layers/outlines/geojson?bbox=-74,-56,-32,13
```

---

Testar integração Globe.

```
http://localhost:3000/api/globe/geleiras
```

---

# Estrutura do código

```
GLIMS/
│
├── GlimsController.ts
├── GlimsMiddleware.ts
├── GlimsProxyCacheConfig.ts
├── GlimsRoutes.ts
├── GlimsService.ts
├── GlimsTypes.ts
├── README.md
│
└── integração
      ├── GlobeController.ts
      └── GlobeNormalization.ts
```

---

# O que falta

O módulo já está funcional, porém ainda existem melhorias planejadas.

## Testes

Adicionar testes para:

- GetCapabilities
- cache proxy
- fallback do Mongo
- aliases de camada
- bbox inválido
- feature_count inválido
- timeout do GeoServer

---

## Novas camadas

Adicionar suporte para futuras camadas disponibilizadas pelo GLIMS.

---

## Mais filtros

Adicionar suporte a filtros adicionais do WFS, como:

- propertyName
- sortBy
- outputFormat customizado
- startIndex
- count

---

## Compressão

Avaliar suporte a:

```
gzip
brotli
```

para respostas GeoJSON muito grandes.

---

## Monitoramento

Adicionar métricas de:

- tempo médio de resposta
- taxa de cache hit
- taxa de erro do upstream
- número de features retornadas

---

## OpenAPI

Documentar completamente:

```
/api/glaciers
/api/glaciers/capabilities
/api/glaciers/layers/{layer}/geojson
```

no OpenAPI do projeto.

---

# Observações técnicas

- O módulo é totalmente stateless.
- Não sincroniza dados permanentemente.
- Toda consulta é feita sob demanda.
- O MongoDB é opcional.
- O cache é utilizado apenas para fallback.
- O GeoJSON retornado preserva completamente a resposta do GLIMS.
- O módulo suporta qualquer camada WFS do GeoServer, não apenas os aliases definidos.
- O frontend pode consumir diretamente o GeoJSON ou utilizar a camada normalizada do Globe.
- O sistema de coordenadas padrão é EPSG:4326.
- O timeout das chamadas HTTP é configurável em `GlimsTypes.ts`.
- Todas as chamadas utilizam Axios.
- O módulo não exige autenticação nem API Key.
- O tratamento de erros converte falhas do upstream em HTTP 502.
- Quando existe cache disponível, o BioScan devolve a última resposta válida em vez de falhar imediatamente.

# Arquitetura

O módulo GLIMS segue a mesma arquitetura utilizada pelos demais provedores externos do BioScan.

```
Cliente
    │
    ▼
Express Router
    │
    ▼
GlimsController
    │
    ▼
GlimsService
    │
    ▼
Proxy Cache
    │
    ▼
GeoServer GLIMS
```

Cada camada possui uma responsabilidade bem definida.

|Arquivo|Responsabilidade|
|-------|----------------|
|GlimsRoutes.ts|Define as rotas HTTP.|
|GlimsController.ts|Valida parâmetros, trata erros e monta respostas HTTP.|
|GlimsService.ts|Comunica-se com o GeoServer do GLIMS.|
|GlimsTypes.ts|Configura URLs, aliases e valores padrão.|
|GlimsMiddleware.ts|Valida parâmetros das rotas.|
|GlimsProxyCacheConfig.ts|Configuração do cache proxy.|

---

# Dependências

O módulo utiliza apenas bibliotecas já presentes no backend.

|Biblioteca|Uso|
|-----------|---|
|Express|Rotas HTTP|
|Axios|Chamadas ao GeoServer|
|MongoDB|Cache opcional|
|Node Crypto|Hash do cache|
|TypeScript|Tipagem|

---

# Tratamento de erros

O módulo trata diferentes categorias de erro.

## Erro de comunicação

Quando o GeoServer não responde.

Resposta:

```http
502 Bad Gateway
```

```json
{
    "message":"Could not retrieve GLIMS GeoJSON."
}
```

---

## Camada inválida

Caso seja informada uma camada inexistente.

```http
400 Bad Request
```

```json
{
    "message":"Invalid GLIMS layer."
}
```

---

## BBOX inválido

Caso o Bounding Box seja inválido.

```http
400 Bad Request
```

---

## Feature Count inválido

Caso seja enviado:

```
feature_count=-5
```

ou

```
feature_count=abc
```

o middleware devolve erro de validação.

---

# Performance

O módulo foi desenvolvido para minimizar chamadas repetidas ao serviço GLIMS.

Estratégias utilizadas:

- Cache Proxy
- Reutilização de conexões HTTP
- Normalização dos parâmetros
- Hash determinístico
- Cache por escopo

Quando o MongoDB está ativo, consultas iguais retornam muito mais rapidamente.

---

# Integração com o restante do BioScan

O GLIMS está integrado aos seguintes módulos.

|Módulo|Integração|
|-------|----------|
|Proxy Cache|Cache das respostas|
|Globe|Normalização das geleiras|
|Express|Rotas HTTP|
|OpenAPI|Documentação dos endpoints|
|MongoDB|Fallback opcional|

---

# Fluxo da integração Globe

```
Frontend
      │
      ▼
GET /api/globe/geleiras
      │
      ▼
GlobeController
      │
      ▼
GlimsService
      │
      ▼
GeoServer GLIMS
      │
      ▼
GeoJSON
      │
      ▼
geoJsonParaGeleiras()
      │
      ▼
PontoGloboV1
      │
      ▼
Frontend
```

Dessa forma, todas as camadas do Globe possuem exatamente o mesmo contrato de dados.

---

# Contrato retornado

Cada geleira é convertida para o seguinte formato.

```ts
{
    lat: number,
    lon: number,
    tipo: "geleira",
    momento: null,
    origem: "GLIMS",
    idFonte: string,
    severidade: null,
    titulo: string,
    detalhes: { ... }
}
```

Esse contrato é compartilhado com:

- Incêndios
- Espécies ameaçadas
- Sismos
- Lixo marinho
- Geleiras

---

# Compatibilidade

O módulo foi desenvolvido para trabalhar com:

- Node.js 18+
- Express 5
- TypeScript 5
- MongoDB 6+
- Axios 1+

---

# Segurança

O módulo não realiza autenticação porque o serviço GLIMS é público.

Mesmo assim são aplicadas validações para evitar requisições inválidas.

Entre elas:

- validação de bbox;
- validação de feature_count;
- validação do layerName;
- timeout nas chamadas HTTP;
- tratamento de respostas inválidas.

---

# Licenciamento dos dados

Os dados disponibilizados pelo GLIMS pertencem ao projeto **GLIMS (Global Land Ice Measurements from Space)**.

Antes de redistribuir ou utilizar os dados em aplicações públicas consulte:

https://www.glims.org/glacierdata/

e

https://nsidc.org/about/data-use-and-copyright

---

# Referências

GLIMS Glacier Database

https://www.glims.org/

GeoServer WFS

https://docs.geoserver.org/

OGC Web Feature Service

https://www.ogc.org/standards/wfs

Open Geospatial Consortium

https://www.ogc.org/

National Snow and Ice Data Center

https://nsidc.org/

---

# Histórico

### v1.0

- criação do módulo GLIMS;
- integração com GeoServer WFS;
- endpoint GetCapabilities;
- endpoint GeoJSON;
- aliases de camada;
- integração com Proxy Cache;
- fallback utilizando MongoDB;
- integração com Globe (`/api/globe/geleiras`);
- normalização para `PontoGloboV1`.

---

# Autor

Projeto desenvolvido como parte do **BioScan**, plataforma para integração de dados ambientais provenientes de múltiplas fontes públicas.

O módulo GLIMS segue o mesmo padrão arquitetural utilizado pelos demais provedores do sistema, permitindo fácil manutenção, reutilização de componentes e expansão futura.