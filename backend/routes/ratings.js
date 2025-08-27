// API маршруты для системы рейтингов
import { ratingStorage } from '../utils/rating-storage.js';

// Сохранить рейтинг баннера
export async function submitRating(req, res) {
  try {
    const ratingData = req.body;
    
    console.log('[Rating API] Submitting rating:', {
      bannerId: ratingData.bannerId,
      userId: ratingData.userId,
      rating: ratingData.rating
    });
    
    // Валидация обязательных полей
    if (!ratingData.bannerId || !ratingData.userId || !ratingData.rating) {
      return res.status(400).json({
        error: 'Missing required fields: bannerId, userId, rating'
      });
    }
    
    // Валидация рейтинга
    const rating = parseInt(ratingData.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be a number between 1 and 5'
      });
    }
    
    const ratingId = await ratingStorage.saveRating({
      ...ratingData,
      rating
    });
    
    res.json({
      success: true,
      ratingId,
      message: 'Rating saved successfully'
    });
    
  } catch (error) {
    console.error('[Rating API] Submit rating error:', error);
    res.status(500).json({
      error: 'Failed to save rating',
      message: error.message
    });
  }
}

// Получить рейтинги пользователя
export async function getUserRatings(req, res) {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;
    
    console.log(`[Rating API] Getting ratings for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter'
      });
    }
    
    const ratingsData = await ratingStorage.getUserRatings(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      data: ratingsData.ratings,
      pagination: ratingsData.pagination
    });
    
  } catch (error) {
    console.error('[Rating API] Get user ratings error:', error);
    res.status(500).json({
      error: 'Failed to get user ratings',
      message: error.message
    });
  }
}

// Получить статистику рейтингов пользователя
export async function getUserRatingStats(req, res) {
  try {
    const { userId } = req.params;
    
    console.log(`[Rating API] Getting rating stats for user: ${userId}`);
    
    if (!userId) {
      return res.status(400).json({
        error: 'Missing userId parameter'
      });
    }
    
    const stats = await ratingStorage.getUserRatingStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('[Rating API] Get user rating stats error:', error);
    res.status(500).json({
      error: 'Failed to get user rating stats',
      message: error.message
    });
  }
}

// Получить рейтинг конкретного баннера
export async function getBannerRating(req, res) {
  try {
    const { bannerId } = req.params;
    const { userId } = req.query; // Для проверки прав доступа
    
    console.log(`[Rating API] Getting banner rating: ${bannerId}`);
    
    if (!bannerId) {
      return res.status(400).json({
        error: 'Missing bannerId parameter'
      });
    }
    
    const bannerRating = await ratingStorage.getBannerRating(bannerId);
    
    if (!bannerRating) {
      return res.status(404).json({
        error: 'Banner rating not found'
      });
    }
    
    res.json({
      success: true,
      data: bannerRating
    });
    
  } catch (error) {
    console.error('[Rating API] Get banner rating error:', error);
    res.status(500).json({
      error: 'Failed to get banner rating',
      message: error.message
    });
  }
}

// Получить конкретный рейтинг
export async function getRating(req, res) {
  try {
    const { ratingId } = req.params;
    const { userId } = req.query;
    
    console.log(`[Rating API] Getting rating: ${ratingId}`);
    
    const rating = await ratingStorage.getRating(ratingId);
    
    if (!rating) {
      return res.status(404).json({
        error: 'Rating not found'
      });
    }
    
    // Проверяем права доступа
    if (userId && rating.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: rating
    });
    
  } catch (error) {
    console.error('[Rating API] Get rating error:', error);
    res.status(500).json({
      error: 'Failed to get rating',
      message: error.message
    });
  }
}

// Получить инсайты для AI (администраторский эндпоинт)
export async function getAIInsights(req, res) {
  try {
    const { 
      minRating = 1, 
      maxRating = 5, 
      template, 
      font, 
      imageModel,
      limit = 100 
    } = req.query;
    
    console.log('[Rating API] Getting AI insights with filters:', {
      minRating, maxRating, template, font, imageModel
    });
    
    const insights = await ratingStorage.getAIInsights({
      minRating: parseInt(minRating),
      maxRating: parseInt(maxRating),
      template,
      font,
      imageModel
    });
    
    res.json({
      success: true,
      data: {
        ...insights,
        summary: {
          highRatedCount: insights.highRated.length,
          lowRatedCount: insights.lowRated.length,
          topTags: insights.commonTags.slice(0, 5),
          feedbackSamples: insights.feedbackInsights.samples
        }
      }
    });
    
  } catch (error) {
    console.error('[Rating API] Get AI insights error:', error);
    res.status(500).json({
      error: 'Failed to get AI insights',
      message: error.message
    });
  }
}

// Получить общую статистику системы (для админов)
export async function getSystemRatingStats(req, res) {
  try {
    console.log('[Rating API] Getting system rating stats');
    
    // Получаем статистику для всех пользователей
    const globalStats = await ratingStorage.getUserRatingStats('all');
    
    // Дополнительная системная аналитика
    const insights = await ratingStorage.getAIInsights({ minRating: 1, maxRating: 5 });
    
    res.json({
      success: true,
      data: {
        global: globalStats,
        insights: {
          totalHighRated: insights.highRated.length,
          totalLowRated: insights.lowRated.length,
          topFeedbackTags: insights.commonTags.slice(0, 10),
          recentFeedback: insights.feedbackInsights.samples
        }
      }
    });
    
  } catch (error) {
    console.error('[Rating API] Get system stats error:', error);
    res.status(500).json({
      error: 'Failed to get system stats',
      message: error.message
    });
  }
}

// Обновить рейтинг (если пользователь хочет изменить свою оценку)
export async function updateRating(req, res) {
  try {
    const { ratingId } = req.params;
    const { userId, rating, feedback, tags } = req.body;
    
    console.log(`[Rating API] Updating rating: ${ratingId}`);
    
    // Получаем существующий рейтинг
    const existingRating = await ratingStorage.getRating(ratingId);
    
    if (!existingRating) {
      return res.status(404).json({
        error: 'Rating not found'
      });
    }
    
    // Проверяем права доступа
    if (existingRating.userId !== userId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    // Валидация нового рейтинга
    const newRating = parseInt(rating);
    if (isNaN(newRating) || newRating < 1 || newRating > 5) {
      return res.status(400).json({
        error: 'Rating must be a number between 1 and 5'
      });
    }
    
    // Создаем обновленную запись (проще создать новую, чем обновлять)
    const updatedRatingId = await ratingStorage.saveRating({
      bannerId: existingRating.bannerId,
      userId: existingRating.userId,
      rating: newRating,
      feedback: feedback || existingRating.feedback,
      tags: tags || existingRating.tags,
      context: existingRating.context
    });
    
    res.json({
      success: true,
      ratingId: updatedRatingId,
      message: 'Rating updated successfully'
    });
    
  } catch (error) {
    console.error('[Rating API] Update rating error:', error);
    res.status(500).json({
      error: 'Failed to update rating',
      message: error.message
    });
  }
}