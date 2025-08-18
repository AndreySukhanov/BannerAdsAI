# API Reference

## Основные эндпоинты

### Headlines Generation

**POST** `/api/agents/generate-headlines`

Генерирует заголовки на основе URL страницы с автоматическим определением языка.

#### Request Body
```json
{
  "url": "https://www.lefigaro.fr/meteo/...",
  "template": "blue_white"
}
```

#### Response
```json
{
  "success": true,
  "taskId": 1,
  "headlines": [
    {
      "id": 1,
      "text": "CHALEUR CANICULAIRE : RESTEZ AU FRAIS",
      "style": "benefit",
      "language": "fr",
      "template": "blue_white"
    },
    {
      "id": 2, 
      "text": "ÉVITEZ LA DÉSHYDRATATION : CONSEILS",
      "style": "problem-solving",
      "language": "fr",
      "template": "blue_white"
    },
    {
      "id": 3,
      "text": "PROTÉGEZ-VOUS DÈS MAINTENANT", 
      "style": "call-to-action",
      "language": "fr",
      "template": "blue_white"
    }
  ],
  "content": {
    "title": "Jusqu'à 40°C près de la Méditerranée...",
    "language": "fr",
    "contentLength": 3000
  }
}
```

### Banner Generation from Headline

**POST** `/api/agents/generate-banner-from-headline`

Генерирует баннеры на основе заголовка с изображениями.

#### Request Body
```json
{
  "headline": "CHALEUR CANICULAIRE : RESTEZ AU FRAIS",
  "size": "300x250",
  "template": "blue_white",
  "hasUploadedImage": false,
  "hasWebContent": true
}
```

#### Response
```json
{
  "success": true,
  "taskId": 2,
  "banners": [
    {
      "id": 1,
      "headline": "CHALEUR CANICULAIRE : RESTEZ AU FRAIS",
      "image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...",
      "size": "300x250",
      "template": "blue_white",
      "composition": {
        "textOverlay": {
          "position": "bottom",
          "heightRatio": 30,
          "backgroundColor": "rgba(0, 102, 204, 0.9)",
          "color": "#ffffff",
          "stroke": { "enabled": false }
        }
      }
    }
  ]
}
```

## Поддерживаемые языки

| Код | Язык | Автодетекция |
|-----|------|--------------|
| `ru` | Русский | ✅ |
| `en` | Английский | ✅ |  
| `fr` | Французский | ✅ |
| `de` | Немецкий | ✅ |
| `es` | Испанский | ✅ |

## Шаблоны баннеров

### blue_white
- **Стиль**: Деловой, профессиональный
- **Цвета**: Синий градиент + белый текст
- **Использование**: Корпоративные, информационные баннеры

### red_white  
- **Стиль**: Энергичный, призывающий к действию
- **Цвета**: Красный градиент + белый текст
- **Использование**: Акционные, срочные предложения

## Размеры баннеров

| Размер | Пропорции | Описание |
|--------|-----------|----------|
| `300x250` | 6:5 | Прямоугольный баннер |
| `728x90` | 8:1 | Горизонтальный лидерборд |
| `160x600` | 4:15 | Вертикальный скайскрейпер |
| `320x50` | 32:5 | Мобильный баннер |

## Форматы изображений

- **Входной формат**: OpenAI DALL-E 3 (1024x1024 PNG)
- **Выходной формат**: Base64 encoded PNG
- **Качество**: HD (высокое разрешение)
- **Стиль**: Гиперреалистичная фотография

## Ошибки и статусы

### Успешные ответы
```json
{
  "success": true,
  "taskId": 123,
  "data": { ... }
}
```

### Ошибки
```json
{
  "success": false,
  "error": "Failed to generate images",
  "details": "OpenAI API rate limit exceeded"
}
```

### Коды ошибок
- `400` - Неверные параметры запроса
- `429` - Превышен лимит запросов OpenAI API
- `500` - Внутренняя ошибка сервера

## Ограничения

### Заголовки
- Максимальная длина: 60 символов
- Количество: 3 заголовка на запрос
- Стили: benefit, problem-solving, call-to-action

### Изображения  
- Количество: до 3 изображений на баннер
- Разрешение: 1024x1024 (масштабируется под размер баннера)
- Время генерации: 10-30 секунд на изображение

### Rate Limiting
- OpenAI API: согласно лимитам аккаунта
- Сервер: без ограничений (контролируется OpenAI)

## Примеры использования

### cURL
```bash
# Генерация заголовков
curl -X POST http://localhost:3010/api/agents/generate-headlines \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.lemonde.fr/economie/...",
    "template": "blue_white"
  }'

# Генерация баннера  
curl -X POST http://localhost:3010/api/agents/generate-banner-from-headline \
  -H "Content-Type: application/json" \
  -d '{
    "headline": "ÉCONOMIE : DÉCOUVREZ LES TENDANCES",
    "size": "300x250", 
    "template": "blue_white",
    "hasUploadedImage": false,
    "hasWebContent": true
  }'
```

### JavaScript/Fetch
```javascript
// Генерация заголовков
const response = await fetch('/api/agents/generate-headlines', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://www.spiegel.de/politik/...',
    template: 'red_white'
  })
});

const { headlines } = await response.json();

// Генерация баннера
const bannerResponse = await fetch('/api/agents/generate-banner-from-headline', {
  method: 'POST', 
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    headline: headlines[0].text,
    size: '300x250',
    template: 'red_white',
    hasUploadedImage: false,
    hasWebContent: true
  })
});

const { banners } = await bannerResponse.json();
```

## Переменные окружения

```bash
# OpenAI конфигурация
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4o-mini
OPENAI_IMAGE_MODEL=dall-e-3
OPENAI_IMAGE_SIZE=1024x1024  
OPENAI_IMAGE_QUALITY=hd

# Сервер
PORT=3010
ALLOWED_ORIGINS=http://localhost:5173
```
