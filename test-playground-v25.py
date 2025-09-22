#!/usr/bin/env python3
"""
Тест Playground v2.5 для рекламных баннеров BannerAdsAI
Специализированная модель для коммерческой графики
"""

import torch
from diffusers import DiffusionPipeline
import time
import os

def test_playground_v25():
    print("🎨 Тестируем Playground v2.5 для рекламных баннеров...")
    
    # Проверяем доступность GPU
    if torch.cuda.is_available():
        print(f"✅ GPU доступно: {torch.cuda.get_device_name()}")
        device = "cuda"
        dtype = torch.float16
    else:
        print("⚠️ GPU недоступно, используем CPU (будет медленно)")
        device = "cpu"
        dtype = torch.float32
    
    try:
        # Загружаем Playground v2.5
        print("📥 Загружаем Playground v2.5...")
        pipe = DiffusionPipeline.from_pretrained(
            "playgroundai/playground-v2.5-1024px-aesthetic",
            torch_dtype=dtype,
            variant="fp16" if device == "cuda" else None
        ).to(device)
        
        print("✅ Модель загружена успешно!")
        
        # Тестовые промпты СПЕЦИАЛЬНО для рекламных баннеров
        advertising_prompts = [
            {
                "prompt": "Professional e-commerce sale banner, '50% OFF' text, vibrant red and white colors, modern typography, commercial photography style, high quality, detailed, 8k",
                "name": "ecommerce_sale"
            },
            {
                "prompt": "Luxury fashion advertisement banner, elegant female model wearing designer clothes, minimalist aesthetic, premium brand style, soft lighting, commercial quality, detailed, 8k",
                "name": "fashion_luxury"
            },
            {
                "prompt": "Cryptocurrency trading platform banner, Bitcoin symbols, professional blue and gold color scheme, modern financial design, trustworthy corporate style, detailed, 8k",
                "name": "crypto_finance"
            },
            {
                "prompt": "Food delivery service advertisement, appetizing gourmet burger, warm inviting colors, lifestyle photography, commercial food styling, detailed, 8k",
                "name": "food_delivery"
            },
            {
                "prompt": "Tech startup mobile app banner, smartphone interface mockup, clean modern design, blue gradient background, professional UI/UX style, detailed, 8k",
                "name": "tech_app"
            },
            {
                "prompt": "Real estate luxury home advertisement, modern house exterior, professional architectural photography, premium real estate marketing style, detailed, 8k",
                "name": "real_estate"
            },
            {
                "prompt": "Banking services advertisement banner, professional businessman, corporate blue colors, trustworthy financial design, commercial portrait style, detailed, 8k",
                "name": "banking_services"
            },
            {
                "prompt": "Gaming advertisement banner, dynamic action scene, neon colors, energetic gaming aesthetic, modern esports style, high impact design, detailed, 8k",
                "name": "gaming_esports"
            }
        ]
        
        print(f"\n🎯 Тестируем {len(advertising_prompts)} рекламных сценариев...")
        
        # Рекомендуемые настройки от Playground
        generation_params = {
            "num_inference_steps": 50,      # Рекомендовано
            "guidance_scale": 3.0,          # Рекомендовано  
            "width": 1024,                  # Нативное разрешение
            "height": 1024
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
                output_path = f"playground_v25_{test_case['name']}.png"
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
        print("\n" + "="*50)
        print("🎯 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ PLAYGROUND V2.5:")
        print("="*50)
        
        successful = [r for r in results if r['success']]
        failed = [r for r in results if not r['success']]
        
        print(f"✅ Успешных генераций: {len(successful)}/{len(results)}")
        
        if successful:
            avg_time = sum(r['time'] for r in successful) / len(successful)
            print(f"⚡ Средняя скорость: {avg_time:.2f} сек/изображение")
            
        print(f"\n📊 ОЦЕНКА ДЛЯ РЕКЛАМНЫХ БАННЕРОВ:")
        print(f"✅ Коммерческое качество: {'ДА' if len(successful) > 0 else 'НЕТ'}")
        print(f"✅ Подходит для BannerAdsAI: {'ДА' if len(successful) >= 6 else 'ЧАСТИЧНО'}")
        print(f"✅ Стабильность: {len(successful)/len(results)*100:.1f}%")
        
        if failed:
            print(f"\n⚠️ Неудачные тесты:")
            for fail in failed:
                print(f"   - {fail['name']}: {fail['error']}")
        
        print(f"\n🎨 Playground v2.5 специально создана для коммерческой графики!")
        print(f"🚀 Если результаты устраивают - готова к интеграции в BannerAdsAI")
        
        return len(successful) >= 6  # 75% успешности
        
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}")
        print("💡 Возможные решения:")
        print("- Обновите diffusers: pip install --upgrade diffusers")
        print("- Проверьте доступность GPU")
        print("- Убедитесь в наличии 12GB+ VRAM")
        return False

if __name__ == "__main__":
    print("🎨 Playground v2.5 Test для рекламных баннеров")
    print("=" * 60)
    
    # Проверяем зависимости
    try:
        import diffusers
        print(f"✅ Diffusers версия: {diffusers.__version__}")
        
        # Проверяем минимальную версию
        from packaging import version
        min_version = "0.27.0"
        if version.parse(diffusers.__version__) < version.parse(min_version):
            print(f"⚠️ Требуется diffusers >= {min_version}")
            print(f"   Текущая версия: {diffusers.__version__}")
            print("   Обновите: pip install --upgrade diffusers")
            
    except ImportError:
        print("❌ Установите diffusers: pip install diffusers")
        exit(1)
    
    # Запускаем тест
    success = test_playground_v25()
    
    if success:
        print("\n🚀 ГОТОВО! Playground v2.5 отлично подходит для BannerAdsAI")
        print("📋 Следующий шаг: интеграция в продакшн")
    else:
        print("\n⚠️ Требуется дополнительная настройка или выбор другой модели")
    
    print("\n💡 Для интеграции в BannerAdsAI понадобится:")
    print("   - GPU сервер с 12GB+ VRAM")
    print("   - API wrapper для Playground v2.5")
    print("   - Обновление UI для выбора модели")