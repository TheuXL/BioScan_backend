# Testes do Backend BioScan

Esta pasta contém os testes unitários e de integração para o backend do BioScan, utilizando o framework Jest.

## Como Executar os Testes

Para executar todos os testes configurados no projeto, utilize o seguinte comando na raiz do projeto:

```bash
npm test
```

Você também pode executar testes individualmente, conforme detalhado nas seções abaixo.

## Testes Disponíveis

### `Firms.test.js`

Este teste é responsável por verificar a integração com a **API NASA FIRMS (Fire Information for Resource Management System)**. Ele simula uma chamada real à API para garantir que a comunicação está funcionando corretamente e que os dados retornados têm o formato esperado.

**O que ele testa:**

*   **Conexão com a API:** Verifica se a `NasaFireApi` consegue fazer uma requisição bem-sucedida à API FIRMS.
*   **Formato dos Dados:** Assegura que a resposta da API está no formato GeoJSON (`FeatureCollection`) e que os objetos de `features` possuem as propriedades e estrutura de geometria esperadas para dados de incêndio.
*   **Uso da Chave de API:** Confirma que a `MAP_KEY` (lida do arquivo `.env`) está sendo utilizada corretamente na requisição.

**Como executar este teste individualmente:**

```bash
npm run test:firms
```

**Observações:**

*   Este teste faz uma chamada real à API e requer uma conexão ativa com a internet.
*   A `MAP_KEY` deve estar configurada no seu arquivo `.env` na raiz do projeto (`MAP_KEY=sua_chave`).

### `mongoDB.test.js`

Este teste verifica a capacidade do backend de se conectar corretamente ao banco de dados MongoDB.

**O que ele testa:**

*   **Conexão com o MongoDB:** Tenta estabelecer uma conexão com o banco de dados MongoDB usando a `MONGODB_URI` configurada.
*   **Status da Conexão:** Verifica se o estado da conexão do Mongoose indica que a conexão foi bem-sucedida (`readyState` igual a 1).
*   **Variável de Ambiente `MONGODB_URI`:** Assegura que a variável `MONGODB_URI` está definida no arquivo `.env`.

**Como executar este teste individualmente:**

```bash
npm test src/__tests__/tests/mongoDB.test.js
```

**Observações:**

*   Para que este teste seja bem-sucedido, uma instância do servidor MongoDB deve estar em execução e acessível através da `MONGODB_URI` configurada no seu arquivo `.env`. 