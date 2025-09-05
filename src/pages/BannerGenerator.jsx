
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Globe, Monitor, Palette, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Badge import removed - not used in this component

import HeadlineStep from "../components/generator/HeadlineStep";
import BannerStep from "../components/generator/BannerStep";

export default function BannerGenerator({ sessionId, initialConfig, onConfigChange }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [savedInitialConfig, setSavedInitialConfig] = useState(initialConfig);
  const [config, setConfig] = useState({
    url: '',
    size: '300x250',
    template: 'blue_white',
    font: 'roboto',
    imageModel: 'recraftv3',
    selected_headline: '',
    generated_headlines: [],
    banner_urls: [],
    status: 'configuring'
  });

  // Load initial config from history if provided
  useEffect(() => {
    if (initialConfig) {
      console.log('[BannerGenerator] Loading initial config:', initialConfig);
      
      setConfig(prevConfig => ({
        ...prevConfig,
        ...initialConfig
      }));
      
      // If we have a selected headline, skip to headline step
      if (initialConfig.selected_headline) {
        setCurrentStep(4);
      } else if (initialConfig.url) {
        setCurrentStep(2); // Skip to size selection
      }
      
      // Notify parent that config is being used
      if (onConfigChange) {
        onConfigChange(initialConfig);
      }
    }
  }, [initialConfig, onConfigChange]);

  const handleContinue = () => {
    if (currentStep === 1 && config.url) {
      setCurrentStep(2);
    } else if (currentStep === 2 && config.size) {
      setCurrentStep(3);
    } else if (currentStep === 3 && config.template) {
      setCurrentStep(4);
    }
  };


  const handleSizeSelect = (size) => {
    setConfig({ ...config, size });
  };

  const handleTemplateSelect = (template) => {
    setConfig({ ...config, template });
    // Не переходим автоматически к следующему этапу
    // setCurrentStep(4);
  };

  if (currentStep >= 4) {
    return (
      <div className="max-w-4xl mx-auto px-6">
        {currentStep === 4 && (
          <HeadlineStep 
            config={config} 
            setConfig={setConfig}
            sessionId={sessionId}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 5 && (
          <BannerStep 
            config={config} 
            setConfig={setConfig}
            sessionId={sessionId}
            initialConfig={savedInitialConfig}
            onBack={() => setCurrentStep(4)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Главный заголовок */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Генератор рекламных баннеров
        </h1>
        <p className="text-xl text-gray-600">
          Создайте профессиональные баннеры с помощью искусственного интеллекта за несколько минут
        </p>
      </div>

      {/* Шаг 1: URL */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="step-header">
          {currentStep > 1 ? (
            <div className="step-check">
              <Check className="w-4 h-4" />
            </div>
          ) : (
            <div className="step-number">1</div>
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-900">Введите URL посадочной страницы</h2>
            <p className="text-gray-600">Укажите ссылку на страницу, для которой создаем баннер</p>
          </div>
        </div>

        <Card className="step-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-900">URL посадочной страницы</span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Введите полный URL (например: https://example.com)
            </p>
            <Input
              type="url"
              placeholder="https://example.com"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              className="h-12 text-base mb-6"
            />
            <Button
              onClick={handleContinue}
              disabled={!config.url}
              className="w-full h-12 gradient-button rounded-xl text-base font-semibold"
            >
              Продолжить
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Шаг 2: Размер баннера */}
      {currentStep >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="step-header">
            {currentStep > 2 ? (
              <div className="step-check">
                <Check className="w-4 h-4" />
              </div>
            ) : (
              <div className="step-number">2</div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">Выберите размер баннера</h2>
              <p className="text-gray-600">Определите формат будущего рекламного баннера</p>
            </div>
          </div>

          <Card className="step-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Monitor className="w-5 h-5 text-purple-500" />
                <span className="font-semibold text-gray-900">Размер баннера</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => handleSizeSelect('300x250')}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    config.size === '300x250'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-16 h-12 bg-purple-200 rounded-lg mx-auto mb-4"></div>
                  <div className="font-semibold text-gray-900 mb-1">300×250 (Medium Rectangle)</div>
                  <div className="text-sm text-gray-500">Средний прямоугольник</div>
                </button>

                <button
                  onClick={() => handleSizeSelect('336x280')}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    config.size === '336x280'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-16 h-14 bg-purple-200 rounded-lg mx-auto mb-4"></div>
                  <div className="font-semibold text-gray-900 mb-1">336×280 (Large Rectangle)</div>
                  <div className="text-sm text-gray-500">Большой прямоугольник</div>
                </button>
              </div>

              <Button
                onClick={handleContinue}
                disabled={!config.size}
                className="w-full h-12 gradient-button rounded-xl text-base font-semibold"
              >
                Продолжить
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Шаг 3: Шаблон оформления */}
      {currentStep >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="step-header">
            <div className="step-number">3</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Выберите шаблон оформления</h2>
              <p className="text-gray-600">Определите цветовую схему для вашего баннера</p>
            </div>
          </div>

          <Card className="step-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-5 h-5 text-pink-500" />
                <span className="font-semibold text-gray-900">Цветовая схема</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => handleTemplateSelect('blue_white')}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    config.template === 'blue_white'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-12 bg-blue-600 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Пример</span>
                  </div>
                  <div className="font-semibold text-gray-900">Синий фон + белый текст</div>
                  <div className="text-sm text-gray-500">Деловой стиль</div>
                </button>

                <button
                  onClick={() => handleTemplateSelect('red_white')}
                  className={`p-6 rounded-xl border-2 text-center transition-all ${
                    config.template === 'red_white'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-full h-12 bg-red-600 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Пример</span>
                  </div>
                  <div className="font-semibold text-gray-900">Красный фон + белый текст</div>
                  <div className="text-sm text-gray-500">Энергичный стиль</div>
                </button>
              </div>

              <Button
                onClick={handleContinue}
                disabled={!config.template}
                className="w-full h-12 gradient-button rounded-xl text-base font-semibold"
              >
                Сгенерировать заголовки
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Предпросмотр следующих шагов - показываем только то, что еще не доступно */}
      <div className="space-y-6 opacity-50">
        {currentStep < 2 && (
          <div className="step-header">
            <div className="step-number">2</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Выберите размер баннера</h2>
              <p className="text-gray-600">Определите формат будущего рекламного баннера</p>
            </div>
          </div>
        )}

        {currentStep < 3 && (
          <div className="step-header">
            <div className="step-number">3</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Выберите шаблон оформления</h2>
              <p className="text-gray-600">Определите цветовую схему для вашего баннера</p>
            </div>
          </div>
        )}

        {currentStep < 4 && (
          <div className="step-header">
            <div className="step-number">4</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Выберите заголовок и изображение</h2>
              <p className="text-gray-600">Определите самый привлекательный вариант для вашего баннера</p>
            </div>
          </div>
        )}

        {currentStep < 5 && (
          <div className="step-header">
            <div className="step-number">5</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Готовые баннеры</h2>
              <p className="text-gray-600">Ваши персонализированные рекламные креативы готовы</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
