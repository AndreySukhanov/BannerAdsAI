# 🚀 ByteDance SDXL-Lightning - Setup Guide

## 📋 ЭТАП 1: Тестирование модели

### Быстрый тест локально:

```bash
# Установка зависимостей
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install diffusers transformers accelerate

# Запуск теста
python test-bytedance.py
```

### Альтернативный тест через Colab:
1. Открыть Google Colab
2. Вставить код из `test-bytedance.py`
3. Запустить на бесплатном GPU

---

## 🖥️ ЭТАП 2: Аренда GPU сервера

### Рекомендуемые провайдеры:

#### Nebius.ai (Российский)
- GPU: RTX 4090 (24GB) ~$150/месяц
- Простая настройка через веб-интерфейс
- Нет проблем с оплатой

#### RunPod.io  
- GPU: RTX 4090 ~$0.79/час ($584/месяц)
- Pay-as-you-go модель
- Готовые Docker образы

#### Vast.ai
- GPU: RTX 4090 ~$0.50/час ($370/месяч)
- Самые дешевые цены
- Требует настройки

### Минимальные требования:
- **GPU:** 12GB VRAM (RTX 4080+)
- **RAM:** 16GB
- **Storage:** 50GB SSD
- **OS:** Ubuntu 20.04+

---

## 🔧 ЭТАП 3: Установка на сервере

### Docker установка (рекомендуется):

```bash
# Клонируем репозиторий
git clone https://github.com/ByteDance/SDXL-Lightning.git
cd SDXL-Lightning

# Создаем Dockerfile
cat > Dockerfile << 'EOF'
FROM pytorch/pytorch:2.0.1-cuda11.7-cudnn8-runtime

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "api_server.py"]
EOF

# Билдим и запускаем
docker build -t bytedance-lightning .
docker run --gpus all -p 8000:8000 bytedance-lightning
```

### Прямая установка:

```bash
# Обновляем систему
sudo apt update && sudo apt upgrade -y

# Устанавливаем Python и CUDA
sudo apt install python3-pip python3-venv git -y

# Создаем виртуальное окружение
python3 -m venv bytedance-env
source bytedance-env/bin/activate

# Устанавливаем зависимости
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install diffusers transformers accelerate fastapi uvicorn

# Клонируем и настраиваем
git clone https://github.com/ByteDance/SDXL-Lightning.git
cd SDXL-Lightning
```

---

## 🌐 ЭТАП 4: API интеграция

### Создаем API сервер:

```python
# api_server.py
from fastapi import FastAPI
from diffusers import StableDiffusionXLPipeline, EulerDiscreteScheduler
import torch
import base64
import io

app = FastAPI()

# Загружаем модель при старте
pipe = StableDiffusionXLPipeline.from_pretrained(
    "ByteDance/SDXL-Lightning",
    variant="fp16", 
    torch_dtype=torch.float16
).to("cuda")

pipe.scheduler = EulerDiscreteScheduler.from_config(
    pipe.scheduler.config, 
    timestep_spacing="trailing"
)

@app.post("/generate")
async def generate_image(prompt: str, steps: int = 2):
    try:
        image = pipe(
            prompt=prompt,
            num_inference_steps=steps,
            guidance_scale=0,
            width=512,
            height=512
        ).images[0]
        
        # Конвертируем в base64
        buffer = io.BytesIO()
        image.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return {"image": f"data:image/png;base64,{img_str}"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Запуск API:
```bash
python api_server.py
```

---

## 🔗 ЭТАП 5: Интеграция в BannerAdsAI

### Backend изменения:

```javascript
// backend/routes/bytedance-generator.js
const axios = require('axios');

const BYTEDANCE_API_URL = 'http://bytedance-server:8000';

async function generateWithByteDance(prompt, options = {}) {
  try {
    const response = await axios.post(`${BYTEDANCE_API_URL}/generate`, {
      prompt: prompt,
      steps: options.steps || 2
    });
    
    return {
      imageUrl: response.data.image,
      model: 'bytedance-lightning'
    };
  } catch (error) {
    throw new Error(`ByteDance generation failed: ${error.message}`);
  }
}

module.exports = { generateWithByteDance };
```

### Frontend изменения:

```javascript
// Добавить в выбор модели
const imageModels = [
  'recraftv3',
  'realistic', 
  'digital-illustration',
  'vector-illustration',
  'bytedance-lightning' // ← новая модель
];
```

---

## 📊 ТЕСТИРОВАНИЕ

### Промпты для тестирования:
1. "Professional advertisement banner, modern typography, red and white colors"
2. "E-commerce sale banner 50% off, vibrant colors, bold text"  
3. "Financial services ad, blue corporate colors, trustworthy design"
4. "Food delivery banner, appetizing burger, warm colors"
5. "Fashion brand ad, elegant model, minimalist design"

### Метрики для оценки:
- **Скорость:** должно быть < 5 секунд
- **Качество:** пригодно для рекламы
- **Стабильность:** 95%+ успешных генераций

---

## 🚨 TROUBLESHOOTING

### Общие проблемы:

**Out of Memory:**
```bash
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:128
```

**Медленная загрузка модели:**
```bash
# Кешируем модель локально
export HF_HOME=/path/to/cache
```

**API не отвечает:**
```bash
# Проверяем статус
curl http://localhost:8000/health
```

---

## 📈 МОНИТОРИНГ

### Логи для отслеживания:
- Время генерации
- Использование VRAM
- Количество запросов
- Ошибки генерации

### Готовность к продакшену:
- [ ] Тест локально пройден
- [ ] Сервер арендован и настроен  
- [ ] API работает стабильно
- [ ] Интеграция в BannerAdsAI завершена
- [ ] Нагрузочное тестирование проведено

---

**🎯 Цель: ByteDance интеграция за 1 неделю!**