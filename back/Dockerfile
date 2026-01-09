# Etapa de construcción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias (incluyendo devDependencies para el build)
RUN npm install

# Generar cliente de Prisma
RUN npm run prisma:generate

# Copiar el código fuente
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:20-alpine AS production

WORKDIR /app

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Instalar solo dependencias de producción
RUN npm install --only=production

# Generar cliente de Prisma para producción
RUN npm run prisma:generate

# Exponer el puerto (por defecto suele ser 3000, pero se configura por ENV)
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
