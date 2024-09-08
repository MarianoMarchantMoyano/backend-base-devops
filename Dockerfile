# Usar una imagen de Node.js para la fase de construcción
FROM node:20.11.1-alpine3.19 AS builder

WORKDIR /usr/src/app

# Copiar archivos de configuración y dependencias
COPY package.json package-lock.json ./
RUN npm install

# Copiar el código fuente y construir la aplicación
COPY . .
RUN npm run build

# Usar una imagen más ligera para la fase de ejecución
FROM node:20.11.1-alpine3.19

WORKDIR /usr/src/app

# Copiar solo los archivos necesarios desde la fase de construcción
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

CMD ["node", "dist/index.js"]

CMD ["node","dist/index.js"]