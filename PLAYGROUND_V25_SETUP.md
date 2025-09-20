# 🎨 Playground v2.5 - Setup Guide для рекламных баннеров

## 🎯 ПОЧЕМУ PLAYGROUND V2.5?

✅ **Специально для коммерции** - создана для маркетинговых материалов  
✅ **Превосходит SDXL и DALL-E 3** в пользовательских тестах  
✅ **Коммерческая лицензия** - можно использовать в бизнесе  
✅ **Отличное качество людей** - нет проблем с лицами и руками  
✅ **1024x1024 нативно** - высокое разрешение из коробки  

---

## 📋 ЭТАП 1: Быстрое тестирование

### Локальный тест:
```bash
# Обязательно обновляем diffusers
pip install --upgrade diffusers>=0.27.0
pip install transformers accelerate safetensors

# Запускаем тест
python test-playground-v25.py
```

### Онлайн тестирование:
**Hugging Face Spaces:**
- https://huggingface.co/spaces/playgroundai/playground-v2.5

**Replicate API:**
- https://replicate.com/playgroundai/playground-v2.5-1024px-aesthetic

---

## 🎨 ПРОМПТЫ ДЛЯ ТЕСТИРОВАНИЯ РЕКЛАМЫ:

### 🛒 E-commerce:
```
"Professional e-commerce sale banner, '50% OFF' text, vibrant red and white colors, modern typography, commercial photography style, high quality, detailed, 8k"
```

### 👗 Мода/Luxury:
```
"Luxury fashion advertisement banner, elegant female model wearing designer clothes, minimalist aesthetic, premium brand style, soft lighting, commercial quality, detailed, 8k"
```

### 💰 Финансы/Крипто:
```
"Cryptocurrency trading platform banner, Bitcoin symbols, professional blue and gold color scheme, modern financial design, trustworthy corporate style, detailed, 8k"
```

### 🍔 Еда/Доставка:
```
"Food delivery service advertisement, appetizing gourmet burger, warm inviting colors, lifestyle photography, commercial food styling, detailed, 8k"
```

### 📱 Технологии:
```
"Tech startup mobile app banner, smartphone interface mockup, clean modern design, blue gradient background, professional UI/UX style, detailed, 8k"
```

---

## 🖥️ ЭТАП 2: Продакшн сервер

### Системные требования:
```
Минимум:
- GPU: RTX 4080 (16GB VRAM)
- RAM: 32GB
- Storage: 50GB SSD

Рекомендуемый:
- GPU: RTX 4090 (24GB VRAM) 
- RAM: 64GB
- Storage: 100GB NVMe
```

### Провайдеры для аренды:

#### Nebius.ai (Российский):
- RTX 4090: ~$200/месяц
- Простая настройка
- Стабильная работа

#### RunPod.io:
- RTX 4090: ~$0.79/час ($584/месяц)
- Готовые Docker образы
- Pay-as-you-go

#### Vast.ai:
- RTX 4090: ~$0.50/час ($370/месяц)
- Самые дешевые цены
- Требует настройки

---

## 🔧 ЭТАП 3: Установка на сервере

### Docker установка (рекомендуется):

```bash
# Создаем Dockerfile
cat > Dockerfile << 'EOF'
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y git

# Обновляем pip и устанавливаем зависимости
RUN pip install --upgrade pip
RUN pip install diffusers>=0.27.0 transformers accelerate safetensors fastapi uvicorn

# Копируем код
COPY . .

EXPOSE 8000

CMD ["python", "playground_api.py"]
EOF

# Билдим и запускаем
docker build -t playground-v25 .
docker run --gpus all -p 8000:8000 playground-v25
```

### Прямая установка:

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Python и CUDA
sudo apt install python3-pip python3-venv git -y

# Создаем виртуальное окружение
python3 -m venv playground-env
source playground-env/bin/activate

# Устанавливаем зависимости (ВАЖНО: правильная версия diffusers)
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install diffusers>=0.27.0 transformers accelerate safetensors
pip install fastapi uvicorn pillow
```

---

## 🌐 ЭТАП 4: API сервер для BannerAdsAI

### Создаем API:

```python
# playground_api.py
from fastapi import FastAPI, HTTPException
from diffusers import DiffusionPipeline
import torch
import base64
import io
from PIL import Image

app = FastAPI(title="Playground v2.5 API для BannerAdsAI")

# Глобальная переменная для модели
pipe = None

@app.on_event("startup")
async def load_model():
    global pipe
    print("🎨 Загружаем Playground v2.5...")
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    dtype = torch.float16 if device == "cuda" else torch.float32
    
    pipe = DiffusionPipeline.from_pretrained(
        "playgroundai/playground-v2.5-1024px-aesthetic",
        torch_dtype=dtype,
        variant="fp16" if device == "cuda" else None
    ).to(device)
    
    print("✅ Playground v2.5 готова к работе!")

