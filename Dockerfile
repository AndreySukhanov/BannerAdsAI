# Multi-stage build для BannerAdsAI
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package files и устанавливаем зависимости
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --production
RUN cd backend && npm install --production

# Копируем исходный код
COPY . .

# Билдим фронтенд
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем PM2 для управления процессами
RUN npm install -g pm2

# Копируем backend
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/node_modules ./node_modules

# Копируем собранный фронтенд
COPY --from=builder /app/dist ./dist

# Создаем директории для данных
RUN mkdir -p backend/data/history backend/data/ratings backend/uploads

# Копируем PM2 конфиг
COPY ecosystem.config.js ./

# Экспонируем порты
EXPOSE 3001 4173

# Переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=3001
ENV FRONTEND_PORT=4173

# Запуск с PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]