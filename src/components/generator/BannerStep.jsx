
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Download, Check, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateBannerFromHeadline, uploadFile as uploadFileMultiAgent } from "@/api/multi-agent-client";

// --- Утилиты для работы с цветом ---

// Извлекает доминирующий цвет из изображения
const getDominantColor = (img) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.naturalWidth; // Use naturalWidth/Height for the source image
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
  
  const imageData = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
  const data = imageData.data;
  let r = 0, g = 0, b = 0;
  let count = 0;

  // Sample pixels to get a dominant color, skipping fully transparent ones
  // Iterating with a dynamic step for performance on potentially large images
  const step = Math.max(1, Math.floor(data.length / (img.naturalWidth * img.naturalHeight / 100))); // Adjust step dynamically
  for (let i = 0; i < data.length; i += 4 * step) { 
    // data[i], data[i+1], data[i+2] are R, G, B values, data[i+3] is A (alpha)
    if(data[i+3] < 255) continue; // Check if not fully opaque, skip if not.
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  if (count === 0) { // Fallback if no opaque pixels found (e.g., fully transparent image or very few opaque pixels)
      return { r: 255, g: 255, b: 255 }; // Return white as a default
  }

  r = Math.floor(r / count);
  g = Math.floor(g / count);
  b = Math.floor(b / count);
  
  return { r, g, b };
};

// Конвертирует RGB в HSL
const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
};

// Создает РАЗНООБРАЗНЫЕ палитры для градиента
const generateGradientPalette = (dominantColor) => {
    const { h } = rgbToHsl(dominantColor.r, dominantColor.g, dominantColor.b);
    
    // Случайно выбираем одну из цветовых гармоний
    const harmonies = [
        // Комплементарная (противоположная)
        () => {
            const color1 = `hsl(${h}, 65%, 90%)`;
            const color2 = `hsl(${(h + 180) % 360}, 65%, 90%)`;
            return { color1, color2 };
        },
        // Триадная (120 градусов)
        () => {
            const color1 = `hsl(${h}, 70%, 88%)`;
            const color2 = `hsl(${(h + 120) % 360}, 70%, 88%)`;
            return { color1, color2 };
        },
        // Аналогичная (соседние цвета)
        () => {
            const color1 = `hsl(${(h + 30) % 360}, 60%, 92%)`;
            const color2 = `hsl(${(h - 30 + 360) % 360}, 60%, 92%)`;
            return { color1, color2 };
        },
        // Сплит-комплементарная
        () => {
            const color1 = `hsl(${h}, 55%, 90%)`;
            const color2 = `hsl(${(h + 150) % 360}, 55%, 90%)`;
            return { color1, color2 };
        },
        // Тетрадная (квадрат)
        () => {
            const color1 = `hsl(${h}, 60%, 89%)`;
            const color2 = `hsl(${(h + 90) % 360}, 60%, 89%)`;
            return { color1, color2 };
        }
    ];
    
    // Случайно выбираем одну из гармоний
    const randomHarmony = harmonies[Math.floor(Math.random() * harmonies.length)];
    return randomHarmony();
};

// --- Форматы градиентов ---
const backgroundStyles = [
  (ctx, w, h, c1, c2) => { // Диагональный
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
  },
  (ctx, w, h, c1, c2) => { // Горизонтальный
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
  },
  (ctx, w, h, c1, c2) => { // Вертикальный
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
  },
  (ctx, w, h, c1, c2) => { // Радиальный из центра
    const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w,h)/2);
    g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
  },
  (ctx, w, h, c1, c2) => { // Радиальный из угла
    const g = ctx.createRadialGradient(0, 0, 0, w, h, Math.max(w,h));
    g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
  },
];


