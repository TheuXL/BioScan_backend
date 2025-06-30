# 🌍 BioScan Backend

Environmental data API providing real-time information about various environmental conditions around the world.

## BioScan: Backend Node.js - Construindo a Espinha Dorsal da Conscientização Ambiental

### O Que é o Backend do BioScan?

O backend do BioScan é o motor que impulsiona a plataforma. É a parte invisível aos olhos do usuário, mas essencial para coletar, processar, organizar e fornecer os dados ambientais que tornam o BioScan tão poderoso. Utilizamos Node.js para construir uma API robusta e escalável, capaz de integrar diversas fontes de dados e alimentar o frontend com informações precisas e atualizadas.

### Nosso Objetivo:

*   **Coleta de Dados:** Integrar APIs de diversas fontes de dados ambientais confiáveis (NASA, NOAA, etc.).
*   **Processamento e Organização:** Limpar, transformar e organizar os dados coletados em um formato consistente e útil.
*   **Escalabilidade:** Desenvolver uma arquitetura capaz de lidar com grandes volumes de dados e um número crescente de usuários.
*   **Confiabilidade:** Garantir que os dados apresentados sejam precisos, atualizados e confiáveis.
*   **Disponibilização de Dados:** Fornecer os dados processados ao frontend através de uma API RESTful bem documentada.

### Como o Backend do BioScan Funciona? (Visão Geral)

O backend conecta-se a diversas APIs de dados ambientais. Os dados são processados, armazenados em um banco de dados MongoDB e disponibilizados através de uma API RESTful.

### Status Atual do Desenvolvimento

O projeto BioScan Backend está em fase inicial de desenvolvimento, com a estrutura de pastas e as configurações básicas estabelecidas. Até o momento, o status é o seguinte:

*   **Estrutura de Projeto:** A arquitetura limpa (`domain/`, `application/`, `infrastructure/`, `interfaces/`) está definida e implementada.
*   **APIs da NASA:** Os clientes para `NASA FIRMS` (incêndios), `NASA GISTEMP` (temperatura global) e `NASA Sea Level Change` (nível do mar/degelo) foram configurados. A API FIRMS já está integrada para buscar e salvar dados de incêndios no MongoDB.
*   **Banco de Dados:** A conexão com o MongoDB está estabelecida via Mongoose, e os modelos de dados (`FireModel`, `DeforestationModel`, `GlobalTemperatureModel`, `SeaLevelAndIceModel`, `OceanPollutionModel`, `EndangeredSpeciesModel`, `SatelliteImageryModel`, `WeatherModel`) foram criados para todas as categorias de dados ambientais.
*   **Variáveis de Ambiente:** O carregamento de variáveis de ambiente (`.env`) está configurado, e as chaves `MAP_KEY` (para FIRMS) e `MONGODB_URI` estão em uso.
*   **Docker:** A configuração do Docker e Docker Compose está ajustada para incluir o serviço de MongoDB, facilitando o ambiente de desenvolvimento.

### Próximos Passos (Geral):

*   Completar a implementação de todas as APIs (clientes e lógica de salvamento).
*   Desenvolver a camada de `application/` (serviços e controladores) e `domain/` (lógica de negócio e validações).
*   Aprimorar o tratamento de erros e validações.
*   Implementar autenticação (JWT) conforme planejado.

## Visão Geral da Documentação

Para detalhes sobre o projeto e seu desenvolvimento:

*   **Documentação Interna das APIs da NASA:** Consulte `src/infrastructure/apis/NASA/README.md` para entender as configurações e o status de cada API da NASA.
*   **Documentação dos Testes:** Consulte `src/__tests__/tests/README.md` para saber como executar os testes e o que cada teste verifica.
*   **Estrutura de Projeto:** A estrutura de pastas principal está detalhada na seção `🔧 Development` abaixo.

---

## 📋 Overview

BioScan Backend is a Node.js API that aggregates data from multiple environmental data sources including:

- Active fires (NASA FIRMS)
- Deforestation (Global Forest Watch)
- Ocean pollution
- Global temperature changes
- Ice melt
- Endangered species

The API is built with a clean architecture approach, separating concerns into domain, application, infrastructure, and interface layers.

## 🛠 Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Axios** - HTTP client
- **Docker** - Containerization

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- Docker and Docker Compose (optional)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3000
NODE_ENV=development
MONGO_URL=mongodb://mongodb:27017/BioScanDB
FIRMS_API_KEY = MAP_KEY=your_nasa_firms_api_key
GFW_API_KEY=your_global_forest_watch_api_key
NOAA_API_KEY=your_noaa_ncei_api_token
# Add other API keys as needed
```

### Installation

#### Without Docker

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

#### With Docker

```bash
# Build and start the container
docker-compose up --build

# Run in background
docker-compose up -d
```

## 📚 API Documentation

### Available Endpoints

- `GET /api/fires` - Get active fires data
- `GET /api/fires/by-region?region={region}` - Get fires data by region
- `GET /api/deforestation` - Get deforestation data
- `GET /api/ocean-pollution` - Get ocean pollution data
- `GET /api/global-temperature` - Get global temperature data
- `GET /api/ice-melt` - Get ice melt data
- `GET /api/extinction` - Get endangered species data

### Health Check

- `GET /health` - API health status

## 🔧 Development

The project follows a clean architecture pattern with the following structure:

```
bioscan-backend/
├── src/
│   ├── domain/           # Business entities and use cases
│   ├── application/      # Services and controllers
│   ├── infrastructure/   # External APIs, configurations
│   │   ├── NASA/
│   │   ├── GlobalForestWatch/
│   │   ├── IUCNRedList/
│   │   ├── NSIDC/
│   │   ├── MarineDebrisTracker/
│   │   ├── Copernicus/
│   │   └── OpenWeatherMap/
│   ├── interfaces/       # Routes and middleware
│   └── index.js          # Entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 📝 License

This project is licensed under the ISC License. 