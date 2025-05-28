# 🌍 BioScan Backend

Environmental data API providing real-time information about various environmental conditions around the world.

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
FIRMS_API_KEY=your_nasa_firms_api_key
GFW_API_KEY=your_global_forest_watch_api_key
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
│   ├── interfaces/       # Routes and middleware
│   └── index.js          # Entry point
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## 📝 License

This project is licensed under the ISC License. 