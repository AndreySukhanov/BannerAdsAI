import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Globe, Palette, Type, ArrowRight, ArrowLeft, Sparkles, Eye, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3014';

export default function BrandStyleStep({ config, setConfig, onNext, onBack }) {
  const [websiteUrl, setWebsiteUrl] = useState(config.brandingData?.url || config.url || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [brandingData, setBrandingData] = useState(config.brandingData || null);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Auto-populate URL from previous step if not already set
  useEffect(() => {
    if (!websiteUrl && config.url) {
      setWebsiteUrl(config.url);
    }
  }, [config.url, websiteUrl]);

  // Функция анализа сайта
  const analyzeBrandStyle = async () => {
    if (!websiteUrl.trim()) {
      setError('Введите URL сайта');
      return;
    }

    try {
      // Простая валидация URL
      const url = new URL(websiteUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('URL должен начинаться с http:// или https://');
      }
    } catch {
      setError('Некорректный URL. Используйте формат: https://example.com');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      console.log('🔍 Анализируем брендинг сайта:', websiteUrl);
      
      const response = await fetch(`${API_BASE_URL}/api/brand-parser/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: websiteUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка анализа сайта');
      }

      if (result.success) {
        setBrandingData(result.data);
        
        // Сохраняем данные брендинга в конфигурацию
        setConfig(prev => ({
          ...prev,
          brandingData: result.data,
          useBrandStyle: true
        }));

        console.log('✅ Брендинг успешно извлечен:', result.data);
      } else {
        throw new Error(result.error || 'Неизвестная ошибка');
      }

    } catch (error) {
      console.error('❌ Ошибка анализа брендинга:', error);
      setError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Переключение использования брендинга
  const toggleBrandStyle = () => {
    setConfig(prev => ({
      ...prev,
      useBrandStyle: !prev.useBrandStyle
    }));
  };

  // Пропустить шаг брендинга
  const skipBrandStep = () => {
    setConfig(prev => ({
      ...prev,
      useBrandStyle: false,
      brandingData: null
    }));
    onNext();
  };

  // Очистка данных брендинга
  const clearBrandStyle = () => {
    setBrandingData(null);
    setWebsiteUrl('');
    setConfig(prev => ({
      ...prev,
      brandingData: null,
      useBrandStyle: false
    }));
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок шага */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-2"
        >
          <Palette className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold">Фирменный стиль (опционально)</h2>
        </motion.div>
        <p className="text-gray-600">
          Анализируем ваш сайт для создания баннеров в фирменном стиле с правильными цветами и шрифтами
        </p>
      </div>

      {/* Ввод URL и анализ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Анализ сайта
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website-url">URL сайта</Label>
            <div className="flex gap-2">
              <Input
                id="website-url"
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setError('');
                }}
                disabled={isAnalyzing}
                className={error ? 'border-red-500' : ''}
              />
              <Button 
                onClick={analyzeBrandStyle}
                disabled={isAnalyzing || !websiteUrl.trim()}
                className="shrink-0"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Анализировать
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Предварительный просмотр URL */}
          {websiteUrl && isValidUrl(websiteUrl) && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Предварительный просмотр:</p>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">{websiteUrl}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Результаты анализа */}
      <AnimatePresence>
        {brandingData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Target className="w-5 h-5" />
                    Брендинг извлечен успешно
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {showPreview ? 'Скрыть' : 'Показать'} детали
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Основная информация */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-green-800">Название сайта</Label>
                    <p className="text-sm mt-1">{brandingData.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-800">Отрасль</Label>
                    <Badge variant="secondary" className="mt-1">
                      {brandingData.industry}
                    </Badge>
                  </div>
                </div>

                {/* Детальный просмотр */}
                <AnimatePresence>
                  {showPreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 pt-4 border-t border-green-200"
                    >
                      {/* Цветовая палитра */}
                      {brandingData.colors && brandingData.colors.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-green-800 flex items-center gap-2">
                            <Palette className="w-4 h-4" />
                            Цветовая палитра
                          </Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {brandingData.colors.slice(0, 8).map((color, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div 
                                  className="w-6 h-6 rounded border border-gray-300"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                                <span className="text-xs text-gray-600">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Шрифты */}
                      {brandingData.fonts && brandingData.fonts.length > 0 && (
                        <div>
                          <Label className="text-sm font-medium text-green-800 flex items-center gap-2">
                            <Type className="w-4 h-4" />
                            Шрифты
                          </Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {brandingData.fonts.map((font, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {font}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Описание */}
                      {brandingData.description && (
                        <div>
                          <Label className="text-sm font-medium text-green-800">Описание</Label>
                          <p className="text-sm mt-1 text-gray-700">
                            {brandingData.description.length > 200 
                              ? `${brandingData.description.substring(0, 200)}...`
                              : brandingData.description
                            }
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Переключатель использования */}
                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <div>
                    <Label className="text-sm font-medium text-green-800">
                      Использовать фирменный стиль
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Баннеры будут созданы в стиле вашего сайта
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={config.useBrandStyle ? "default" : "outline"}
                      size="sm"
                      onClick={toggleBrandStyle}
                    >
                      {config.useBrandStyle ? 'Включено' : 'Выключено'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearBrandStyle}
                    >
                      Очистить
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Информационная карточка */}
      {!brandingData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                🎨 Умное брендирование для ваших баннеров
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Наша AI анализирует ваш сайт и автоматически создаёт баннеры в фирменном стиле. 
                Этот шаг не обязателен — можете пропустить, если не нужен брендинг.
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs text-blue-600 mb-4">
                <div>
                  <div className="font-medium mb-1">Что анализируем:</div>
                  <ul className="space-y-1">
                    <li>• Цветовую палитру</li>
                    <li>• Шрифты и типографику</li>
                  </ul>
                </div>
                <div>
                  <div className="font-medium mb-1">Что получаете:</div>
                  <ul className="space-y-1">
                    <li>• Баннеры в вашем стиле</li>
                    <li>• Согласованные промпты</li>
                  </ul>
                </div>
              </div>
              <div className="text-xs text-blue-500 italic">
                ⏱️ Анализ займёт 2-3 секунды
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Навигация */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={skipBrandStep}
            className="flex items-center gap-2 text-gray-600"
          >
            Пропустить этап
          </Button>
          
          <Button
            onClick={onNext}
            className="flex items-center gap-2"
          >
            Продолжить
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}