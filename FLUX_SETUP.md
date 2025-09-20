# 🔥 FLUX.1-dev - Setup Guide для рекламных баннеров

## 🏆 ПОЧЕМУ FLUX.1-dev?

✅ **Открытая модель** - полностью бесплатная для коммерческого использования  
✅ **Топовое качество** - превосходит DALL-E 3 и конкурирует с Midjourney  
✅ **Отличный текст** - четкая читаемость надписей на баннерах  
✅ **Фотореализм** - идеально для коммерческой фотографии  
✅ **12B параметров** - мощная архитектура rectified flow transformer  

---

## 📋 ЭТАП 1: Быстрое тестирование

### Онлайн тестирование (рекомендуется):

**Replicate API:**
- https://replicate.com/black-forest-labs/flux-dev
- $0.003 за изображение (дешевле чем Recraft!)
- Готов к использованию

**Hugging Face Spaces:**
- https://huggingface.co/spaces/black-forest-labs/FLUX.1-dev
- Бесплатно с ограничениями
- Может быть очередь

### Локальный тест:
```bash
# Требования: 16GB+ VRAM (RTX 4090)
pip install --upgrade diffusers>=0.30.0
pip install transformers accelerate safetensors
python test-flux-dev.py
```

---

## 🎨 ПРОМПТЫ ДЛЯ ТЕСТИРОВАНИЯ РЕКЛАМЫ:

### 🛒 E-commerce:
```
"Professional e-commerce sale banner, '50% OFF' text prominently displayed, vibrant red and white colors, modern clean typography, commercial photography style, high quality, detailed, 8k"
```

### 👗 Мода/Luxury:
```
"Luxury fashion advertisement banner, elegant beautiful female model wearing designer clothes, minimalist aesthetic, premium brand style, soft professional lighting, commercial quality photography, detailed, 8k"
```

### 🍔 Еда/Доставка:
```
"Food delivery service advertisement, appetizing gourmet burger with fresh ingredients, warm inviting colors, lifestyle photography, commercial food styling, professional lighting, detailed, 8k"
```

### 💰 Финансы/Крипто:
```
"Cryptocurrency trading platform banner, Bitcoin and blockchain symbols, professional blue and gold color scheme, modern financial design, trustworthy corporate style, detailed, 8k"
```

### 📱 Технологии:
```
"Tech startup mobile app banner, modern smartphone interface mockup, clean modern design, blue gradient background, professional UI/UX style, detailed, 8k"
```

---

## 🖥️ ЭТАП 2: Продакшн интеграция

### Вариант 1: Replicate API (рекомендуется)

**Преимущества:**
- Готов к использованию немедленно
- $0.003/изображение (дешевле Recraft $0.01)
- Автоматическое масштабирование
- Не нужен собственный сервер

**Интеграция:**
```javascript
// backend/routes/flux-generator.js
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function generateWithFlux(prompt, options = {}) {
  try {
    const output = await replicate.run(
      "black-forest-labs/flux-dev",
      {
        input: {
          prompt: prompt,
          width: options.width || 1024,
          height: options.height || 1024,
          num_inference_steps: options.steps || 25,
          guidance_scale: options.guidance_scale || 3.5
        }
      }
    );
    
    return {
      imageUrl: output[0],
      model: 'flux-dev',
      cost: 0.003
    };
  } catch (error) {
    throw new Error(`FLUX generation failed: ${error.message}`);
  }
}

module.exports = { generateWithFlux };
```

### Вариант 2: Собственный GPU сервер

**Системные требования:**
- GPU: RTX 4090 (24GB VRAM) 
- RAM: 32GB
- Storage: 100GB SSD

**Провайдеры:**
- **Nebius.ai:** RTX 4090 ~$200/месяц
- **RunPod.io:** RTX 4090 ~$0.79/час
- **Vast.ai:** RTX 4090 ~$0.50/час

### Вариант 3: Hugging Face Inference API

**Преимущества:**
- $0.002/изображение (самый дешевый)
- Официальный API
- Хорошая стабильность

