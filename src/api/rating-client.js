// Rating API Client
import { getCurrentUserId } from '@/utils/user-id';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3014';

class RatingAPI {
  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/ratings`;
  }

  /**
   * Отправить рейтинг баннера
   */
  async submitRating(ratingData) {
    try {
      const userId = getCurrentUserId();
      
      const payload = {
        bannerId: ratingData.bannerId,
        userId,
        rating: ratingData.rating,
        feedback: ratingData.feedback || '',
        tags: ratingData.tags || [],
        context: ratingData.context || {}
      };

      console.log('[RatingAPI] Submitting rating:', {
        bannerId: payload.bannerId,
        userId: payload.userId,
        rating: payload.rating
      });

      const response = await fetch(`${this.baseUrl}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('[RatingAPI] Submit rating error:', error);
      throw error;
    }
  }

  /**
   * Получить рейтинги пользователя
   */
  async getUserRatings(options = {}) {
    try {
      const userId = getCurrentUserId();
      const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = options;
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder
      });

      const response = await fetch(`${this.baseUrl}/user/${userId}?${queryParams}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('[RatingAPI] Get user ratings error:', error);
      throw error;
    }
  }

  /**
   * Получить статистику рейтингов пользователя
   */
  async getUserRatingStats() {
    try {
      const userId = getCurrentUserId();
      
      const response = await fetch(`${this.baseUrl}/user/${userId}/stats`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('[RatingAPI] Get user rating stats error:', error);
      throw error;
    }
  }

  /**
   * Получить рейтинг конкретного баннера
   */
  async getBannerRating(bannerId) {
    try {
      const userId = getCurrentUserId();
      const queryParams = new URLSearchParams({ userId });
      
      const response = await fetch(`${this.baseUrl}/banner/${bannerId}?${queryParams}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('[RatingAPI] Get banner rating error:', error);
      throw error;
    }
  }

  /**
   * Получить конкретный рейтинг
   */
  async getRating(ratingId) {
    try {
      const userId = getCurrentUserId();
      const queryParams = new URLSearchParams({ userId });
      
      const response = await fetch(`${this.baseUrl}/${ratingId}?${queryParams}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('[RatingAPI] Get rating error:', error);
      throw error;
    }
  }

  /**
   * Обновить рейтинг
   */
  async updateRating(ratingId, updateData) {
    try {
      const userId = getCurrentUserId();
      
      const payload = {
        userId,
        rating: updateData.rating,
        feedback: updateData.feedback || '',
        tags: updateData.tags || []
      };

      const response = await fetch(`${this.baseUrl}/${ratingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('[RatingAPI] Update rating error:', error);
      throw error;
    }
  }

  /**
   * Получить AI инсайты (админ функция)
   */
  async getAIInsights(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.minRating !== undefined) queryParams.set('minRating', filters.minRating.toString());
      if (filters.maxRating !== undefined) queryParams.set('maxRating', filters.maxRating.toString());
      if (filters.template) queryParams.set('template', filters.template);
      if (filters.font) queryParams.set('font', filters.font);
      if (filters.imageModel) queryParams.set('imageModel', filters.imageModel);
      if (filters.limit) queryParams.set('limit', filters.limit.toString());
      
      const response = await fetch(`${this.baseUrl}/insights/ai?${queryParams}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('[RatingAPI] Get AI insights error:', error);
      throw error;
    }
  }
}

// Экспортируем глобальный экземпляр
export const ratingAPI = new RatingAPI();