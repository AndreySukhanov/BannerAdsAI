# 🤖 Система AI Инсайтов для оптимизации генерации баннеров
## Техническая документация v2.3.0

### Автоматический анализ отзывов пользователей для улучшения качества AI-генерации

---

## 📋 Содержание

1. [Обзор системы](#обзор-системы)
2. [Архитектура](#архитектура)
3. [Схема данных](#схема-данных)
4. [API документация](#api-документация)
5. [Алгоритмы анализа](#алгоритмы-анализа)
6. [Интеграция с UI](#интеграция-с-ui)
7. [Применение инсайтов](#применение-инсайтов)
8. [Производительность и масштабирование](#производительность-и-масштабирование)

---

## 🎯 Обзор системы

### Назначение
Система AI инсайтов собирает и анализирует отзывы пользователей о сгенерированных баннерах для автоматической оптимизации параметров генерации и повышения качества результата.

### Ключевые возможности
- **5-звездная система рейтингов** с контекстными данными
- **Интеллектуальный анализ паттернов** в отзывах пользователей
- **Автоматическая оптимизация промптов** на основе статистики
- **Адаптивная настройка** параметров генерации
- **Система обратной связи** для непрерывного улучшения

### Принцип работы
1. Пользователь скачивает баннер → появляется модальное окно рейтинга
2. Система сохраняет рейтинг с контекстными данными (шрифт, модель ИИ, шаблон)
3. AI анализирует паттерны в высоко- и низкорейтинговых баннерах
4. Генерируются инсайты для оптимизации будущих генераций
5. Параметры автоматически корректируются на основе полученных данных

---

## 🏗️ Архитектура

### Компоненты системы

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                         │
├─────────────────────────────────────────────────────────────┤
│ RatingModal.jsx  │ StarRating.jsx   │ Cabinet Analytics    │
│ - Сбор рейтингов │ - UI компонент   │ - Отображение       │
│ - Быстрые теги   │ - Интерактивность│   статистики        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                             │
├─────────────────────────────────────────────────────────────┤
│ rating-client.js │ ratings.js (routes) │ Express Endpoints │
│ - HTTP клиент    │ - API маршруты      │ - Валидация       │
│ - Аутентификация │ - Middleware        │ - Обработка       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic                           │
├─────────────────────────────────────────────────────────────┤
│            rating-storage.js (RatingStorage)               │
│ ┌─────────────────┬─────────────────┬─────────────────────┐ │
│ │ Data Management │ AI Analytics    │ Pattern Recognition │ │
│ │ - Сохранение    │ - getAIInsights │ - analyzeFeedback   │ │
│ │ - Индексация    │ - NPS расчет    │ - getTopTags        │ │
│ │ - Валидация     │ - Сегментация   │ - Статистика        │ │
│ └─────────────────┴─────────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Storage Layer                            │
├─────────────────────────────────────────────────────────────┤
│ JSON-based файловая система                                 │
│ ┌─────────────────┬─────────────────┬─────────────────────┐ │
│ │ index.json      │ {ratingId}.json │ Структура данных    │ │
│ │ - Быстрый поиск │ - Полные данные │ - Схема рейтингов   │ │
│ │ - Индексация    │ - Детали отзыва │ - Контекст генерации│ │
│ └─────────────────┴─────────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Схема данных

### RatingSchema
```javascript
{
  id: "string",           // UUID рейтинга (сгенерированный)
  bannerId: "string",     // Связь с генерацией (из истории)
  userId: "string",       // Идентификатор пользователя
  rating: "number",       // 1-5 звезд (обязательное поле)
  feedback: "string",     // Текстовый отзыв (до 500 символов)
  tags: "array",          // Быстрые теги оценки
  timestamp: "string",    // ISO дата создания
  
  // Контекст для AI анализа
  context: {
    headline: "string",        // Заголовок баннера
    template: "string",        // blue_white | red_white
    font: "string",            // Roboto | Inter | Montserrat | OpenSans
    imageModel: "string",      // recraftv3 | realistic | digital-illustration | vector-illustration
    size: "string",            // 300x250 | 336x280
    url: "string"              // URL исходной страницы
  }
}
```

### Index Structure
```javascript
// data/ratings/index.json - быстрый поиск
[
  {
    id: "rating_id",
    bannerId: "banner_id", 
    userId: "user_id",
    rating: 4,
    timestamp: "2025-01-15T10:30:00.000Z",
    hasContext: true
  }
]
```

### Storage Organization
```
backend/data/ratings/
├── index.json                    # Индекс всех рейтингов
├── meuexrw6tb9to1u1uph.json     # Детальные данные рейтинга
├── lmxp8w2kt5n9v3c7qdr.json     # Другой рейтинг
└── ...                          # Остальные рейтинги
```

---

## 🚀 API документация

### POST /api/ratings/submit
Сохранение нового рейтинга баннера

**Request:**
```javascript
{
  bannerId: "banner_12345",
  rating: 4,
  feedback: "Отличные цвета, но текст мог бы быть крупнее",
  tags: ["Хорошие цвета", "Плохо читается"],
  context: {
    headline: "Купите сейчас со скидкой 50%",
    template: "blue_white",
    font: "Roboto",
    imageModel: "recraftv3",
    size: "300x250",
    url: "https://example.com"
  }
}
```

**Response:**
```javascript
{
  success: true,
  ratingId: "lmxp8w2kt5n9v3c7qdr",
  message: "Rating saved successfully"
}
```

### GET /api/ratings/user/:userId/stats
Статистика рейтингов пользователя

**Response:**
```javascript
{
  success: true,
  data: {
    totalRatings: 15,
    avgRating: 3.8,
    distribution: { 1: 1, 2: 2, 3: 4, 4: 6, 5: 2 },
    highRatings: 8,      // 4-5 звезд
    lowRatings: 3,       // 1-2 звезды
    nps: 33,            // Net Promoter Score
    recentRatings: [...] // Последние 10 рейтингов
  }
}
```

### GET /api/ratings/insights/ai
AI инсайты для оптимизации (админский endpoint)

**Query Parameters:**
- `minRating` - минимальный рейтинг для фильтрации
- `maxRating` - максимальный рейтинг для фильтрации  
- `template` - фильтр по шаблону (blue_white/red_white)
- `font` - фильтр по шрифту
- `imageModel` - фильтр по модели ИИ
- `limit` - лимит результатов

**Response:**
```javascript
{
  success: true,
  data: {
    highRated: [...],        // Баннеры с рейтингом 4-5
    lowRated: [...],         // Баннеры с рейтингом 1-2
    commonTags: [            // Топ-теги по частоте
      { tag: "Хорошие цвета", count: 25 },
      { tag: "Плохо читается", count: 18 }
    ],
    feedbackInsights: {
      totalFeedback: 45,
      avgRatingWithFeedback: 3.9,
      samples: [...]         // Примеры отзывов
    },
    summary: {
      highRatedCount: 67,
      lowRatedCount: 23,
      topTags: [...],
      feedbackSamples: [...]
    }
  }
}
```

---

## 🧠 Алгоритмы анализа

### NPS (Net Promoter Score) Calculation
```javascript
calculateNPS(distribution) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  
  const promoters = (distribution[5] + distribution[4]) / total * 100; // 4-5 звезд
  const detractors = (distribution[1] + distribution[2]) / total * 100; // 1-2 звезды
  
  return Math.round(promoters - detractors);
}
```

### Top Tags Analysis
```javascript
getTopTags(ratings) {
  const tagCounts = {};
  ratings.forEach(rating => {
    if (rating.tags) {
      rating.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  return Object.entries(tagCounts)
    .sort(([,a], [,b]) => b - a)      // Сортировка по убыванию
    .slice(0, 10)                     // Топ-10
    .map(([tag, count]) => ({ tag, count }));
}
```

### Feedback Sentiment Analysis
```javascript
analyzeFeedback(ratings) {
  const feedback = ratings
    .filter(r => r.feedback && r.feedback.trim())
    .map(r => ({ rating: r.rating, feedback: r.feedback.trim() }));
  
  return {
    totalFeedback: feedback.length,
    avgRatingWithFeedback: feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length || 0,
    samples: feedback.slice(0, 5)     // Репрезентативные примеры
  };
}
```

### Pattern Recognition Algorithm
```javascript
async getAIInsights(options = {}) {
  const { minRating = 1, maxRating = 5, template, font, imageModel } = options;
  
  // 1. Загрузка и фильтрация данных
  const index = await this.loadIndex();
  let filteredRatings = index.filter(rating => 
    rating.rating >= minRating && rating.rating <= maxRating
  );
  
  // 2. Контекстная фильтрация
  if (template) filteredRatings = filteredRatings.filter(r => r.context?.template === template);
  if (font) filteredRatings = filteredRatings.filter(r => r.context?.font === font);
  if (imageModel) filteredRatings = filteredRatings.filter(r => r.context?.imageModel === imageModel);
  
  // 3. Загрузка полных данных
  const fullRatings = await Promise.all(
    filteredRatings.map(indexRating => this.getRating(indexRating.id))
  );
  
  // 4. Анализ паттернов
  return {
    highRated: fullRatings.filter(r => r.rating >= 4),
    lowRated: fullRatings.filter(r => r.rating <= 2),
    commonTags: this.getTopTags(fullRatings),
    feedbackInsights: this.analyzeFeedback(fullRatings)
  };
}
```

---

## 💻 Интеграция с UI

### RatingModal Component
**Путь:** `src/components/ui/RatingModal.jsx`

**Основные функции:**
```javascript
const RatingModal = ({ isOpen, onClose, onSubmit, bannerData, isSubmitting }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const quickTags = [
    'Отличное качество',    'Хорошие цвета',      'Подходящий шрифт',
    'Удачная композиция',   'Слишком яркий',      'Плохо читается',
    'Неподходящий стиль',   'Низкое качество'
  ];
  
  // Обработка отправки с валидацией
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Пожалуйста, поставьте оценку от 1 до 5 звезд');
      return;
    }
    
    const ratingData = {
      rating,
      feedback: feedback.trim(),
      tags: selectedTags,
      context: bannerData        // Автоматическая привязка контекста
    };
    
    await onSubmit(ratingData);
  };
}
```

### StarRating Component  
**Путь:** `src/components/ui/StarRating.jsx`

**Возможности:**
- Интерактивные звезды с hover-эффектами
- Поддержка readonly режима
- Настраиваемый размер и стиль
- Отображение численного значения

### Integration Flow
```javascript
// 1. После скачивания баннера
const handleDownload = async () => {
  await downloadBanner();
  setShowRatingModal(true);     // Показать модальное окно
};

// 2. Отправка рейтинга
const handleRatingSubmit = async (ratingData) => {
  try {
    await ratingAPI.submitRating({
      bannerId: currentBanner.id,
      ...ratingData,
      context: {
        headline: currentBanner.headline,
        template: currentBanner.template,
        font: currentBanner.font,
        imageModel: currentBanner.imageModel,
        size: currentBanner.size,
        url: currentBanner.originalUrl
      }
    });
    setShowRatingModal(false);
  } catch (error) {
    console.error('Rating submission failed:', error);
  }
};
```

---

## 🎯 Применение инсайтов

### Автоматическая оптимизация промптов
```javascript
// Анализ высокорейтинговых баннеров
const optimizeImagePrompts = async () => {
  const insights = await ratingAPI.getAIInsights({ minRating: 4 });
  
  // Определение лучших моделей для разных типов контента
  const modelPerformance = {};
  insights.data.highRated.forEach(rating => {
    const model = rating.context.imageModel;
    modelPerformance[model] = (modelPerformance[model] || 0) + 1;
  });
  
  // Приоритизация лучших моделей
  const bestModel = Object.keys(modelPerformance)
    .sort((a, b) => modelPerformance[b] - modelPerformance[a])[0];
    
  return bestModel;
};
```

### Адаптивный выбор шрифтов
```javascript
// Рекомендация шрифтов на основе статистики
const recommendFont = async (context) => {
  const fontStats = await ratingAPI.getAIInsights({ 
    minRating: 4,
    template: context.template 
  });
  
  const fontRatings = {};
  fontStats.data.highRated.forEach(rating => {
    const font = rating.context.font;
    fontRatings[font] = (fontRatings[font] || []).concat(rating.rating);
  });
  
  // Выбор шрифта с лучшим средним рейтингом
  let bestFont = 'Roboto';
  let bestAvgRating = 0;
  
  Object.entries(fontRatings).forEach(([font, ratings]) => {
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    if (avgRating > bestAvgRating) {
      bestAvgRating = avgRating;
      bestFont = font;
    }
  });
  
  return bestFont;
};
```

### Контекстная генерация
```javascript
// Анализ паттернов для разных типов сайтов
const analyzeUrlPatterns = async () => {
  const insights = await ratingAPI.getAIInsights();
  
  const urlPatterns = {};
  insights.data.highRated.forEach(rating => {
    try {
      const domain = new URL(rating.context.url).hostname;
      const category = categorizeWebsite(domain);
      
      urlPatterns[category] = urlPatterns[category] || {
        bestTemplates: {},
        bestFonts: {},
        commonTags: []
      };
      
      // Накопление статистики по категориям
      urlPatterns[category].bestTemplates[rating.context.template] = 
        (urlPatterns[category].bestTemplates[rating.context.template] || 0) + 1;
        
      urlPatterns[category].bestFonts[rating.context.font] = 
        (urlPatterns[category].bestFonts[rating.context.font] || 0) + 1;
        
      urlPatterns[category].commonTags.push(...rating.tags);
    } catch (error) {
      // Игнорируем некорректные URL
    }
  });
  
  return urlPatterns;
};
```

### Система предупреждений
```javascript
// Предупреждения о потенциальных проблемах
const generateWarnings = async (generationParams) => {
  const lowRatedInsights = await ratingAPI.getAIInsights({ 
    maxRating: 2,
    template: generationParams.template,
    font: generationParams.font 
  });
  
  const warnings = [];
  
  // Анализ частых проблем
  const problemTags = lowRatedInsights.data.commonTags
    .filter(tag => tag.count > 5)
    .map(tag => tag.tag);
    
  if (problemTags.includes('Плохо читается')) {
    warnings.push('Возможны проблемы с читаемостью текста');
  }
  
  if (problemTags.includes('Неподходящий стиль')) {
    warnings.push('Стиль может не подходить для данного типа контента');
  }
  
  return warnings;
};
```

---

## ⚡ Производительность и масштабирование

### Оптимизация хранилища
```javascript
// Индексирование для быстрого поиска
class RatingStorage {
  constructor() {
    this.ratingsDir = path.join(__dirname, '..', 'data', 'ratings');
    this.indexFile = path.join(this.ratingsDir, 'index.json');
    this.cacheEnabled = true;
    this.indexCache = null;
  }
  
  // Кэширование индекса в памяти
  async loadIndex() {
    if (this.cacheEnabled && this.indexCache) {
      return this.indexCache;
    }
    
    try {
      const indexData = await fs.readFile(this.indexFile, 'utf-8');
      const index = JSON.parse(indexData);
      
      if (this.cacheEnabled) {
        this.indexCache = index;
        // Инвалидация кэша через 5 минут
        setTimeout(() => { this.indexCache = null; }, 5 * 60 * 1000);
      }
      
      return index;
    } catch (error) {
      return [];
    }
  }
}
```

### Пагинация и лимиты
```javascript
// Эффективная пагинация для больших объемов данных
async getUserRatings(userId, options = {}) {
  const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = options;
  
  // Ограничение лимита для предотвращения перегрузки
  const effectiveLimit = Math.min(limit, 100);
  
  const index = await this.loadIndex();
  const userRatings = index.filter(rating => 
    rating.userId === userId || userId === 'all'
  );
  
  // Эффективная сортировка
  userRatings.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  // Пагинация без загрузки всех данных
  const startIndex = (page - 1) * effectiveLimit;
  const paginatedRatings = userRatings.slice(startIndex, startIndex + effectiveLimit);
  
  return {
    ratings: paginatedRatings,
    pagination: {
      page,
      limit: effectiveLimit,
      total: userRatings.length,
      totalPages: Math.ceil(userRatings.length / effectiveLimit)
    }
  };
}
```

### Асинхронная обработка
```javascript
// Неблокирующая обработка AI инсайтов
async getAIInsights(options = {}) {
  try {
    // Параллельная загрузка данных
    const [index, cachedInsights] = await Promise.all([
      this.loadIndex(),
      this.getCachedInsights(options)
    ]);
    
    if (cachedInsights) {
      return cachedInsights;
    }
    
    // Фильтрация данных
    const filteredRatings = this.filterRatings(index, options);
    
    // Параллельная загрузка полных данных рейтингов
    const fullRatings = await Promise.all(
      filteredRatings.map(async (indexRating) => {
        try {
          return await this.getRating(indexRating.id);
        } catch (error) {
          console.warn(`Failed to load rating ${indexRating.id}:`, error);
          return indexRating; // Fallback к индексным данным
        }
      })
    );
    
    // Анализ паттернов
    const insights = {
      highRated: fullRatings.filter(r => r.rating >= 4),
      lowRated: fullRatings.filter(r => r.rating <= 2),
      commonTags: this.getTopTags(fullRatings),
      feedbackInsights: this.analyzeFeedback(fullRatings)
    };
    
    // Кэширование результатов
    await this.cacheInsights(options, insights);
    
    return insights;
    
  } catch (error) {
    console.error('[RatingStorage] Failed to get AI insights:', error);
    return { highRated: [], lowRated: [], commonTags: [], feedbackInsights: [] };
  }
}
```

### Мониторинг и логирование
```javascript
// Логирование для мониторинга производительности
const performanceLogger = {
  logRatingSubmission: (duration, userId, success) => {
    console.log(`[Performance] Rating submission: ${duration}ms, User: ${userId}, Success: ${success}`);
  },
  
  logInsightsGeneration: (duration, filters, resultCount) => {
    console.log(`[Performance] AI insights generation: ${duration}ms, Filters: ${JSON.stringify(filters)}, Results: ${resultCount}`);
  },
  
  logCacheHit: (cacheType, hitRate) => {
    console.log(`[Performance] Cache ${cacheType} hit rate: ${hitRate}%`);
  }
};

// Использование в коде
const startTime = Date.now();
try {
  const result = await this.getAIInsights(options);
  performanceLogger.logInsightsGeneration(Date.now() - startTime, options, result.highRated.length);
  return result;
} catch (error) {
  performanceLogger.logInsightsGeneration(Date.now() - startTime, options, 0);
  throw error;
}
```

---

## 📈 Метрики и KPI

### Ключевые показатели системы
- **Conversion Rate**: % пользователей, оставляющих рейтинги
- **Average Rating**: средний рейтинг всех баннеров  
- **NPS Score**: общий Net Promoter Score системы
- **Feedback Volume**: количество текстовых отзывов
- **Pattern Recognition Accuracy**: точность распознавания паттернов
- **Optimization Impact**: улучшение рейтингов после оптимизации

### Система мониторинга
```javascript
// Автоматический расчет метрик
const calculateSystemMetrics = async () => {
  const globalStats = await ratingStorage.getUserRatingStats('all');
  const insights = await ratingStorage.getAIInsights();
  
  return {
    totalRatings: globalStats.totalRatings,
    averageRating: globalStats.avgRating,
    npsScore: globalStats.nps,
    conversionRate: await calculateConversionRate(),
    feedbackVolume: insights.feedbackInsights.totalFeedback,
    topIssues: insights.commonTags.slice(0, 5),
    improvementTrends: await calculateTrends()
  };
};
```

---

## 🔧 Настройка и развертывание

### Переменные окружения
```bash
# AI Insights Configuration
AI_INSIGHTS_ENABLED=true
RATING_CACHE_TTL=300000          # 5 minutes
MAX_FEEDBACK_LENGTH=500
ENABLE_PERFORMANCE_LOGGING=true
AI_INSIGHTS_BATCH_SIZE=100
```

### Инициализация системы
```javascript
// При запуске приложения
const initializeAIInsights = async () => {
  console.log('[AI Insights] Initializing system...');
  
  // Создание директорий
  await ratingStorage.initStorage();
  
  // Проверка целостности данных
  await ratingStorage.validateDataIntegrity();
  
  // Прогрев кэшей
  await ratingStorage.warmUpCaches();
  
  console.log('[AI Insights] System initialized successfully');
};
```

### Backup и восстановление
```javascript
// Система резервного копирования
const backupRatings = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `ratings-${timestamp}`);
  
  await fs.mkdir(backupDir, { recursive: true });
  await fs.cp(ratingStorage.ratingsDir, backupDir, { recursive: true });
  
  console.log(`[Backup] Ratings backed up to ${backupDir}`);
};
```

---

## 🚀 Будущие улучшения

### Планируемые функции
1. **Machine Learning Integration**: интеграция с ML моделями для предсказания рейтингов
2. **Real-time Analytics**: dashboard с real-time аналитикой
3. **A/B Testing Framework**: автоматическое A/B тестирование параметров
4. **Advanced Sentiment Analysis**: глубокий анализ тональности отзывов
5. **Predictive Quality Scoring**: предсказание качества до генерации
6. **Auto-optimization Engine**: полностью автоматическая оптимизация параметров

### Архитектурные улучшения
1. **Database Migration**: переход с JSON на PostgreSQL/MongoDB
2. **Microservices Architecture**: выделение AI инсайтов в отдельный сервис
3. **Event-driven Architecture**: система событий для real-time обновлений
4. **GraphQL API**: более гибкая система запросов
5. **Redis Caching**: продвинутое кэширование для высокой нагрузки

---

## 📞 Поддержка и контакты

### Техническая поддержка
- **Email**: tech-support@banneradsai.com
- **GitHub Issues**: https://github.com/AndreySukhanov/BannerAdsAI/issues
- **Documentation**: https://docs.banneradsai.com/ai-insights

### Разработчики
- **Lead Developer**: Andrey Sukhanov
- **AI/ML Specialist**: TBD
- **Data Analyst**: TBD

---

*Документация актуальна для версии v2.3.0*  
*Последнее обновление: 2025-01-15*