FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Exponemos el puerto de Vite
EXPOSE 5173

# El flag --host es CRUCIAL para que se vea en el Wi-Fi
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]