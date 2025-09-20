import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import { OpenAI } from 'openai';
import { setBrandingCache, getBrandingCache, clearBrandingCache, getCacheStats } from '../cache/brand-cache.js';

const router = express.Router();

// Lazy OpenAI initialization to ensure env vars are loaded
let openai = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openai;
}

/**
 * Парсит веб-сайт для извлечения брендинга и стиля
 * @param {string} url - URL сайта для анализа
 * @returns {Object} - Объект с данными о брендинге
 */
async function parseWebsiteBranding(url) {
  try {
    console.log(`🔍 Анализируем сайт: ${url}`);
    
    // Проверяем кеш
    const cachedData = getBrandingCache(url);
    if (cachedData) {
      console.log(`⚡ Использован кеш для: ${url}`);
      return cachedData;
    }
    
    // Получаем HTML страницы
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000
    });
    
    const $ = load(response.data);
    
    // Извлекаем основную информацию
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content') || '';
    
    // Извлекаем цветовую схему из CSS
    const colors = extractColors(response.data);
    
    // Извлекаем логотипы и изображения
    const logos = extractLogos($);
    
    // Извлекаем шрифты
    const fonts = extractFonts($, response.data);
    
    // Извлекаем стили дизайна
    const designElements = extractDesignElements($, response.data);
    
    // Извлекаем основной контент
    const mainContent = extractMainContent($);
    
    // Определяем отрасль/категорию сайта
    const industry = await determineIndustry(title, description, mainContent);
    
    // Создаем объект брендинга
    const brandingData = {
      url,
      title,
      description,
      keywords,
      colors,
      logos,
      fonts,
      designElements,
      mainContent,
      industry,
      timestamp: new Date().toISOString()
    };
    
    console.log(`✅ Брендинг извлечен для: ${title}`);
    
    // Сохраняем в кеш
    setBrandingCache(url, brandingData);
    
    return brandingData;
    
  } catch (error) {
    console.error(`❌ Ошибка парсинга ${url}:`, error.message);
    throw new Error(`Не удалось проанализировать сайт: ${error.message}`);
  }
}

/**
 * Извлекает цветовую палитру из CSS
 */
function extractColors(html) {
  const colors = new Set();
  
  // Ищем CSS цвета в стилях
  const cssColorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;
  const colorMatches = html.match(cssColorRegex) || [];
  
  colorMatches.forEach(color => {
    if (color !== '#000' && color !== '#fff' && color !== '#ffffff' && color !== '#000000') {
      colors.add(color);
    }
  });
  
  // Добавляем стандартные названия цветов
  const namedColors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown'];
  namedColors.forEach(colorName => {
    if (html.toLowerCase().includes(`color: ${colorName}`) || 
        html.toLowerCase().includes(`background: ${colorName}`) ||
        html.toLowerCase().includes(`${colorName}`)) {
      colors.add(colorName);
    }
  });
  
  return Array.from(colors).slice(0, 10); // Ограничиваем до 10 цветов
}

/**
 * Извлекает логотипы и основные изображения
 */
function extractLogos($) {
  const logos = [];
  
  // Ищем изображения с ключевыми словами в alt, src или классах
  const logoKeywords = ['logo', 'brand', 'header', 'nav', 'brand'];
  
  $('img').each((i, elem) => {
    const src = $(elem).attr('src');
    const alt = $(elem).attr('alt') || '';
    const className = $(elem).attr('class') || '';
    
    if (src && logoKeywords.some(keyword => 
      alt.toLowerCase().includes(keyword) || 
      src.toLowerCase().includes(keyword) ||
      className.toLowerCase().includes(keyword)
    )) {
      logos.push({
        src,
        alt,
        className
      });
    }
  });
  
  return logos.slice(0, 5); // Ограничиваем до 5 логотипов
}

/**
 * Извлекает информацию о шрифтах и стилях текста
 */
