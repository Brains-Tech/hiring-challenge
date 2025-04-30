FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json yarn.lock ./

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código fonte
COPY . .

# Compilar o código TypeScript
RUN yarn build

# Expor a porta utilizada pela aplicação
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["yarn", "start"]