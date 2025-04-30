#!/bin/bash
# validate.sh

# Construir e iniciar o ambiente Docker
docker-compose up -d

# Aguardar o backend estar pronto
echo "Aguardando o backend inicializar..."
until $(curl --output /dev/null --silent --head --fail http://localhost:3001/plants); do
  printf '.'
  sleep 5
done
echo "Backend inicializado!"

# Executar os testes
docker-compose -f docker-compose.test.yml up --build

# Verificar status dos testes
TEST_EXIT_CODE=$?

# Limpar ambiente
docker-compose down

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "Validação concluída com sucesso!"
else
  echo "Falha na validação."
  exit 1
fi