export default function BannerStep({ config, setConfig }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [banners, setBanners] = useState(config.banner_urls || []);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const createBannerWithText = async (imageUrl, headline, size, template, composition, isUploaded = false) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const [width, height] = size.split('x').map(Number);
      canvas.width = width;
      canvas.height = height;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Фиксированная высота плашки 30px
        const textHeight = 30;
        const imageHeight = height - textHeight;
        
        if (isUploaded) {
            // КАЖДЫЙ РАЗ создаем новую палитру и новый стиль
            const dominantColor = getDominantColor(img);
            const { color1, color2 } = generateGradientPalette(dominantColor);
            const randomStyle = backgroundStyles[Math.floor(Math.random() * backgroundStyles.length)];
            
            ctx.fillStyle = randomStyle(ctx, width, imageHeight, color1, color2);
        } else {
            // Стандартный фон для AI-изображений
            ctx.fillStyle = '#f3f4f6'; // Light grey background
        }
        ctx.fillRect(0, 0, width, imageHeight);

        // --- Логика масштабирования и отрисовки изображения ---
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = width / imageHeight;
        let drawWidth, drawHeight, drawX, drawY;
        
        // Scale to fit while maintaining aspect ratio, cover the canvas area
        if (imgAspectRatio > canvasAspectRatio) {
          drawHeight = imageHeight;
          drawWidth = drawHeight * imgAspectRatio;
          drawX = (width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = width;
          drawHeight = drawWidth / imgAspectRatio;
          drawX = 0;
          drawY = (imageHeight - drawHeight) / 2; // Center vertically for tall images
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // --- Логика отрисовки плашки с текстом ---
        const [bgColor, gradientColor] = template === 'blue_white' 
            ? ['#1e40af', '#1d4ed8'] 
            : ['#dc2626', '#e11d48'];
        
        const gradient = ctx.createLinearGradient(0, imageHeight, 0, height);
        gradient.addColorStop(0, bgColor);
        gradient.addColorStop(1, gradientColor);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, imageHeight, width, textHeight);

        // Тень для лучшей читаемости
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(0, imageHeight, width, 2);

        // Настройки текста
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Алгоритм подбора оптимального размера шрифта под высоту плашки
        let fontSize = 18;
        const fontFace = '700 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const maxWidth = width - 10;
        let lines;

        while (fontSize > 8) {
            ctx.font = `${fontSize}px ${fontFace}`;
            lines = [];
            let currentLine = '';
            const words = headline.split(' ');
            
            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                if (ctx.measureText(testLine).width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            lines.push(currentLine);

            const lineHeight = fontSize * 1.1;
            const totalTextHeight = lines.length * lineHeight;
            
            if (totalTextHeight <= textHeight - 8) { 
                break; 
            }
            
            fontSize--;
        }

        const lineHeight = fontSize * 1.1;
        // Центрируем текст по вертикали
        const startY = imageHeight + (textHeight / 2) - ( (lines.length - 1) * lineHeight / 2 );

        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);
            // Без тени/обводки — только чистый текст
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line, width / 2, y);
        });

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/png');
      };

      img.onerror = () => {
        console.error("Error loading image for banner:", imageUrl);
        resolve(null); // Возвращаем null в случае ошибки загрузки изображения
      };

      img.src = imageUrl;
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверяем формат файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите файл изображения');
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await uploadFileMultiAgent(file);
      setUploadedImage(file_url);
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      alert('Не удалось загрузить изображение');
    }
    setIsUploading(false);
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
  };

  const lastRequestKeyRef = useRef(null);

  const generateBanners = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setBanners([]); // Очищаем старые баннеры перед генерацией новых
    try {
      console.log('Generating banners using multi-agent system...');
      
      const result = await generateBannerFromHeadline({
        selectedHeadline: config.selected_headline,
        size: config.size,
        template: config.template,
        uploadedImage: uploadedImage ? { url: uploadedImage } : null,
        webContent: config.webContent,
        url: config.url
      });
      
      // Compose final images with text overlay on canvas
      const generatedBanners = (await Promise.all(
        result.banners.map(async (banner) => {
          try {
            const composedUrl = await createBannerWithText(
              banner.imageUrl,
              banner.headline,
              `${banner.size.width}x${banner.size.height}`,
              banner.template,
              banner.composition,
              banner.isUploadedImage
            );
            return {
              id: banner.id,
              url: composedUrl || banner.imageUrl,
              headline: banner.headline,
              size: banner.size,
              template: banner.template,
              composition: banner.composition,
              isUploadedImage: banner.isUploadedImage
            };
          } catch (e) {
            console.error('Canvas compose failed, fallback to original image:', e);
            return {
              id: banner.id,
              url: banner.imageUrl,
              headline: banner.headline,
              size: banner.size,
              template: banner.template,
              composition: banner.composition,
              isUploadedImage: banner.isUploadedImage
            };
          }
        })
      )).filter(Boolean);
      
      setBanners(generatedBanners);
      setConfig({
        ...config,
        banner_urls: generatedBanners,
        taskId: result.taskId,
        images: result.images,
        status: 'completed'
      });
      
      console.log('Banners generated successfully:', generatedBanners.length);
      
    } catch (error) {
      console.error('Ошибка генерации баннеров:', error);
    }
    setIsGenerating(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.selected_headline, config.size, config.template, uploadedImage, config.webContent, config.url, isGenerating]);

  useEffect(() => {
    if (!config.selected_headline) return;
    const key = JSON.stringify([config.selected_headline, uploadedImage, config.size, config.template]);
    if (lastRequestKeyRef.current === key) return;
    lastRequestKeyRef.current = key;
    generateBanners();
  }, [uploadedImage, config.selected_headline, config.size, config.template, generateBanners]);

  const downloadBanner = (bannerUrl, index) => {
    // Force file download via Blob to avoid navigation and ensure immediate save
    fetch(bannerUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `banneradsai-${config.size}-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        // Fallback to direct link
        const link = document.createElement('a');
        link.href = bannerUrl;
        link.download = `banneradsai-${config.size}-${index + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
  };

  const downloadAllBanners = () => {
    banners.forEach((banner, index) => {
      setTimeout(() => downloadBanner(banner.url, index), index * 500);
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Шаг 5: Готовые баннеры */}
      <div className="step-header mb-6 flex items-center gap-4">
        <div className="step-check w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Готовые баннеры</h2>
          <p className="text-gray-600">Ваши персонализированные рекламные креативы готовы</p>
        </div>
      </div>

      <Card className="step-card surface-elevated rounded-2xl mb-8 border-0">
        <CardContent className="p-6">
          {/* Информация о баннере */}
          <div className="text-center mb-8 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Заголовок</p>
              <p className="font-semibold text-gray-900">{config.selected_headline}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Размер</p>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 font-semibold">{config.size}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Стиль</p>
                <Badge variant="secondary" className={`font-semibold ${config.template === 'blue_white' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                  {config.template === 'blue_white' ? 'Синий стиль' : 'Красный стиль'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Загрузка собственного изображения */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Использовать свое изображение</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Загрузите изображение с прозрачным фоном (PNG), чтобы использовать его как один из вариантов баннера
            </p>
            
            {uploadedImage ? (
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                <img 
                  src={uploadedImage} 
                  alt="Загруженное изображение" 
                  className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Изображение загружено</p>
                  <p className="text-sm text-gray-500">Будет использовано как первый вариант</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeUploadedImage}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
                {isUploading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                  </div>
                )}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-purple-500" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Создаем ваши баннеры</h3>
                <p className="text-gray-600">
                  {uploadedImage ? 'ИИ генерирует варианты и добавляет ваше изображение' : 'ИИ генерирует уникальные профессиональные дизайны'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="banners"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {banners.map((banner, index) => (
                    <Card 
                      key={index} 
                      className="border-2 border-gray-200 hover:border-purple-300 transition-all rounded-xl"
                    >
                      <CardContent className="p-4 flex flex-col h-full">
                        <img 
                          src={banner.url} 
                          alt={`Баннер ${index + 1}`}
                          className="w-full object-contain bg-gray-100 rounded-lg mb-4"
                          style={{ 
                            aspectRatio: config.size === '300x250' ? '300/250' : '336/280',
                            maxHeight: '200px'
                          }}
                        />
                        
                        {/* Заголовок и бейдж в отдельном контейнере */}
                        <div className="mb-3 min-h-[24px] flex items-start gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">Вариант {index + 1}</span>
                          {uploadedImage && index === 0 && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 whitespace-nowrap">
                              Ваше изображение
                            </Badge>
                          )}
                        </div>

                        {/* Кнопка всегда в одном месте */}
                        <div className="mt-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadBanner(banner.url, index)}
                            className="w-full"
                          >
                            Скачать PNG
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={generateBanners}
                    disabled={isGenerating}
                    className="flex-1 flex items-center gap-2 h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Создать новые варианты
                  </Button>
                  
                  <Button
                    onClick={downloadAllBanners}
                    className="flex-1 brand-gradient hover:shadow-xl h-12 px-8 rounded-xl font-semibold smooth-transition"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Скачать все баннеры
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