function extractFonts($, html) {
  const fonts = new Set();
  const headlineFonts = new Set();
  
  // Ищем Google Fonts
  $('link[href*="fonts.googleapis.com"]').each((i, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      const fontMatch = href.match(/family=([^&:]+)/);
      if (fontMatch) {
        const fontName = fontMatch[1].replace(/\+/g, ' ').replace(/:.*/, '');
        fonts.add(fontName);
      }
    }
  });
  
  // Ищем шрифты заголовков из основных элементов
  const headlineSelectors = ['h1', 'h2', 'h3', '.headline', '.title', '.news-title', '[class*="title"]', '[class*="headline"]'];
  headlineSelectors.forEach(selector => {
    $(selector).each((i, elem) => {
      const style = $(elem).attr('style');
      if (style) {
        const fontMatch = style.match(/font-family:\s*["']?([^;"']+)["']?/i);
        if (fontMatch) {
          const fontFamily = fontMatch[1].split(',')[0].trim().replace(/["']/g, '');
          if (fontFamily && !fontFamily.toLowerCase().includes('serif') && !fontFamily.toLowerCase().includes('sans-serif')) {
            headlineFonts.add(fontFamily);
          }
        }
      }
    });
  });
  
  // Ищем font-family в CSS с приоритетом заголовков
  const fontFamilyRegex = /(?:h[1-6]|\.title|\.headline|\.news)[^{]*\{[^}]*font-family:\s*["']?([^;"']+)["']?/gi;
  let match;
  while ((match = fontFamilyRegex.exec(html)) !== null) {
    const fontFamily = match[1].split(',')[0].trim().replace(/["']/g, '');
    if (fontFamily && !fontFamily.toLowerCase().includes('serif') && !fontFamily.toLowerCase().includes('sans-serif')) {
      headlineFonts.add(fontFamily);
    }
  }
  
  // Ищем все font-family в CSS
  const allFontRegex = /font-family:\s*["']?([^;"']+)["']?/gi;
  const fontMatches = html.match(allFontRegex) || [];
  
  fontMatches.forEach(match => {
    const fontMatch = match.match(/font-family:\s*["']?([^;"']+)["']?/i);
    if (fontMatch) {
      const fontFamily = fontMatch[1].split(',')[0].trim().replace(/["']/g, '');
      if (fontFamily && !fontFamily.toLowerCase().includes('serif') && !fontFamily.toLowerCase().includes('sans-serif') && fontFamily.length > 2) {
        fonts.add(fontFamily);
      }
    }
  });
  
  // Приоритет заголовочным шрифтам
  const prioritizedFonts = [...headlineFonts, ...fonts];
  return Array.from(new Set(prioritizedFonts)).slice(0, 5);
}

/**
 * Извлекает элементы дизайна для воспроизведения стиля
 */
function extractDesignElements($, html) {
  const designInfo = {
    borderRadius: [],
    shadows: [],
    gradients: [],
    textStyles: {},
    layoutPatterns: []
  };
  
  // Ищем border-radius
  const borderRadiusRegex = /border-radius:\s*([^;]+)/gi;
  const borderMatches = html.match(borderRadiusRegex) || [];
  borderMatches.forEach(match => {
    const value = match.replace('border-radius:', '').trim();
    if (value && !value.includes('0px')) {
      designInfo.borderRadius.push(value);
    }
  });
  
  // Ищем box-shadow
  const shadowRegex = /box-shadow:\s*([^;]+)/gi;
  const shadowMatches = html.match(shadowRegex) || [];
  shadowMatches.forEach(match => {
    const value = match.replace('box-shadow:', '').trim();
    if (value && value !== 'none') {
      designInfo.shadows.push(value);
    }
  });
  
  // Ищем градиенты
  const gradientRegex = /background:\s*[^;]*(?:linear-gradient|radial-gradient)\([^)]+\)/gi;
  const gradientMatches = html.match(gradientRegex) || [];
  gradientMatches.forEach(match => {
    designInfo.gradients.push(match);
  });
  
  // Анализируем стили заголовков
  const headlineElements = $('h1, h2, h3, .headline, .title, .news-title, [class*="title"]').first();
  if (headlineElements.length > 0) {
    const style = headlineElements.attr('style') || '';
    designInfo.textStyles = {
      fontWeight: extractCSSProperty(style, 'font-weight') || 'bold',
      textTransform: extractCSSProperty(style, 'text-transform') || 'none',
      letterSpacing: extractCSSProperty(style, 'letter-spacing') || 'normal',
      lineHeight: extractCSSProperty(style, 'line-height') || '1.2'
    };
  }
  
  return designInfo;
}

/**
 * Вспомогательная функция для извлечения CSS-свойств
 */
function extractCSSProperty(style, property) {
  const regex = new RegExp(`${property}:\\s*([^;]+)`, 'i');
  const match = style.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Извлекает основной контент страницы
 */
function extractMainContent($) {
  // Удаляем скрипты, стили и навигацию
  $('script, style, nav, header, footer').remove();
  
  // Извлекаем текст из основных контейнеров
  const contentSelectors = ['main', '.content', '.main-content', 'article', '.post', '.page'];
  let mainContent = '';
  
  for (const selector of contentSelectors) {
    const content = $(selector).text();
    if (content && content.length > mainContent.length) {
      mainContent = content;
    }
  }
  
  // Если не нашли специфичные контейнеры, берем из body
  if (!mainContent) {
    mainContent = $('body').text();
  }
  
  // Очищаем и ограничиваем текст
  return mainContent
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 1000);
}

/**
 * Определяет отрасль сайта с помощью AI
 */
async function determineIndustry(title, description, content) {
  try {
    const prompt = `Определи отрасль/категорию этого сайта на основе информации:

Заголовок: ${title}
Описание: ${description}
Контент: ${content.substring(0, 500)}...

Выбери одну из категорий:
- E-commerce
- Technology
- Healthcare
- Finance
- Education
- Entertainment
- Travel
- Food & Restaurant
- Fashion
- Real Estate
- Automotive
- Sports
- News & Media
- Non-profit
- Business Services
- Other

Ответь только названием категории на английском.`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 50,
      temperature: 0.3
    });

    return response.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Ошибка определения отрасли:', error);
    return 'Other';
  }
}

/**
 * Генерирует промпт для AI на основе брендинга сайта
 */
async function generateBrandedPrompt(brandingData, originalPrompt) {
  try {
    const brandPrompt = `Создай промпт для генерации рекламного баннера с ЯРКО ВЫРАЖЕННЫМ брендированным стилем сайта:

ИНФОРМАЦИЯ О БРЕНДЕ:
- Название: ${brandingData.title}
- Описание: ${brandingData.description}
- Отрасль: ${brandingData.industry}
- Основные цвета: ${brandingData.colors.slice(0, 3).join(', ')}
- Шрифты: ${brandingData.fonts.join(', ')}

ОРИГИНАЛЬНЫЙ ПРОМПТ: ${originalPrompt}

ТРЕБОВАНИЯ К БРЕНДИРОВАННОМУ ДИЗАЙНУ:
1. ОБЯЗАТЕЛЬНО использовать ОСНОВНЫЕ цвета бренда (${brandingData.colors.slice(0, 2).join(' и ')}) как доминирующие цвета фона или акцентов
2. Включить визуальные элементы характерные для отрасли "${brandingData.industry}"
3. Добавить стилистические элементы соответствующие бренду "${brandingData.title}"
4. Сделать дизайн УЗНАВАЕМО фирменным с чёткой цветовой идентификацией
5. Использовать композицию и типографику соответствующую стилю бренда
6. Добавить декоративные элементы или паттерны в фирменных цветах

ВАЖНО: Брендинг должен быть ХОРОШО ЗАМЕТЕН - используй фирменные цвета активно, не просто как акценты!

Создай финальный промпт для Recraft.ai с учётом всех брендинговых требований:`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Ты эксперт по брендингу и дизайну рекламных баннеров. Создавай детальные промпты для AI генерации изображений, которые точно передают фирменный стиль брендов."
        },
        {
          role: "user",
          content: brandPrompt
        }
      ],
      max_tokens: 350,
      temperature: 0.8
    });

    return response.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Ошибка генерации брендированного промпта:', error);
    return originalPrompt; // Возвращаем оригинальный промпт в случае ошибки
  }
}

