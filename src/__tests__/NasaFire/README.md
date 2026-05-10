# Testes do Módulo NASA Fire

Este diretório contém os testes de integração para o módulo NASA Fire API.

## ⚠️ Importante: Testes com Dados Reais

**Estes testes fazem requisições reais à API NASA FIRMS e salvam dados reais no MongoDB.**

- ✅ **Sem mocks**: Todos os testes usam dados reais da API
- ✅ **Integração completa**: Testa o fluxo completo API → Service → MongoDB
- ✅ **Dados reais**: Os dados salvos no MongoDB são os mesmos que serão usados no frontend

## Estrutura

```
NasaFire/
├── NasaFire.test.js    # Testes de integração com API real
└── README.md           # Esta documentação
```

## Executando os Testes

### Todos os testes
```bash
npm test
```

### Apenas testes do NASA Fire
```bash
npm test -- src/__tests__/NasaFire/NasaFire.test.js
```

### Com verbose
```bash
npm test -- --verbose src/__tests__/NasaFire/NasaFire.test.js
```

## Pré-requisitos Obrigatórios

1. **Variáveis de Ambiente (OBRIGATÓRIAS):**
   - `MAP_KEY` - Chave da API NASA FIRMS (obrigatória para testes reais)
   - `MONGODB_URI` - URI de conexão do MongoDB (obrigatória para testes de integração)

2. **MongoDB:**
   - MongoDB deve estar rodando e acessível
   - Os testes salvam dados reais no MongoDB
   - Os dados salvos são os mesmos que serão usados no frontend

## Cobertura de Testes

### NasaFireService
- ✅ Criação de instância
- ✅ Validação de API key
- ✅ `getActiveFires()` - Busca de incêndios globais
- ✅ `getActiveFiresByCountry()` - Busca por país
- ✅ `syncFireData()` - Sincronização com MongoDB
- ✅ Validação de parâmetros (source, days, etc.)
- ✅ Tratamento de erros
- ✅ Gerenciamento de sync service (start/stop/status)

### NasaFireController
- ✅ `getFires()` - Lista incêndios do MongoDB
- ✅ `getFiresByCountry()` - Busca por país
- ✅ `getSyncStatus()` - Status do serviço
- ✅ `triggerSync()` - Sincronização manual
- ✅ Validação de parâmetros
- ✅ Tratamento de erros HTTP

### NasaFireModel
- ✅ Criação de documentos
- ✅ Geração automática de `fireId`
- ✅ Unicidade de `fireId`
- ✅ Validação de campos obrigatórios

### Constantes e Tipos
- ✅ Valores do enum `FireSource`
- ✅ Valores padrão (`DEFAULTS`)

## Estrutura dos Testes

### Setup e Teardown
- `beforeAll`: Conecta ao MongoDB (obrigatório)
- `afterAll`: Fecha conexão do MongoDB
- `beforeEach`: Cria instâncias frescas dos serviços com API key real
- `afterEach`: Para serviços de sincronização em execução

### Testes de Integração Real
- **Sem mocks**: Todas as requisições são reais à API NASA FIRMS
- **Dados reais**: Busca dados de fogo do mundo inteiro em tempo real
- **MongoDB real**: Salva dados reais no MongoDB que serão usados no frontend
- **Timeout aumentado**: 30-60 segundos para aguardar respostas da API

### Fluxo de Teste
1. Faz requisição real à API NASA FIRMS
2. Recebe dados JSON de focos de incêndio do mundo inteiro
3. Salva os dados no MongoDB
4. Verifica que os dados foram salvos corretamente
5. Valida estrutura dos dados para uso no frontend

## Exemplos de Testes

### Teste de Requisição Real à API
```javascript
test('should fetch real fire data from NASA FIRMS API (worldwide)', async () => {
  const fires = await nasaFireService.getActiveFires({
    source: FireSource.MODIS_NRT,
    days: 1 // Últimas 24 horas
  });

  expect(fires).toBeInstanceOf(Array);
  expect(fires.length).toBeGreaterThanOrEqual(0);
  
  // Verificar estrutura dos dados reais
  if (fires.length > 0) {
    const firstFire = fires[0];
    expect(firstFire).toHaveProperty('latitude');
    expect(firstFire).toHaveProperty('longitude');
    expect(firstFire).toHaveProperty('acq_date');
  }
}, 30000);
```

### Teste de Sincronização Real com MongoDB
```javascript
test('should fetch real fire data from API and save to MongoDB', async () => {
  // Contar documentos antes
  const countBefore = await NasaFireModel.countDocuments();

  // Sincronizar dados reais da API
  const result = await nasaFireService.syncFireData(FireSource.MODIS_NRT);
  
  expect(result).toHaveProperty('saved');
  expect(result.saved).toBeGreaterThanOrEqual(0);

  // Verificar que dados foram salvos
  const countAfter = await NasaFireModel.countDocuments();
  if (result.saved > 0) {
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  }
}, 60000);
```

## Notas Importantes

1. **API Key Real:** Os testes fazem requisições reais à API NASA FIRMS usando `MAP_KEY` do `.env`
2. **MongoDB Real:** Os testes salvam dados reais no MongoDB - os mesmos dados que serão usados no frontend
3. **Timeout:** Testes têm timeout aumentado (30-60 segundos) para aguardar respostas da API
4. **Dados Reais:** Os dados salvos no MongoDB são dados reais de focos de incêndio do mundo inteiro
5. **Sem Limpeza Automática:** Os dados salvos não são removidos automaticamente - são dados reais para uso no frontend
6. **Rate Limiting:** A API NASA FIRMS tem limites de requisições - os testes respeitam esses limites

## Troubleshooting

### Erro: "Cannot find module"
- Certifique-se de que TypeScript está compilado ou use `ts-node/register`
- Verifique se os caminhos de import estão corretos

### Erro: "MongoDB connection failed"
- Verifique se `MONGODB_URI` está configurado no `.env`
- Certifique-se de que MongoDB está rodando
- Alguns testes funcionam sem MongoDB

### Erro: "API key required" ou "MAP_KEY is required"
- Configure `MAP_KEY` no arquivo `.env` com uma chave válida da NASA FIRMS
- A chave deve estar ativa e com cotas disponíveis
- Os testes fazem requisições reais, então a chave deve ser válida

### Erro: "Request timeout" ou timeout nos testes
- A API NASA FIRMS pode estar lenta ou com muitos dados
- Os timeouts já estão aumentados (30-60s)
- Verifique sua conexão com a internet
- A API pode estar temporariamente indisponível

### Aviso: "No fire data available"
- É normal se não houver focos de incêndio nas últimas 24 horas na área consultada
- Os testes continuam funcionando mesmo sem dados
- Tente aumentar o parâmetro `days` se necessário

## Melhorias Futuras

- [ ] Testes de performance
- [ ] Testes de carga
- [ ] Testes de rate limiting
- [ ] Cobertura de código mais abrangente
- [ ] Testes de middleware
- [ ] Testes de rotas HTTP completas
