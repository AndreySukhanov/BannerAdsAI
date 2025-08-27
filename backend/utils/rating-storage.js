// Система рейтингов баннеров
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Схема рейтинга
export const RatingSchema = {
  id: 'string',           // UUID рейтинга
  bannerId: 'string',     // ID баннера из истории
  userId: 'string',       // ID пользователя  
  rating: 'number',       // 1-5 звезд
  feedback: 'string',     // Текстовый отзыв (опционально)
  tags: 'array',          // Быстрые теги ["плохой текст", "хорошие цвета"]
  timestamp: 'string',    // ISO дата создания
  
  // Контекст для AI обучения
  context: {
    headline: 'string',
    template: 'string',   // blue_white, red_white
    font: 'string',
    imageModel: 'string', // recraftv3, realistic, etc
    size: 'string',       // 300x250, 336x280
    url: 'string'         // Исходный URL
  }
};

export class RatingStorage {
  constructor() {
    this.ratingsDir = path.join(__dirname, '..', 'data', 'ratings');
    this.indexFile = path.join(this.ratingsDir, 'index.json');
    this.initStorage();
  }
  
  // Инициализация хранилища
  async initStorage() {
    try {
      await fs.mkdir(this.ratingsDir, { recursive: true });
      
      // Создаем индексный файл если его нет
      try {
        await fs.access(this.indexFile);
      } catch {
        await fs.writeFile(this.indexFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('[RatingStorage] Failed to initialize storage:', error);
    }
  }
  
  // Сохранить рейтинг
  async saveRating(ratingData) {
    try {
      const rating = {
        id: this.generateId(),
        bannerId: ratingData.bannerId,
        userId: ratingData.userId,
        rating: parseInt(ratingData.rating), // 1-5
        feedback: ratingData.feedback || '',
        tags: ratingData.tags || [],
        timestamp: new Date().toISOString(),
        context: ratingData.context || {}
      };
      
      // Валидация рейтинга
      if (rating.rating < 1 || rating.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      // Сохраняем детальные данные в отдельный файл
      const ratingFile = path.join(this.ratingsDir, `${rating.id}.json`);
      await fs.writeFile(ratingFile, JSON.stringify(rating, null, 2));
      
      // Обновляем индекс
      await this.updateIndex(rating);
      
      console.log(`[RatingStorage] Saved rating ${rating.id} (${rating.rating} stars)`);
      return rating.id;
      
    } catch (error) {
      console.error('[RatingStorage] Failed to save rating:', error);
      throw error;
    }
  }
  
  // Получить рейтинги пользователя
  async getUserRatings(userId, options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = options;
      
      const index = await this.loadIndex();
      const userRatings = index.filter(rating => 
        rating.userId === userId || userId === 'all'
      );
      
      // Сортировка
      userRatings.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
      
      // Пагинация
      const startIndex = (page - 1) * limit;
      const paginatedRatings = userRatings.slice(startIndex, startIndex + limit);
      
      return {
        ratings: paginatedRatings,
        pagination: {
          page,
          limit,
          total: userRatings.length,
          totalPages: Math.ceil(userRatings.length / limit)
        }
      };
      
    } catch (error) {
      console.error('[RatingStorage] Failed to get user ratings:', error);
      return { ratings: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
    }
  }
  
  // Получить конкретный рейтинг
  async getRating(ratingId) {
    try {
      const ratingFile = path.join(this.ratingsDir, `${ratingId}.json`);
      const ratingData = await fs.readFile(ratingFile, 'utf-8');
      return JSON.parse(ratingData);
    } catch (error) {
      console.error(`[RatingStorage] Failed to get rating ${ratingId}:`, error);
      return null;
    }
  }
  
  // Получить статистику рейтингов пользователя
  async getUserRatingStats(userId) {
    try {
      const index = await this.loadIndex();
      const userRatings = index.filter(rating => 
        rating.userId === userId || userId === 'all'
      );
      
      if (userRatings.length === 0) {
        return {
          totalRatings: 0,
          avgRating: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentRatings: []
        };
      }
      
      // Распределение оценок
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalStars = 0;
      
      userRatings.forEach(rating => {
        distribution[rating.rating]++;
        totalStars += rating.rating;
      });
      
      // Средний рейтинг
      const avgRating = (totalStars / userRatings.length).toFixed(1);
      
      // Последние рейтинги
      const recentRatings = userRatings
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
      
      return {
        totalRatings: userRatings.length,
        avgRating: parseFloat(avgRating),
        distribution,
        recentRatings,
        
        // Дополнительная аналитика
        highRatings: userRatings.filter(r => r.rating >= 4).length,
        lowRatings: userRatings.filter(r => r.rating <= 2).length,
        
        // NPS (Net Promoter Score): промоутеры - детракторы
        nps: this.calculateNPS(distribution)
      };
      
    } catch (error) {
      console.error('[RatingStorage] Failed to get user rating stats:', error);
      return {
        totalRatings: 0,
        avgRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }
  }
  
  // Получить рейтинг баннера
  async getBannerRating(bannerId) {
    try {
      const index = await this.loadIndex();
      const bannerRatings = index.filter(rating => rating.bannerId === bannerId);
      
      if (bannerRatings.length === 0) {
        return null;
      }
      
      const avgRating = bannerRatings.reduce((sum, r) => sum + r.rating, 0) / bannerRatings.length;
      
      return {
        avgRating: parseFloat(avgRating.toFixed(1)),
        totalRatings: bannerRatings.length,
        ratings: bannerRatings
      };
      
    } catch (error) {
      console.error(`[RatingStorage] Failed to get banner rating ${bannerId}:`, error);
      return null;
    }
  }
  
  // Анализ для AI улучшений
  async getAIInsights(options = {}) {
    try {
      const { minRating = 1, maxRating = 5, template, font, imageModel } = options;
      
      const index = await this.loadIndex();
      let filteredRatings = index.filter(rating => 
        rating.rating >= minRating && rating.rating <= maxRating
      );
      
      // Фильтры
      if (template) filteredRatings = filteredRatings.filter(r => r.context?.template === template);
      if (font) filteredRatings = filteredRatings.filter(r => r.context?.font === font);
      if (imageModel) filteredRatings = filteredRatings.filter(r => r.context?.imageModel === imageModel);
      
      // Загружаем полные данные рейтингов с feedback
      const fullRatings = await Promise.all(
        filteredRatings.map(async (indexRating) => {
          try {
            return await this.getRating(indexRating.id);
          } catch (error) {
            return indexRating;
          }
        })
      );
      
      // Анализ паттернов
      const patterns = {
        highRated: fullRatings.filter(r => r.rating >= 4),
        lowRated: fullRatings.filter(r => r.rating <= 2),
        commonTags: this.getTopTags(fullRatings),
        feedbackInsights: this.analyzeFeedback(fullRatings)
      };
      
      return patterns;
      
    } catch (error) {
      console.error('[RatingStorage] Failed to get AI insights:', error);
      return { highRated: [], lowRated: [], commonTags: [], feedbackInsights: [] };
    }
  }
  
  // Вспомогательные методы
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  async loadIndex() {
    try {
      const indexData = await fs.readFile(this.indexFile, 'utf-8');
      return JSON.parse(indexData);
    } catch (error) {
      return [];
    }
  }
  
  async updateIndex(rating) {
    try {
      const index = await this.loadIndex();
      
      // Краткая запись для индекса
      const indexRecord = {
        id: rating.id,
        bannerId: rating.bannerId,
        userId: rating.userId,
        rating: rating.rating,
        timestamp: rating.timestamp,
        hasContext: !!rating.context?.template
      };
      
      index.unshift(indexRecord);
      await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
      
    } catch (error) {
      console.error('[RatingStorage] Failed to update index:', error);
    }
  }
  
  calculateNPS(distribution) {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;
    
    const promoters = (distribution[5] + distribution[4]) / total * 100; // 4-5 звезд
    const detractors = (distribution[1] + distribution[2]) / total * 100; // 1-2 звезды
    
    return Math.round(promoters - detractors);
  }
  
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
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }
  
  analyzeFeedback(ratings) {
    const feedback = ratings
      .filter(r => r.feedback && r.feedback.trim())
      .map(r => ({ rating: r.rating, feedback: r.feedback.trim() }));
    
    return {
      totalFeedback: feedback.length,
      avgRatingWithFeedback: feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length || 0,
      samples: feedback.slice(0, 5) // Примеры отзывов
    };
  }
}

// Экспортируем глобальный экземпляр
export const ratingStorage = new RatingStorage();