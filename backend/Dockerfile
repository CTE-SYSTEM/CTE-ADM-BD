FROM node:20-alpine
WORKDIR /app

# Copia dependencias
COPY package*.json ./
RUN npm install

# Copia el código y el archivo de Prisma
COPY . .

# Genera el cliente de Prisma para SQL Server
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "dev"]