// API эндпоинты

/**
 * POST /api/brand-parser/analyze
 * Анализирует сайт и извлекает брендинг
 */
router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL обязателен'
      });
    }
    
    // Валидируем URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Некорректный URL'
      });
    }
    
    const brandingData = await parseWebsiteBranding(url);
    
    res.json({
      success: true,
      data: brandingData
    });
    
  } catch (error) {
    console.error('Ошибка анализа сайта:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/brand-parser/generate-prompt
 * Генерирует брендированный промпт
 */
router.post('/generate-prompt', async (req, res) => {
  try {
    const { brandingData, originalPrompt } = req.body;
    
    if (!brandingData || !originalPrompt) {
      return res.status(400).json({
        success: false,
        error: 'brandingData и originalPrompt обязательны'
      });
    }
    
    const brandedPrompt = await generateBrandedPrompt(brandingData, originalPrompt);
    
    res.json({
      success: true,
      data: {
        originalPrompt,
        brandedPrompt,
        brandingInfo: {
          title: brandingData.title,
          industry: brandingData.industry,
          colors: brandingData.colors,
          fonts: brandingData.fonts
        }
      }
    });
    
  } catch (error) {
    console.error('Ошибка генерации промпта:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/brand-parser/quick-analyze
 * Быстрый анализ + генерация промпта в одном запросе
 */
router.post('/quick-analyze', async (req, res) => {
  try {
    const { url, originalPrompt } = req.body;
    
    if (!url || !originalPrompt) {
      return res.status(400).json({
        success: false,
        error: 'URL и originalPrompt обязательны'
      });
    }
    
    // Анализируем сайт
    const brandingData = await parseWebsiteBranding(url);
    
    // Генерируем брендированный промпт
    const brandedPrompt = await generateBrandedPrompt(brandingData, originalPrompt);
    
    res.json({
      success: true,
      data: {
        originalPrompt,
        brandedPrompt,
        brandingData,
        suggestion: `Адаптирован под стиль ${brandingData.title} (${brandingData.industry})`
      }
    });
    
  } catch (error) {
    console.error('Ошибка быстрого анализа:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/brand-parser/cache/stats
 * Получает статистику кеша
 */
router.get('/cache/stats', async (req, res) => {
  try {
    const stats = getCacheStats();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Ошибка получения статистики кеша:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/brand-parser/cache/clear
 * Очищает весь кеш брендинга
 */
router.delete('/cache/clear', async (req, res) => {
  try {
    const result = clearBrandingCache();
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Ошибка очистки кеша:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;