@app.post("/generate")
async def generate_advertisement(
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    steps: int = 50,
    guidance_scale: float = 3.0
):
    """
    Генерация рекламного баннера через Playground v2.5
    """
    try:
        # Оптимизируем промпт для рекламы
        optimized_prompt = f"{prompt}, commercial photography style, high quality, detailed, 8k"
        
        # Генерируем изображение
        image = pipe(
            prompt=optimized_prompt,
            width=width,
            height=height,
            num_inference_steps=steps,
            guidance_scale=guidance_scale
        ).images[0]
        
        # Конвертируем в base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            "image": f"data:image/png;base64,{img_str}",
            "model": "playground-v2.5",
            "width": width,
            "height": height,
            "steps": steps
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "playground-v2.5"}

@app.get("/models")
async def list_models():
    return {
        "available_models": ["playground-v2.5"],
        "specialization": "commercial_advertising",
        "max_resolution": "1024x1024"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Запуск API:
```bash
python playground_api.py
```

### Тестирование API:
```bash
# Проверка работоспособности
curl http://localhost:8000/health

# Тест генерации
curl -X POST "http://localhost:8000/generate" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Professional e-commerce sale banner, modern design"}'
```

---

## 🔗 ЭТАП 5: Интеграция в BannerAdsAI

### Backend изменения:

```javascript
// backend/routes/playground-generator.js
const axios = require('axios');

const PLAYGROUND_API_URL = process.env.PLAYGROUND_API_URL || 'http://playground-server:8000';

async function generateWithPlayground(prompt, options = {}) {
  try {
    const response = await axios.post(`${PLAYGROUND_API_URL}/generate`, {
      prompt: prompt,
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 50,
      guidance_scale: options.guidance_scale || 3.0
    });
    
    return {
      imageUrl: response.data.image,
      model: 'playground-v2.5',
      width: response.data.width,
      height: response.data.height
    };
  } catch (error) {
    throw new Error(`Playground generation failed: ${error.message}`);
  }
}

module.exports = { generateWithPlayground };
```

### Frontend изменения:

```javascript
// Добавляем в список моделей
const imageModels = [
  'recraftv3',
  'realistic', 
  'digital-illustration',
  'vector-illustration',
  'playground-v2.5'  // ← новая модель для рекламы
];

// В описании модели
const modelDescriptions = {
  'playground-v2.5': 'Специально для рекламных баннеров (премиум качество)'
};
```

---

## 📊 ЭТАП 6: Тестирование и оптимизация

### Нагрузочное тестирование:
```bash
# Тест производительности
for i in {1..10}; do
  curl -X POST "http://localhost:8000/generate" \
       -H "Content-Type: application/json" \
       -d '{"prompt": "Test banner"}' &
done
wait
```

### Мониторинг:
- GPU утилизация
- Время генерации
- Память VRAM
- Стабильность API

### Оптимизация для продакшна:
- Кеширование часто используемых промптов
- Batch обработка
- Автоматическое масштабирование

---

## 🚨 TROUBLESHOOTING

### Частые проблемы:

**Ошибка версии diffusers:**
```bash
pip install --upgrade diffusers>=0.27.0
```

**Out of Memory:**
```bash
# Уменьшаем разрешение
width=512, height=512
# Или уменьшаем guidance_scale
guidance_scale=2.0
```

**Медленная загрузка:**
```bash
export HF_HOME=/path/to/cache
export TRANSFORMERS_CACHE=/path/to/cache
```

---

## 📈 ГОТОВНОСТЬ К ПРОДАКШЕНУ

### Чеклист:
- [ ] Локальный тест пройден успешно
- [ ] GPU сервер арендован и настроен
- [ ] API работает стабильно
- [ ] Интеграция в BannerAdsAI завершена
- [ ] Нагрузочное тестирование проведено
- [ ] Мониторинг настроен

### Ожидаемые метрики:
- **Время генерации:** 15-30 сек
- **Успешность:** 95%+
- **Качество:** коммерческое
- **Стабильность:** 99.9% uptime

---

## 💰 ЭКОНОМИКА

### Стоимость в месяц:
- **GPU сервер:** $200-400
- **API вызовы:** $0 (собственная модель)
- **Обслуживание:** $50-100

### Break-even:
- При 1000+ генераций/месяц выгоднее собственной модели
- При меньших объемах - лучше оставаться на Recraft.ai

---

**🎯 Playground v2.5 - идеальное решение для профессиональных рекламных баннеров!**