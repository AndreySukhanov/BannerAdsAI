# BannerAdsAI Backend

Backend API сервер для приложения BannerAdsAI, заменяющий интеграции base44.

## Возможности

- **LLM API** - генерация заголовков через OpenAI GPT-4o-mini
- **Image Generation** - создание изображений через Recraft.ai с выбором между 4 моделями
- **File Upload** - загрузка пользовательских изображений
- **Web Scraping** - анализ контента веб-страниц для контекста

## Установка

```bash
# Установить зависимости
npm install

# Скопировать файл окружения
cp .env.example .env
```

## Настройка переменных окружения

Отредактируйте файл `.env`:

```bash
# Основные настройки
PORT=3001
NODE_ENV=development

# OpenAI (для генерации заголовков)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Recraft.ai (для генерации изображений)
RECRAFT_API_KEY=your-recraft-api-key-here

# Настройки загрузки файлов
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/png,image/jpeg,image/gif,image/webp

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Запуск

```bash
# Разработка
npm run dev

# Продакшн
npm start
```

Сервер будет доступен по адресу: `http://localhost:3001`

## API Endpoints

### Health Check
```
GET /health
```

### Multi-Agent Banner Generation
```
POST /api/agents/generate-banner
Body: {
  "url": "https://example.com",
  "size": "300x250",
  "template": "blue_white",
  "font": "roboto",
  "imageModel": "recraft-v3",
  "uploadedImage": "optional_image_url"
}
```

### Generate Headlines Only
```
POST /api/agents/generate-headlines
Body: {
  "url": "https://example.com",
  "template": "blue_white"
}
```

### Generate Banner from Headline
```
POST /api/agents/generate-banner-from-headline
Body: {
  "selectedHeadline": "Your headline text",
  "size": "300x250",
  "template": "blue_white",
  "font": "roboto",
  "imageModel": "realistic",
  "webContent": {...},
  "uploadedImage": "optional_image_url"
}
```

### Task Status
```
GET /api/agents/task/:taskId
```

### System Stats
```
GET /api/agents/stats
```

### Legacy Endpoints

### Генерация текста
```
POST /api/invoke-llm
Body: {
  "prompt": "Ваш промпт",
  "add_context_from_internet": true
}
```

### Генерация изображений
```
POST /api/generate-image
Body: {
  "prompt": "Описание изображения"
}
```

### Загрузка файлов
```
POST /api/upload-file
Content-Type: multipart/form-data
Field: file
```

## Провайдеры ИИ

### OpenAI
- **Текст:** GPT-4o-mini (генерация заголовков)
- Требуется `OPENAI_API_KEY`

### Recraft.ai (для изображений)
- **Модели:**
  - `recraft-v3` - универсальная модель высокого качества
  - `realistic` - фотореалистичные изображения
  - `digital-illustration` - цифровые иллюстрации  
  - `vector-illustration` - векторная графика
- Требуется `RECRAFT_API_KEY`

## Структура проекта

```
backend/
├── server.js              # Основной сервер Express
├── routes/
│   ├── multi-agent.js     # Multi-agent API маршруты
│   ├── llm.js             # LLM API маршруты  
│   ├── image-generation.js # Генерация изображений
│   └── file-upload.js     # Загрузка файлов
├── agents/                # Multi-agent система
│   ├── coordinator.js     # Координатор агентов
│   ├── headline-agent.js  # Генерация заголовков
│   ├── image-agent.js     # Генерация изображений
│   ├── banner-agent.js    # Сборка баннеров
│   └── webscraping-agent.js # Веб-скрапинг
├── utils/
│   ├── openai.js          # OpenAI API интеграция
│   ├── recraft.js         # Recraft.ai API интеграция
│   └── image-generation.js # Утилиты для изображений
├── uploads/               # Загруженные файлы
└── .env                   # Переменные окружения
```

## Безопасность

- CORS настроен для разрешенных доменов
- Валидация типов и размеров файлов
- Ограничения на размер запросов
- Обработка ошибок без утечки информации

## Мониторинг

Проверка работоспособности API:
```bash
curl http://localhost:3001/health
```

## Multi-Agent Architecture

Система использует специализированных агентов для обработки разных этапов генерации баннеров:

1. **CoordinatorAgent** - координирует работу всех агентов
2. **WebScrapingAgent** - анализирует контент веб-страниц
3. **HeadlineAgent** - генерирует заголовки на основе контента
4. **ImageAgent** - создает изображения через Recraft.ai
5. **BannerAgent** - собирает финальные баннеры

### Поток обработки
1. Анализ URL → получение контента страницы
2. Генерация заголовков → 3 варианта в разных стилях  
3. Создание изображений → использование выбранной модели Recraft.ai
4. Сборка баннеров → комбинирование текста и изображений

## Troubleshooting

### Ошибки OpenAI API
- Проверьте корректность API ключа
- Убедитесь в наличии средств на счету OpenAI
- Проверьте лимиты запросов

### Ошибки Recraft.ai API
- Проверьте корректность `RECRAFT_API_KEY`
- Убедитесь в наличии средств на аккаунте Recraft
- Проверьте поддерживаемые модели: `recraft-v3`, `realistic`, `digital-illustration`, `vector-illustration`

### Ошибки загрузки файлов
- Убедитесь в наличии прав на запись в директорию uploads
- Проверьте размер файла (по умолчанию лимит 10MB)
- Проверьте тип файла (разрешены только изображения)

### Ошибки CORS
- Добавьте домен фронтенда в `ALLOWED_ORIGINS`
- Для разработки используйте точный URL с портом

### Multi-Agent System
- Проверьте логи для отслеживания этапов обработки
- Используйте `/api/agents/task/:taskId` для мониторинга статуса задач
- Просматривайте системную статистику через `/api/agents/stats`