```javascript
// backend/routes/hf-flux-generator.js
const axios = require('axios');

async function generateWithHFFlux(prompt, options = {}) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',
      {
        inputs: prompt,
        parameters: {
          width: options.width || 1024,
          height: options.height || 1024,
          num_inference_steps: options.steps || 25
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.HF_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    const base64 = Buffer.from(response.data).toString('base64');
    return {
      imageUrl: `data:image/jpeg;base64,${base64}`,
      model: 'flux-dev-hf',
      cost: 0.002
    };
  } catch (error) {
    throw new Error(`HF FLUX generation failed: ${error.message}`);
  }
}

module.exports = { generateWithHFFlux };
```

---

## 🔗 ЭТАП 3: Интеграция в BannerAdsAI

### Backend изменения:

```javascript
// backend/routes/image-generator.js
const { generateWithRecraft } = require('./recraft-generator');
const { generateWithFlux } = require('./flux-generator');

async function generateImage(prompt, model = 'recraftv3', options = {}) {
  switch (model) {
    case 'flux-dev':
      return await generateWithFlux(prompt, options);
    case 'recraftv3':
    default:
      return await generateWithRecraft(prompt, options);
  }
}

module.exports = { generateImage };
```

### Frontend изменения:

```javascript
// Обновляем список моделей
const imageModels = [
  'recraftv3',
  'realistic', 
  'digital-illustration',
  'vector-illustration',
  'flux-dev'  // ← новая премиум модель
];

// Описания моделей
const modelDescriptions = {
  'flux-dev': 'FLUX.1-dev (премиум качество, отличный текст)',
  'recraftv3': 'Recraft v3 (быстро, хорошее качество)'
};

// Показатели стоимости
const modelCosts = {
  'flux-dev': '$0.003/изображение',
  'recraftv3': '$0.01/изображение'
};
```

---

## 📊 ЭТАП 4: Сравнительное тестирование

### A/B тест с пользователями:
```javascript
// Случайное распределение моделей
const getRandomModel = () => {
  return Math.random() > 0.5 ? 'flux-dev' : 'recraftv3';
};

// Метрики для сравнения
const trackGeneration = (model, prompt, userRating) => {
  analytics.track('banner_generated', {
    model: model,
    prompt_category: detectCategory(prompt),
    user_rating: userRating,
    cost: modelCosts[model]
  });
};
```

### Метрики оценки:
- **Качество изображения:** 1-10
- **Читаемость текста:** 1-10  
- **Коммерческая пригодность:** 1-10
- **Время генерации:** секунды
- **Стоимость:** $ за изображение

---

## 🚨 TROUBLESHOOTING

### Replicate API проблемы:
```bash
# Проверка статуса
curl -H "Authorization: Token $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/account
```

### Hugging Face API проблемы:
```bash
# Тест доступности модели
curl -H "Authorization: Bearer $HF_API_TOKEN" \
     https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev
```

### Локальная установка проблемы:
```bash
# Out of Memory
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

# Медленная загрузка
export HF_HOME=/path/to/large/cache
```

---

## 💰 ЭКОНОМИЧЕСКОЕ СРАВНЕНИЕ

| Метод | Стоимость/изображение | Старт | Масштабирование |
|-------|----------------------|-------|-----------------|
| **Replicate API** | $0.003 | Мгновенно | Автоматическое |
| **HF Inference** | $0.002 | Мгновенно | Ограниченное |
| **Собственный сервер** | $0.001 | $200/месяц | Ручное |
| **Recraft.ai** | $0.01 | Мгновенно | Автоматическое |

### Break-even анализ:
- **До 10,000 изображений/месяц:** Replicate API
- **10,000+ изображений/месяц:** Собственный сервер
- **Тестирование:** HF Inference API

---

## 📈 ПЛАН РАЗВЕРТЫВАНИЯ

### Неделя 1: Тестирование
- [ ] Протестировать FLUX через Replicate
- [ ] A/B тест против Recraft с 100 пользователями
- [ ] Собрать метрики качества

### Неделя 2: Интеграция  
- [ ] API интеграция Replicate/HF
- [ ] UI обновление с выбором модели
- [ ] Система фоллбеков

### Неделя 3: Оптимизация
- [ ] Тонкая настройка промптов
- [ ] Кеширование популярных запросов
- [ ] Мониторинг затрат

### Неделя 4: Масштабирование
- [ ] Автоматический выбор модели по типу баннера
- [ ] Batch обработка для скидок
- [ ] Рассмотрение собственного сервера

---

**🎯 FLUX.1-dev - революция в качестве генерации баннеров за меньшие деньги!**