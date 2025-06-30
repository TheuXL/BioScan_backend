# APIs da NASA

Esta pasta contém os clientes de API para integração com os serviços da NASA e fontes de dados relacionadas, utilizados para coletar informações ambientais no backend do BioScan.

## 1. NASA FIRMS (Fire Information for Resource Management System)

**Arquivo:** `NasaFire.js`

**O que faz:** Este cliente interage com a API FIRMS WFS para obter dados de incêndios ativos em tempo real.

**Status Atual:**

*   **Configurado:** O cliente está configurado para utilizar a `MAP_KEY` (lida do arquivo `.env`).
*   **Requisição:** Capaz de fazer requisições para regiões e fontes de dados (e.g., `MODIS_NRT`, `VIIRS_SNPP_NRT`) e espera o retorno em formato GeoJSON.
*   **Integração no Backend:** As rotas `/api/fires` e `/api/fires/by-region` em `src/index.js` utilizam este cliente e já estão salvando os dados de incêndio no `FireModel` do MongoDB.
*   **Teste:** Há um teste dedicado (`Firms.test.js` em `src/__tests__/tests/`) que verifica a funcionalidade de busca e a estrutura dos dados retornados.

**O que falta:**

*   **Tratamento de Dados:** Implementar uma lógica mais robusta para processar e filtrar os dados recebidos da API antes de salvá-los, se necessário (ex: evitar duplicatas, normalização).
*   **Opções de Consulta:** Expandir os parâmetros de consulta (`BBOX`, `STARTINDEX`, `COUNT`, `DATE`) na função `getActiveFires` para permitir maior flexibilidade na busca de dados.

## 2. NASA GISTEMP / NOAA Climate Data API

**Arquivo:** `NasaGistemp.js`

**O que faz:** Este cliente se conecta à API NOAA NCEI para buscar dados de anomalias de temperatura global, que se alinham com as descobertas do GISTEMP da NASA.

**Status Atual:**

*   **Configurado:** O cliente requer a `NOAA_API_KEY` (lida do arquivo `.env`) para autenticação.
*   **Requisição:** Possui um método `getGlobalTemperatureAnomalies` que aceita `startDate`, `endDate` e `limit` para buscar dados de temperatura.
*   **Integração no Backend:** A rota `/api/global-temperature` em `src/index.js` já está utilizando este cliente.

**O que falta:**

*   **Chave de API:** A `NOAA_API_KEY` precisa ser configurada no arquivo `.env` para que este cliente funcione plenamente.
*   **Salvamento de Dados:** Implementar a lógica para salvar os dados de temperatura global retornados no `GlobalTemperatureModel` do MongoDB.
*   **Tratamento de Dados:** Desenvolver a lógica para processar e organizar os dados de temperatura (e.g., garantir unicidade por data).
*   **Testes:** Criar testes unitários e de integração para verificar a funcionalidade deste cliente e a integridade dos dados.

## 3. NASA Sea Level Change API

**Arquivo:** `NasaSeaLevel.js`

**O que faz:** Este cliente busca dados de variação do nível do mar de uma API pública intermediária que utiliza dados da NASA.

**Status Atual:**

*   **Configurado:** Não requer chave de API, pois a API que ele consome é pública.
*   **Requisição:** Possui um método `getGlobalSeaLevel` que busca os dados de nível do mar.
*   **Integração no Backend:** A rota `/api/ice-melt` em `src/index.js` já está utilizando este cliente.

**O que falta:**

*   **Salvamento de Dados:** Implementar a lógica para salvar os dados de nível do mar retornados no `SeaLevelAndIceModel` do MongoDB.
*   **Tratamento de Dados:** Desenvolver a lógica para processar e organizar os dados de nível do mar, se necessário.
*   **Testes:** Criar testes unitários e de integração para verificar a funcionalidade deste cliente e a integridade dos dados.
