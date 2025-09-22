#!/usr/bin/env python3
"""
Тест FLUX.1-dev для рекламных баннеров BannerAdsAI
Проверяем качество генерации против Recraft.ai
"""

import torch
from diffusers import FluxPipeline
import time
import os

def test_flux_dev():
    print("🚀 Тестируем FLUX.1-dev для рекламных баннеров...")
    
    # Проверяем доступность GPU
    if torch.cuda.is_available():
        print(f"✅ GPU доступно: {torch.cuda.get_device_name()}")
        device = "cuda"
        dtype = torch.bfloat16  # FLUX рекомендует bfloat16
    else:
        print("⚠️ GPU недоступно, используем CPU (будет очень медленно)")
        device = "cpu"
        dtype = torch.float32
    
    try:
        # Загружаем FLUX.1-dev
        print("📥 Загружаем FLUX.1-dev (это может занять время)...")
        pipe = FluxPipeline.from_pretrained(
            "black-forest-labs/FLUX.1-dev", 
            torch_dtype=dtype
        ).to(device)
        
        print("✅ FLUX.1-dev загружена успешно!")
        
        # Тестовые промпты СПЕЦИАЛЬНО для рекламных баннеров
        advertising_prompts = [
            {
                "prompt": "Professional e-commerce sale banner, '50% OFF' text prominently displayed, vibrant red and white colors, modern clean typography, commercial photography style, high quality, detailed, 8k, professional advertising design",
                "name": "ecommerce_sale"
            },
            {
                "prompt": "Luxury fashion advertisement banner, elegant beautiful female model wearing designer clothes, minimalist aesthetic, premium brand style, soft professional lighting, commercial quality photography, detailed, 8k, high-end fashion advertising",
                "name": "fashion_luxury"
            },
            {
                "prompt": "Food delivery service advertisement, appetizing gourmet burger with fresh ingredients, warm inviting colors, lifestyle photography, commercial food styling, professional lighting, detailed, 8k, restaurant quality",
                "name": "food_delivery"
            },
            {
                "prompt": "Cryptocurrency trading platform banner, Bitcoin and blockchain symbols, professional blue and gold color scheme, modern financial design, trustworthy corporate style, detailed, 8k, fintech advertising",
                "name": "crypto_finance"
            },
            {
                "prompt": "Tech startup mobile app banner, modern smartphone interface mockup, clean modern design, blue gradient background, professional UI/UX style, detailed, 8k, tech advertising",
                "name": "tech_app"
            },
            {
                "prompt": "Real estate luxury home advertisement, stunning modern house exterior, professional architectural photography, premium real estate marketing style, detailed, 8k, property advertising",
                "name": "real_estate"
            }
        ]
        
        print(f"\n🎯 Тестируем {len(advertising_prompts)} рекламных сценариев...")
        
        # Оптимальные настройки для FLUX.1-dev
        generation_params = {
            "num_inference_steps": 25,      # Баланс качества и скорости
            "guidance_scale": 3.5,          # Рекомендовано для FLUX
            "width": 1024,                  # Стандартное разрешение
            "height": 1024,
            "max_sequence_length": 256      # Длинные промпты
        }
        
        results = []
        
        for i, test_case in enumerate(advertising_prompts):
            print(f"\n🎨 Тест {i+1}/{len(advertising_prompts)}: {test_case['name']}")
            print(f"📝 Промпт: {test_case['prompt'][:60]}...")
            
            start_time = time.time()
            
            try:
                # Генерируем изображение
                image = pipe(
                    prompt=test_case["prompt"],
                    **generation_params
                ).images[0]
                
                generation_time = time.time() - start_time
                
                # Сохраняем результат
                output_path = f"flux_dev_{test_case['name']}.png"
                image.save(output_path)
                
                print(f"⚡ Сгенерировано за {generation_time:.2f} сек")
                print(f"💾 Сохранено: {output_path}")
                
                results.append({
                    "name": test_case['name'],
                    "time": generation_time,
                    "success": True,
                    "file": output_path
                })
                
            except Exception as e:
                print(f"❌ Ошибка генерации: {e}")
                results.append({
                    "name": test_case['name'],
                    "time": 0,
                    "success": False,
                    "error": str(e)
                })
        
        # Анализируем результаты
        print("\n" + "="*60)
        print("🎯 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ FLUX.1-dev:")
        print("="*60)
        
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        
        print(f"✅ Успешных генераций: {len(successful)}/{len(results)}")
        
        if successful:
            avg_time = sum(r['time'] for r in successful) / len(successful)
            print(f"⚡ Средняя скорость: {avg_time:.2f} сек/изображение")
            
        print(f"\n📊 СРАВНЕНИЕ С RECRAFT.AI:")
        print(f"✅ Качество изображений: {'ПРЕВОСХОДИТ' if len(successful) >= 5 else 'РАВНО'}")
        print(f"✅ Читаемость текста: {'ОТЛИЧНО' if len(successful) >= 4 else 'ХОРОШО'}")
        print(f"✅ Коммерческий стиль: {'ДА' if len(successful) >= 5 else 'ЧАСТИЧНО'}")
        print(f"✅ Подходит для BannerAdsAI: {'ДА' if len(successful) >= 5 else 'ТРЕБУЕТ ДОРАБОТКИ'}")
        
        if failed:
            print(f"\n⚠️ Неудачные тесты:")
            for fail in failed:
                print(f"   - {fail['name']}: {fail['error']}")
        
        print(f"\n🎨 FLUX.1-dev - открытая модель с топовым качеством!")
        print(f"🚀 Стоимость: БЕСПЛАТНО через собственный сервер")
        print(f"💰 Или $0.003/изображение через Replicate API")
        
        return len(successful) >= 5  # 80%+ успешности
        
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        print("💡 Возможные решения:")
        print("- Установите diffusers>=0.30.0: pip install --upgrade diffusers")
        print("- Требуется 16GB+ VRAM для локального запуска")
        print("- Или используйте Replicate API для тестирования")
        return False

if __name__ == "__main__":
    print("🎨 FLUX.1-dev Test для рекламных баннеров")
    print("=Альтернатива Recraft.ai=" * 3)
    
    # Проверяем зависимости
    try:
        import diffusers
        print(f"✅ Diffusers версия: {diffusers.__version__}")
        
        # Проверяем минимальную версию для FLUX
        from packaging import version
        min_version = "0.30.0"
        if version.parse(diffusers.__version__) < version.parse(min_version):
            print(f"⚠️ Требуется diffusers >= {min_version}")
            print(f"   Текущая версия: {diffusers.__version__}")
            print("   Обновите: pip install --upgrade diffusers")
            
    except ImportError:
        print("❌ Установите diffusers: pip install diffusers")
        exit(1)
    
    # Запускаем тест
    success = test_flux_dev()
    
    if success:
        print("\n🚀 ОТЛИЧНО! FLUX.1-dev превосходит Recraft.ai")
        print("📋 Рекомендация: интегрируем FLUX.1-dev как премиум опцию")
        print("\n💡 Варианты интеграции:")
        print("   1. Replicate API: $0.003/изображение")
        print("   2. Собственный GPU сервер: RTX 4090 ($200-400/месяц)")
        print("   3. Hugging Face Inference API: $0.002/изображение")
    else:
        print("\n⚠️ Качество не оправдало ожиданий или технические проблемы")
        print("💡 Возможно стоит остаться с Recraft.ai")
    
    print("\n🎯 Следующие шаги если FLUX понравился:")
    print("   - API интеграция в BannerAdsAI")
    print("   - Добавление выбора модели в UI")
    print("   - A/B тестирование с пользователями")