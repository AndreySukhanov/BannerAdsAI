import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Globe, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3014';

export default function BrandPreviewStep({ config, setConfig, onNext, onBack }) {
  const [brandData, setBrandData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (config.brandUrl) {
      analyzeBrand();
    }
  }, [config.brandUrl]);

  const analyzeBrand = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/brand-parser/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: config.brandUrl })
      });

      if (!response.ok) {
        throw new Error('Не удалось проанализировать бренд');
      }

      const responseData = await response.json();
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Ошибка анализа бренда');
      }
      
      setBrandData(responseData.data);
      
      // Save branding data to config for later use
      setConfig(prev => ({
        ...prev,
        brandingData: responseData.data,
        useBrandStyle: true
      }));
      
    } catch (err) {
      console.error('Brand analysis error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ColorPreview = ({ colors }) => {
    if (!colors || colors.length === 0) return null;
    
    return (
      <div className="flex gap-2">
        {colors.slice(0, 5).map((color, index) => (
          <div
            key={index}
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Предпросмотр брендированного стиля
        </h1>
        <p className="text-lg text-gray-600">
          Анализируем фирменный стиль сайта для создания брендированных баннеров
        </p>
      </div>

      {/* Step Header */}
      <div className="step-header mb-6">
        <div className="step-number">4</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Анализ бренда</h2>
          <p className="text-gray-600">Изучаем дизайн и цветовую схему вашего сайта</p>
        </div>
      </div>

      <Card className="step-card">
        <CardContent className="p-8">
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Анализируем бренд...
              </h3>
              <p className="text-gray-600">
                Извлекаем цвета, стили и фирменные элементы с сайта
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <Eye className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ошибка анализа
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={analyzeBrand}
                variant="outline"
                className="mx-auto"
              >
                Попробовать снова
              </Button>
            </div>
          )}

          {brandData && !loading && (
            <div className="space-y-6">
              {/* Brand Info */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Информация о бренде
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Название</p>
                    <p className="font-semibold text-gray-900">{brandData.title}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Индустрия</p>
                    <p className="font-semibold text-gray-900">{brandData.industry}</p>
                  </div>
                  
                  {brandData.description && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1">Описание</p>
                      <p className="text-gray-900">{brandData.description.substring(0, 150)}...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Color Palette */}
              {brandData.colors && brandData.colors.length > 0 && (
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Цветовая палитра
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {brandData.colors.slice(0, 8).map((color, index) => (
                      <div key={index} className="text-center">
                        <div
                          className="w-16 h-16 rounded-lg border border-gray-300 mb-2"
                          style={{ backgroundColor: color }}
                        />
                        <p className="text-xs text-gray-600 font-mono">{color}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Banner Style */}
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Предпросмотр стиля баннера
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className="aspect-[5/3] rounded-lg p-4 flex items-center justify-center text-white font-semibold text-sm"
                    style={{ 
                      background: brandData.colors && brandData.colors[0] 
                        ? `linear-gradient(135deg, ${brandData.colors[0]}, ${brandData.colors[1] || brandData.colors[0]})`
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    }}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold mb-1">Ваш заголовок</div>
                      <div className="text-sm opacity-90">{brandData.title}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Основной цвет</p>
                      <div className="flex items-center gap-2">
                        <ColorPreview colors={[brandData.colors?.[0]]} />
                        <span className="text-sm font-mono">{brandData.colors?.[0]}</span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Размер баннера</p>
                      <p className="font-semibold">{config.size}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Стиль</p>
                      <p className="font-semibold">Брендированный</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">Анализ завершен!</span>
                </div>
                <p className="text-green-700 mt-1">
                  Мы проанализировали ваш сайт и готовы создать 3 брендированных баннера в фирменном стиле.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
            
            <Button
              onClick={onNext}
              disabled={!brandData || loading}
              className="flex items-center gap-2 gradient-button"
            >
              Создать брендированные баннеры
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}