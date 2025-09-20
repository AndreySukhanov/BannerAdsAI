
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, Download, Check, Upload, X, Target, ArrowLeft, ZoomIn, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { generateBannerFromHeadline, uploadFile as uploadFileMultiAgent, regenerateImages } from "@/api/multi-agent-client";
import { saveDownloadedBanner } from "@/api/history-client";
import { ratingAPI } from "@/api/rating-client";
import { Label } from "@/components/ui/label";
import RatingModal from "@/components/ui/RatingModal";

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


export default function BannerStep({ config, setConfig, sessionId, initialConfig, onBack, isBrandedTemplate = false }) {
  console.log('[BannerStep] Component initialized with initialConfig:', initialConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [banners, setBanners] = useState(() => {
    // Если есть оригинальные баннеры из редактирования, используем их
    if (initialConfig && initialConfig.originalBanners && initialConfig.originalBanners.length > 0) {
      console.log('[BannerStep] Loading original banners for editing:', initialConfig.originalBanners);
      console.log('[BannerStep] InitialConfig:', initialConfig);
      const originalBannersList = initialConfig.originalBanners.map(banner => {
        console.log('[BannerStep] Processing banner:', banner);
        return {
          url: banner.imageUrl || banner.url,
          isOriginal: true
        };
      });
      console.log('[BannerStep] Mapped original banners:', originalBannersList);
      return originalBannersList;
    }
    // Иначе используем обычные баннеры из конфига
    console.log('[BannerStep] No original banners, using config.banner_urls:', config.banner_urls);
    return config.banner_urls || [];
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegeneratingImages, setIsRegeneratingImages] = useState(false);
  const [showImageFeedback, setShowImageFeedback] = useState(false);
  const [imageFeedback, setImageFeedback] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRatingBanner, setCurrentRatingBanner] = useState(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  // Состояние для зума баннеров
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomedBanner, setZoomedBanner] = useState(null);

  // Функция для создания брендированных баннеров без плашки
  const createBrandedBanner = async (imageUrl, headline, size, brandingData, bannerIndex = 0) => {
    // Fallback branding data для шаблона Bild.de если brandingData отсутствует
    const defaultBrandingData = {
      title: "Bild.de",
      industry: "Медиа",
      colors: ["#dc2626", "#ffffff", "#000000"], // Красный, белый, черный
      fonts: ["Arial", "Helvetica"],
      designElements: {
        textStyles: {
          fontWeight: "bold",
          textTransform: "none"
        }
      }
    };

    const finalBrandingData = brandingData || defaultBrandingData;
    console.log('[createBrandedBanner] Using branding data:', finalBrandingData);
    console.log('[createBrandedBanner] Headline:', headline);
    console.log('[createBrandedBanner] Size:', size);

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const [width, height] = size.split('x').map(Number);
      canvas.width = width;
      canvas.height = height;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Отрисовываем изображение на весь canvas
        const imgAspectRatio = img.width / img.height;
        const canvasAspectRatio = width / height;
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspectRatio > canvasAspectRatio) {
          drawHeight = height;
          drawWidth = drawHeight * imgAspectRatio;
          drawX = (width - drawWidth) / 2;
          drawY = 0;
        } else {
          drawWidth = width;
          drawHeight = drawWidth / imgAspectRatio;
          drawX = 0;
          drawY = (height - drawHeight) / 2;
        }
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // Настройки текста в фирменном стиле - БЕЗ ПЛАШКИ
        let primaryColor = finalBrandingData?.colors?.[0] || '#ffffff';
        const secondaryColor = finalBrandingData?.colors?.[1] || primaryColor;
        const brandFont = finalBrandingData?.fonts?.[0] || 'Arial';
        const designElements = finalBrandingData?.designElements || {};
        
        // Проверяем, что цвет в правильном формате
        if (primaryColor && !primaryColor.startsWith('#')) {
          primaryColor = '#' + primaryColor;
        }
        
        // Если цвет слишком светлый для читаемости, используем темный
        if (primaryColor === '#ffffff' || primaryColor === '#fff') {
          primaryColor = '#333333';
        }
        
        // Выбор варианта: используем selectedVariant если задан, иначе детерминированный выбор
        const variant = config.selectedVariant || ((bannerIndex % 3) + 1);

        console.log(`Применяем Bild.de шаблон: Вариант ${variant} ${
          variant === 1 ? '(полная подложка)' :
          variant === 2 ? '(структурированный)' :
          '(текст на изображении)'
        }`);

        // Функция анализа яркости области изображения
        const analyzeImageBrightness = (x, y, width, height) => {
          const imageData = ctx.getImageData(x, y, width, height);
          const data = imageData.data;
          let totalBrightness = 0;
          let pixelCount = 0;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
            totalBrightness += brightness;
            pixelCount++;
          }
          
          return totalBrightness / pixelCount; // 0-255
        };
        
        // Два варианта шаблонов Bild.de
        const bildTemplates = {
          // Вариант 1: Полная красная подложка (текущий)
          variant1: {
            backgroundColor: 'rgba(220, 20, 20, 0.95)',
            textColor: '#ffffff',
            font: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: 'bold',
            textTransform: 'none',
            borderRadius: '0px',
            padding: 12
          },
          // Вариант 2: Структурированный (как в референсе) - белая плашка
          variant2: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)', // Белая фиксированная плашка
            kickerBg: 'rgba(220, 20, 20, 0.95)', // Красная подложка только для киккера
            kickerTextColor: '#ffffff',
            mainTextColor: '#000000', // Черный текст для заголовка
            subTextColor: '#333333',  // Серый для подзаголовка
            font: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: 'bold',
            textTransform: 'none',
            padding: 16,
            borderRadius: '4px'
          }
        };
        
        const bildTemplate = variant === 2 ? bildTemplates.variant2 : bildTemplates.variant1;
        
        // Настройки фирменного шрифта
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // Применяем стили дизайна из сайта
        const fontWeight = designElements.textStyles?.fontWeight || 'bold';
        const textTransform = designElements.textStyles?.textTransform || 'none';
        const letterSpacing = designElements.textStyles?.letterSpacing || 'normal';
        
        // Подбираем размер шрифта для баннера
        let fontSize = Math.min(width * 0.08, 32);
        const maxWidth = width * 0.8; // Уменьшаем максимальную ширину для гарантии
        const padding = width * 0.05;
        let lines;

        // Применяем настройки Bild.de шаблона
        const fontFamily = bildTemplate.font;
        const templateFontWeight = bildTemplate.fontWeight;

        // Применяем трансформацию текста - приоритет у branded шаблона
        let processedHeadline = headline;

        // Для branded шаблона всегда сохраняем оригинальный регистр
        if (config.template === 'branded') {
          processedHeadline = headline;
        } else if (bildTemplate.textTransform === 'uppercase') {
          processedHeadline = headline.toUpperCase();
        } else if (bildTemplate.textTransform === 'none') {
          // Для Bild.de шаблона сохраняем оригинальный регистр
          processedHeadline = headline;
        } else {
          // Если в шаблоне не указано, используем настройки из сайта
          if (textTransform === 'uppercase') {
            processedHeadline = headline.toUpperCase();
          } else if (textTransform === 'lowercase') {
            processedHeadline = headline.toLowerCase();
          }
        }

        console.log('Bild.de шрифт:', fontFamily, 'вес:', templateFontWeight);

        while (fontSize > 12) {
          ctx.font = `${templateFontWeight} ${fontSize}px ${fontFamily}`;
          lines = [];
          let currentLine = '';
          const words = processedHeadline.split(' ');

          // Для варианта 2 используем более строгие ограничения ширины
          const effectiveMaxWidth = variant === 2 ? maxWidth * 0.85 :
                                   variant === 3 ? maxWidth * 0.9 : maxWidth;

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = ctx.measureText(testLine).width;

            // Более строгая проверка ширины с учетом отступов
            if (testWidth > effectiveMaxWidth && currentLine) {
              // Проверяем, можем ли мы добавить следующее слово для лучшего распределения (только для варианта 2)
              if (variant === 2 && i < words.length - 1) {
                const nextWord = words[i + 1];
                const testWithNext = `${currentLine} ${word} ${nextWord}`;
                const widthWithNext = ctx.measureText(testWithNext).width;

                // Если добавление следующего слова не превышает лимит значительно, добавляем оба
                if (widthWithNext <= effectiveMaxWidth * 1.05) {
                  currentLine = testWithNext;
                  i++; // Пропускаем следующее слово
                  continue;
                }
              }

              lines.push(currentLine);
              currentLine = word;
              // Проверяем, что одно слово не превышает максимальную ширину (только для вариантов 2 и 3)
              if (variant !== 1 && ctx.measureText(word).width > effectiveMaxWidth) {
                // Если слово слишком длинное, принудительно уменьшаем шрифт
                fontSize = fontSize * 0.9;
                ctx.font = `${templateFontWeight} ${fontSize}px ${fontFamily}`;
                break;
              }
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) {
            lines.push(currentLine);
          }

          const lineHeight = fontSize * 1.2;
          const totalTextHeight = lines.length * lineHeight;

          if (totalTextHeight <= height * 0.35 && lines.length <= 4) {
            break;
          }
          fontSize--;
        }

        const lineHeight = fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;
        const startY = height - totalTextHeight - padding;
        
        // Анализируем яркость в области текста
        const textAreaBrightness = analyzeImageBrightness(
          padding, 
          startY - padding/2, 
          width - padding*2, 
          totalTextHeight + padding
        );
        
        console.log('Анализ яркости области текста:', textAreaBrightness);
        
        // Для брендированного шаблона всегда используем подложку Bild.de
        const needsBackground = true;
        
        if (variant === 2) {
          // Вариант 2: Белая плашка с фиксированным размером и структурированным текстом
          
          // Определяем размеры белой плашки - до самого низа баннера
          const plashkaWidth = width;
          const plashkaY = startY - bildTemplate.padding;
          const plashkaHeight = height - plashkaY;
          const plashkaX = 0;

          // Рисуем белую плашку с закругленными углами
          ctx.fillStyle = bildTemplate.backgroundColor;
          ctx.beginPath();
          ctx.roundRect(plashkaX, plashkaY, plashkaWidth, plashkaHeight, parseInt(bildTemplate.borderRadius));
          ctx.fill();

          // Теперь размещаем текст на белой плашке
          const textStartX = plashkaX + bildTemplate.padding;
          const textStartY = plashkaY + bildTemplate.padding;

          lines.forEach((line, index) => {
            const y = textStartY + (index * lineHeight);

            if (index === 0) {
              // Первая строка - киккер с красной подложкой
              ctx.font = `${templateFontWeight} ${fontSize * 0.8}px ${fontFamily}`;
              const lineWidth = ctx.measureText(line).width;

              // Проверяем, что киккер помещается в плашку
              const maxKickerWidth = plashkaWidth - bildTemplate.padding * 2;
              const kickerPadding = 4;
              const kickerX = textStartX;
              const kickerY = y - 2;
              const kickerWidth = Math.min(lineWidth + kickerPadding * 2, maxKickerWidth);
              const kickerHeight = fontSize * 0.8 + 4;

              ctx.fillStyle = bildTemplate.kickerBg;
              ctx.fillRect(kickerX - kickerPadding, kickerY, kickerWidth, kickerHeight);

              ctx.fillStyle = bildTemplate.kickerTextColor;
              ctx.fillText(line, kickerX, y);
            } else if (index === 1) {
              // Вторая строка - основной заголовок (черный, крупный)
              ctx.fillStyle = bildTemplate.mainTextColor;
              ctx.font = `900 ${fontSize * 1.1}px ${fontFamily}`;

              // Проверяем ширину основного заголовка
              const mainLineWidth = ctx.measureText(line).width;
              const maxMainWidth = plashkaWidth - bildTemplate.padding * 2;
              if (mainLineWidth > maxMainWidth) {
                // Уменьшаем размер шрифта если не помещается
                const scaleFactor = maxMainWidth / mainLineWidth;
                ctx.font = `900 ${fontSize * 1.1 * scaleFactor}px ${fontFamily}`;
              }

              ctx.fillText(line, textStartX, y);
            } else {
              // Остальные строки - подзаголовок (серый, мельче)
              ctx.fillStyle = bildTemplate.subTextColor;
              ctx.font = `400 ${fontSize * 0.9}px ${fontFamily}`;

              // Проверяем ширину подзаголовка
              const subLineWidth = ctx.measureText(line).width;
              const maxSubWidth = plashkaWidth - bildTemplate.padding * 2;
              if (subLineWidth > maxSubWidth) {
                // Уменьшаем размер шрифта если не помещается
                const scaleFactor = maxSubWidth / subLineWidth;
                ctx.font = `400 ${fontSize * 0.9 * scaleFactor}px ${fontFamily}`;
              }

              ctx.fillText(line, textStartX, y);
            }
          });
        } else if (variant === 1) {
          // Вариант 1: Все строки с красной подложкой (текущий)
          lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);

            // Измеряем ширину конкретной строки
            ctx.font = `${templateFontWeight} ${fontSize}px ${fontFamily}`;
            const lineWidth = ctx.measureText(line).width;

            // Создаем компактную подложку в стиле Bild.de
            const linePadding = 6;
            const bgX = padding - linePadding;
            const bgY = y - 3;
            const bgWidth = lineWidth + linePadding * 2;
            const bgHeight = fontSize + 6;

            // Характерная красная подложка Bild.de
            ctx.fillStyle = bildTemplate.backgroundColor;
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

            // Белый жирный текст на красной подложке
            ctx.fillStyle = bildTemplate.textColor;
            ctx.fillText(line, padding, y);
          });
        } else {
          // Вариант 3: Текст прямо на изображении (как в bild2.png) - выровнен по центру
          lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);

            if (index === 0) {
              // Первая строка - киккер с красной подложкой по центру
              ctx.font = `${templateFontWeight} ${fontSize * 0.8}px ${fontFamily}`;
              const lineWidth = ctx.measureText(line).width;

              const kickerPadding = 4;
              const kickerX = (width - lineWidth) / 2; // Центрируем киккер
              const kickerY = y - 2;
              const kickerWidth = lineWidth + kickerPadding * 2;
              const kickerHeight = fontSize * 0.8 + 4;

              ctx.fillStyle = bildTemplate.backgroundColor;
              ctx.fillRect(kickerX - kickerPadding, kickerY, kickerWidth, kickerHeight);

              ctx.fillStyle = '#ffffff';
              ctx.fillText(line, kickerX, y);
            } else {
              // Остальные строки - белый текст с тенью для эффекта тиснения, выровненный по центру
              const largeFontSize = fontSize * 1.15;
              ctx.font = `900 ${largeFontSize}px ${fontFamily}`;

              // Проверяем ширину строки и масштабируем шрифт если нужно
              let lineWidth = ctx.measureText(line).width;
              let actualFontSize = largeFontSize;

              // Если строка слишком широкая, уменьшаем шрифт
              const maxLineWidth = width * 0.9;
              if (lineWidth > maxLineWidth) {
                const scaleFactor = maxLineWidth / lineWidth;
                actualFontSize = largeFontSize * scaleFactor;
                ctx.font = `900 ${actualFontSize}px ${fontFamily}`;
                lineWidth = ctx.measureText(line).width;
              }

              // Вычисляем позицию для центрирования
              const centeredX = (width - lineWidth) / 2;

              // Создаем эффект тиснения с помощью тени
              const shadowOffset = Math.max(1, actualFontSize * 0.02);

              // Темная тень снизу-справа для объема
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
              ctx.fillText(line, centeredX + shadowOffset, y + shadowOffset);

              // Светлая тень сверху-слева для подсветки
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fillText(line, centeredX - shadowOffset/2, y - shadowOffset/2);

              // Основной белый текст
              ctx.fillStyle = '#ffffff';
              ctx.fillText(line, centeredX, y);
            }
          });
        }

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/png');
      };

      img.onerror = () => {
        // Fallback для брендированного баннера
        resolve(imageUrl);
      };

      img.src = imageUrl;
    });
  };

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
                const testWidth = ctx.measureText(testLine).width;

                // Более строгая проверка ширины с запасом
                if (testWidth > maxWidth * 0.95 && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) {
                lines.push(currentLine);
            }

            const lineHeight = fontSize * 1.1;
            const totalTextHeight = lines.length * lineHeight;
            const maxLines = 3; // Ограничиваем количество строк для плашки

            if (totalTextHeight <= textHeight - 8 && lines.length <= maxLines) {
                break;
            }

            fontSize--;
        }

        const lineHeight = fontSize * 1.1;
        // Центрируем текст по вертикали
        const startY = imageHeight + (textHeight / 2) - ( (lines.length - 1) * lineHeight / 2 );

        lines.forEach((line, index) => {
            const y = startY + (index * lineHeight);

            // Проверяем, что текст не выходит за границы плашки
            if (y > imageHeight && y + fontSize <= height) {
                // Без тени/обводки — только чистый текст
                ctx.fillStyle = '#ffffff';
                ctx.fillText(line, width / 2, y);
            }
        });

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          resolve(url);
        }, 'image/png');
      };

      img.onerror = (error) => {
        console.error("Error loading image for banner:", imageUrl, error);
        
        // Создаем fallback изображение с градиентом
        const fallbackCanvas = document.createElement('canvas');
        const fallbackCtx = fallbackCanvas.getContext('2d');
        const [width, height] = size.split('x').map(Number);
        
        fallbackCanvas.width = width;
        fallbackCanvas.height = height;
        
        // Создаем простой градиент
        const gradient = fallbackCtx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#6b7280'); // gray-500
        gradient.addColorStop(1, '#374151'); // gray-700
        
        fallbackCtx.fillStyle = gradient;
        fallbackCtx.fillRect(0, 0, width, height);
        
        // Добавляем текст об ошибке
        fallbackCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        fallbackCtx.font = 'bold 16px Arial';
        fallbackCtx.textAlign = 'center';
        fallbackCtx.fillText('Изображение недоступно', width / 2, height / 2);
        
        fallbackCanvas.toBlob((blob) => {
          if (blob) {
            const fallbackUrl = URL.createObjectURL(blob);
            console.log("Created fallback image for failed load:", fallbackUrl);
            resolve(fallbackUrl);
          } else {
            resolve(null);
          }
        }, 'image/png');
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
    
    // В режиме редактирования сохраняем оригинальные баннеры
    const originalBanners = banners.filter(b => b.isOriginal);
    console.log('[BannerStep] Current banners:', banners);
    console.log('[BannerStep] Original banners found:', originalBanners);
    console.log('[BannerStep] Is restored mode:', initialConfig && initialConfig._isRestored);
    console.log('[BannerStep] Is branded template:', isBrandedTemplate);
    
    if (!(initialConfig && initialConfig._isRestored)) {
      setBanners([]); // Очищаем только если не в режиме редактирования
    }
    try {
      console.log('Generating banners using multi-agent system...');
      console.log('Config imageModel:', config.imageModel);
      
      // Standard flow with selected headline - works for both branded and regular templates
      const result = await generateBannerFromHeadline({
        selectedHeadline: config.selected_headline,
        size: config.size,
        template: config.template,
        uploadedImage: uploadedImage ? { url: uploadedImage } : null,
        webContent: config.webContent,
        url: config.url,
        imageModel: config.imageModel,
        sessionId: sessionId,
        brandingData: config.brandingData,
        useBrandStyle: config.useBrandStyle,
        selectedVariant: config.selectedVariant
      });
      
      // Compose final images with text overlay on canvas
      const generatedBanners = (await Promise.all(
        result.banners.map(async (banner, index) => {
          try {
            // Используем брендированную функцию для брендированных шаблонов
            console.log('[BannerStep] isBrandedTemplate:', isBrandedTemplate, 'config.template:', config.template);
            const composedUrl = isBrandedTemplate
              ? await createBrandedBanner(
                  banner.imageUrl,
                  banner.headline,
                  `${banner.size.width}x${banner.size.height}`,
                  config.brandingData, // может быть null, функция использует fallback
                  index // передаем индекс для fallback выбора варианта если selectedVariant не указан
                )
              : await createBannerWithText(
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
      
      // В режиме редактирования объединяем новые баннеры с оригинальными
      const finalBanners = (initialConfig && initialConfig._isRestored) 
        ? [...originalBanners, ...generatedBanners.slice(0, 2)] // Ограничиваем до 2 новых баннеров
        : generatedBanners;
      
      console.log('[BannerStep] Final banners being set:', finalBanners);
      console.log('[BannerStep] Original banners being combined:', originalBanners);
      console.log('[BannerStep] Generated banners being combined:', generatedBanners);
        
      setBanners(finalBanners);
      setConfig({
        ...config,
        banner_urls: finalBanners,
        taskId: result.taskId,
        images: result.images,
        status: 'completed'
      });
      
      console.log('Banners generated successfully:', generatedBanners.length);
      
      // Предупреждение если не все баннеры созданы
      if (generatedBanners.length < result.banners.length) {
        const failedCount = result.banners.length - generatedBanners.length;
        console.warn(`Failed to create ${failedCount} out of ${result.banners.length} banners`);
        // Можно добавить toast уведомление для пользователя
      }
      
    } catch (error) {
      console.error('Ошибка генерации баннеров:', error);
    }
    setIsGenerating(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.selected_headline, config.size, config.template, uploadedImage, config.webContent, config.url, isGenerating]);

  const handleRegenerateImages = async () => {
    if (!imageFeedback.trim()) {
      alert('Пожалуйста, введите пожелания для улучшения изображений');
      return;
    }

    setIsRegeneratingImages(true);
    try {
      console.log('Regenerating images with feedback:', imageFeedback);
      
      const result = await regenerateImages({
        webContent: config.webContent,
        headlines: [config.selected_headline],
        userFeedback: imageFeedback,
        imageModel: config.imageModel || 'recraftv3',
        count: 3,
        sessionId: sessionId
      });
      
      // Compose new banners with text overlay
      const generatedBanners = (await Promise.all(
        result.images.map(async (image, index) => {
          try {
            // Используем брендированную функцию для брендированных шаблонов
            const composedUrl = isBrandedTemplate
              ? await createBrandedBanner(
                  image.url,
                  config.selected_headline,
                  `${config.size}`,
                  config.brandingData, // может быть null, функция использует fallback
                  index // используется как fallback если selectedVariant не указан
                )
              : await createBannerWithText(
                  image.url,
                  config.selected_headline,
                  `${config.size}`,
                  config.template,
                  { padding: 20, fontSize: 'auto' },
                  false
                );
            return {
              url: composedUrl,
              headline: config.selected_headline,
              template: config.template,
              size: config.size,
              imageUrl: image.url,
              composition: { padding: 20, fontSize: 'auto' },
              isUploadedImage: false,
              regenerated: true,
              feedback: imageFeedback
            };
          } catch (error) {
            console.error('Error creating banner with text:', error);
            return null;
          }
        })
      )).filter(Boolean);
      
      setBanners(generatedBanners);
      setConfig({
        ...config,
        banner_urls: generatedBanners,
        taskId: result.taskId,
        images: result.images
      });
      
      setShowImageFeedback(false);
      setImageFeedback('');
      console.log('Images regenerated successfully:', generatedBanners.length);
      
      // Предупреждение если не все баннеры регенерированы
      if (generatedBanners.length < result.images.length) {
        const failedCount = result.images.length - generatedBanners.length;
        console.warn(`Failed to regenerate ${failedCount} out of ${result.images.length} banners`);
        // Можно добавить toast уведомление для пользователя
      }
      
    } catch (error) {
      console.error('Ошибка регенерации изображений:', error);
      alert('Произошла ошибка при регенерации изображений. Попробуйте снова.');
    }
    setIsRegeneratingImages(false);
  };

  useEffect(() => {
    // Requires selected headline for all templates (both regular and branded)
    if (!config.selected_headline || config.selected_headline.trim() === '') return;
    const key = JSON.stringify([config.selected_headline, uploadedImage, config.size, config.template, config.selectedVariant]);
    if (lastRequestKeyRef.current === key) return;
    lastRequestKeyRef.current = key;
    generateBanners();
  }, [uploadedImage, config.selected_headline, config.size, config.template, config.selectedVariant, generateBanners]);

  const downloadBanner = async (bannerUrl, index) => {
    try {
      // Скачиваем файл
      const link = document.createElement('a');
      link.href = bannerUrl;
      link.download = `banneradsai-${config.size}-${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Сохраняем в историю
      let bannerData = null;
      if (sessionId && banners[index]) {
        bannerData = {
          id: banners[index].id || `banner_${Date.now()}_${index}`,
          headline: config.selected_headline,
          imageUrl: bannerUrl,
          size: { width: parseInt(config.size.split('x')[0]), height: parseInt(config.size.split('x')[1]) },
          template: config.template,
          isUploadedImage: !!uploadedImage,
          createdAt: new Date().toISOString()
        };
        
        const generationContext = {
          taskId: config.taskId,
          input: {
            url: config.url,
            size: config.size,
            template: config.template,
            font: config.font,
            imageModel: config.imageModel,
            uploadedImage: uploadedImage
          },
          output: {
            webContent: config.webContent,
            selectedHeadline: config.selected_headline
          }
        };
        
        await saveDownloadedBanner(sessionId, bannerData, generationContext);
        console.log('Баннер сохранен в историю');
      }

      // Показываем модалку рейтинга
      if (bannerData) {
        setCurrentRatingBanner({
          bannerId: bannerData.id,
          headline: config.selected_headline,
          template: config.template,
          font: config.font,
          imageModel: config.imageModel,
          size: config.size,
          url: config.url
        });
        setShowRatingModal(true);
      }
      
    } catch (error) {
      console.error('Ошибка при скачивании/сохранении баннера:', error);
    }
  };

  const downloadAllBanners = () => {
    banners.forEach((banner, index) => {
      setTimeout(() => downloadBanner(banner.url, index), index * 500);
    });
  };

  const handleRatingSubmit = async (ratingData) => {
    setIsSubmittingRating(true);
    try {
      await ratingAPI.submitRating({
        bannerId: currentRatingBanner.bannerId,
        ...ratingData,
        context: currentRatingBanner
      });
      console.log('Rating submitted successfully');
    } catch (error) {
      console.error('Error submitting rating:', error);
      throw error; // Re-throw to let the modal handle the error
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Функции для зума баннеров
  const handleZoomBanner = (banner, index, event) => {
    // Получаем позицию элемента, на который кликнули
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    setZoomedBanner({
      ...banner,
      index: index,
      title: `Вариант ${index + 1}`,
      isUploaded: uploadedImage && index === 0,
      // Сохраняем позицию оригинального баннера с учетом скролла
      originalPosition: {
        left: rect.left + scrollX,
        top: rect.top + scrollY,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2
      }
    });
    setIsZoomed(true);
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
    setZoomedBanner(null);
  };

  // Обработка нажатия ESC для закрытия зума
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isZoomed) {
        handleCloseZoom();
      }
    };

    if (isZoomed) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isZoomed]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Шаг 5: Готовые баннеры */}
      <div className="step-header mb-6 flex items-center gap-4">
        <div className="step-check w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
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
            {config.selected_headline && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Заголовок</p>
                <p className="font-semibold text-gray-900">{config.selected_headline}</p>
              </div>
            )}
            
            {isBrandedTemplate && config.brandingData && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500 mb-1">Бренд</p>
                <p className="font-semibold text-gray-900">{config.brandingData.title}</p>
                <p className="text-sm text-gray-600">{config.brandingData.industry}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Размер</p>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 font-semibold">{config.size}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Стиль</p>
                <Badge variant="secondary" className={`font-semibold ${
                  config.template === 'branded' ? 'bg-purple-100 text-purple-800' :
                  config.template === 'blue_white' ? 'bg-blue-100 text-blue-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {config.template === 'branded' ? 'Брендированный' :
                   config.template === 'blue_white' ? 'Синий стиль' : 'Красный стиль'}
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isBrandedTemplate ? 'Создаем брендированные баннеры' : 'Создаем ваши баннеры'}
                </h3>
                <p className="text-gray-600">
                  {isBrandedTemplate ? 
                    'ИИ создает баннеры в фирменном стиле вашего бренда' :
                    uploadedImage ? 'ИИ генерирует варианты и добавляет ваше изображение' : 'ИИ генерирует уникальные профессиональные дизайны'
                  }
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
                        <div className="relative group mb-4">
                          <img 
                            src={banner.url} 
                            alt={`Баннер ${index + 1}`}
                            className="w-full object-contain bg-gray-100 rounded-lg cursor-pointer transition-all group-hover:brightness-95"
                            style={{ 
                              aspectRatio: config.size === '300x250' ? '300/250' : '336/280',
                              maxHeight: '200px'
                            }}
                            onClick={(e) => handleZoomBanner(banner, index, e)}
                          />
                          {/* Кнопка зума, появляется при наведении */}
                          <Button
                            variant="secondary"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white shadow-lg"
                            onClick={(e) => handleZoomBanner(banner, index, e)}
                          >
                            <Maximize2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Заголовок и бейдж в отдельном контейнере */}
                        <div className="mb-3 min-h-[24px] flex items-start gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">Вариант {index + 1}</span>
                          {uploadedImage && index === 0 && (
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 whitespace-nowrap">
                              Ваше изображение
                            </Badge>
                          )}
                          {banner.isOriginal && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 whitespace-nowrap">
                              Оригинал
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

                {/* Image Feedback Input */}
                <AnimatePresence>
                  {showImageFeedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-4 border border-blue-200 rounded-xl bg-blue-50"
                    >
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Как улучшить изображения для баннеров?
                      </Label>
                      <p className="text-xs text-gray-500 mb-3">
                        Например: "сделать более яркими", "добавить теплых тонов", "более минималистично", "показать людей"
                      </p>
                      <div className="flex gap-2">
                        <Input
                          value={imageFeedback}
                          onChange={(e) => setImageFeedback(e.target.value)}
                          placeholder="Опишите ваши пожелания для изображений..."
                          className="flex-1"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleRegenerateImages();
                            }
                          }}
                        />
                        <Button
                          onClick={handleRegenerateImages}
                          disabled={isRegeneratingImages || !imageFeedback.trim()}
                          className="px-6"
                        >
                          {isRegeneratingImages ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Применить'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowImageFeedback(false);
                            setImageFeedback('');
                          }}
                          className="px-4"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={onBack}
                    variant="outline"
                    className="h-12 px-6"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Назад
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={generateBanners}
                    disabled={isGenerating || isRegeneratingImages}
                    className="flex-1 flex items-center gap-2 h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Создать новые варианты
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowImageFeedback(!showImageFeedback)}
                    disabled={isGenerating || isRegeneratingImages || banners.length === 0}
                    className="h-12 px-4 border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Улучшить изображение
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

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        bannerData={currentRatingBanner}
        isSubmitting={isSubmittingRating}
      />

      {/* Модальное окно для зума баннера */}
      <AnimatePresence>
        {isZoomed && zoomedBanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-transparent z-50"
            onClick={handleCloseZoom}
          >
            {/* Кнопка закрытия */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseZoom}
              className="absolute top-4 right-4 z-10 text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <X className="w-8 h-8" />
            </Button>

            {/* Увеличенное изображение баннера */}
            <motion.div
              initial={{ 
                scale: 0.5,
                opacity: 0
              }}
              animate={{ 
                scale: 1, 
                opacity: 1
              }}
              exit={{ 
                scale: 0.5, 
                opacity: 0
              }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative max-w-[80vw] max-h-[80vh]"
              style={{
                position: 'fixed',
                left: zoomedBanner.originalPosition ? 
                  `${zoomedBanner.originalPosition.centerX - 230}px` : '50%',
                top: zoomedBanner.originalPosition ? 
                  `${zoomedBanner.originalPosition.centerY - 30}px` : '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 60
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={zoomedBanner.url} 
                alt={zoomedBanner.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
