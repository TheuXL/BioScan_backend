# Testes do MongoDB

Este diretório contém os testes para a conexão e operações do MongoDB.

## Estrutura

```
MongoDB/
├── mongoDB.test.js    # Testes principais do MongoDB
└── README.md          # Esta documentação
```

## Executando os Testes

### Todos os testes
```bash
npm test
```

### Apenas testes do MongoDB
```bash
npm test -- src/__tests__/MongoDB/mongoDB.test.js
```

### Com verbose
```bash
npm test -- --verbose src/__tests__/MongoDB/mongoDB.test.js
```

## Pré-requisitos

1. **Variáveis de Ambiente:**
   - `MONGODB_URI` - URI de conexão do MongoDB (obrigatória)
   - Exemplo: `mongodb://localhost:27017/bio_scan_db`

2. **MongoDB:**
   - MongoDB deve estar rodando e acessível
   - Pode ser local ou remoto
   - Para Docker: `docker-compose up mongodb`

## Cobertura de Testes

### Conexão MongoDB
- ✅ Conexão bem-sucedida
- ✅ Validação de MONGODB_URI
- ✅ Estados de conexão
- ✅ Informações da conexão (host, port, database)

### Operações Básicas (CRUD)
- ✅ Create - Criar documentos
- ✅ Read - Ler documentos
- ✅ Update - Atualizar documentos
- ✅ Delete - Deletar documentos
- ✅ Bulk Operations - Operações em lote

### NasaFireModel
- ✅ Criação com campos obrigatórios
- ✅ Validação de campos obrigatórios
- ✅ Validação de enums (source, daynight)
- ✅ Geração automática de fireId
- ✅ Unicidade de fireId
- ✅ Timestamps automáticos

### Índices
- ✅ Verificação de existência de índices
- ✅ Uso de índices para consultas eficientes
- ✅ Performance de consultas indexadas

### Operações de Consulta
- ✅ Filtros por campo (source, date)
- ✅ Filtros por range numérico
- ✅ Ordenação de resultados
- ✅ Limite de resultados
- ✅ Contagem de documentos

### Collections
- ✅ Acesso às collections
- ✅ Nome correto das collections

### Tratamento de Erros
- ✅ Erros de conexão
- ✅ Erros de validação
- ✅ Erros de tipo de dados

### Performance
- ✅ Operações concorrentes
- ✅ Múltiplas operações simultâneas

## Estrutura dos Testes

### Setup e Teardown
- `beforeAll`: Conecta ao MongoDB
- `afterAll`: Limpa dados de teste e fecha conexão
- `beforeEach`: Prepara dados para testes de consulta (quando necessário)

### Limpeza de Dados
Os testes automaticamente limpam dados de teste após execução:
- Documentos com `fireId` começando com `test_`
- Documentos com campos de teste específicos
- Dados de todas as collections de modelos

## Exemplos de Testes

### Teste de Conexão
```javascript
test('should connect to MongoDB successfully', async () => {
  expect(mongoose.connection.readyState).toBe(1);
});
```

### Teste de CRUD
```javascript
test('should perform create operation', async () => {
  const document = await NasaFireModel.create(testData);
  expect(document._id).toBeDefined();
});
```

### Teste de Validação
```javascript
test('should enforce required fields', async () => {
  await expect(
    NasaFireModel.create({ /* missing required fields */ })
  ).rejects.toThrow();
});
```

## Notas Importantes

1. **Dados de Teste:** Todos os dados de teste são automaticamente removidos após os testes
2. **Timeout:** Testes de integração têm timeout aumentado (10-15 segundos)
3. **Conexão:** Testes verificam se MongoDB está conectado antes de executar operações
4. **Isolamento:** Cada teste é isolado e não depende de outros

## Troubleshooting

### Erro: "MONGODB_URI is not defined"
- Configure `MONGODB_URI` no arquivo `.env`
- Verifique se o arquivo `.env` está na raiz do projeto

### Erro: "Connection timeout"
- Verifique se MongoDB está rodando
- Verifique se a URI está correta
- Verifique firewall/rede se MongoDB for remoto

### Erro: "Collection not found"
- Normal em primeira execução
- Collections são criadas automaticamente quando necessário

### Erro: "Index already exists"
- Normal, índices são criados uma vez
- Pode ser ignorado se não causar falha no teste

## Melhorias Futuras

- [ ] Testes de transações
- [ ] Testes de replicação
- [ ] Testes de sharding
- [ ] Testes de backup/restore
- [ ] Testes de performance mais abrangentes
- [ ] Testes de todos os modelos (não apenas NasaFireModel)
- [ ] Testes de agregações complexas
