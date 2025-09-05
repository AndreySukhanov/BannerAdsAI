// API маршруты для истории генераций
import { historyStorage } from '../utils/history-storage.js';

// Получить историю пользователя
export async function getUserHistory(req, res) {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = req.query;
    
    console.log(`[History API] Getting history for session: ${sessionId}`);
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId parameter'
      });
    }
    
    const historyData = await historyStorage.getUserHistory(sessionId, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });
    
    res.json({
      success: true,
      data: historyData.records,
      pagination: historyData.pagination
    });
    
  } catch (error) {
    console.error('[History API] Get history error:', error);
    res.status(500).json({
      error: 'Failed to get history',
      message: error.message
    });
  }
}

// Получить конкретную запись истории
export async function getGeneration(req, res) {
  try {
    const { generationId } = req.params;
    const { sessionId } = req.query;
    
    console.log(`[History API] Getting generation: ${generationId}`);
    
    if (!generationId) {
      return res.status(400).json({
        error: 'Missing generationId parameter'
      });
    }
    
    const generation = await historyStorage.getGeneration(generationId);
    
    if (!generation) {
      return res.status(404).json({
        error: 'Generation not found'
      });
    }
    
    // Проверяем права доступа
    if (sessionId && generation.sessionId !== sessionId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: generation
    });
    
  } catch (error) {
    console.error('[History API] Get generation error:', error);
    res.status(500).json({
      error: 'Failed to get generation',
      message: error.message
    });
  }
}

// Сохранить новую запись истории
export async function saveGeneration(req, res) {
  try {
    const generationData = req.body;
    
    console.log('[History API] Saving new generation');
    
    if (!generationData.input || !generationData.output) {
      return res.status(400).json({
        error: 'Missing required fields: input, output'
      });
    }
    
    // Добавляем sessionId из заголовков или query если не указан
    if (!generationData.sessionId) {
      generationData.sessionId = req.headers['x-session-id'] || req.query.sessionId || 'anonymous';
    }
    
    // Добавляем время генерации
    if (!generationData.generationTime && req.body.startTime) {
      generationData.generationTime = Math.round((Date.now() - req.body.startTime) / 1000);
    }
    
    const generationId = await historyStorage.saveGeneration(generationData);
    
    res.json({
      success: true,
      generationId,
      message: 'Generation saved successfully'
    });
    
  } catch (error) {
    console.error('[History API] Save generation error:', error);
    res.status(500).json({
      error: 'Failed to save generation',
      message: error.message
    });
  }
}

// Удалить запись из истории
export async function deleteGeneration(req, res) {
  try {
    const { generationId } = req.params;
    const { sessionId } = req.body;
    
    console.log(`[History API] Deleting generation: ${generationId}`);
    
    if (!generationId || !sessionId) {
      return res.status(400).json({
        error: 'Missing required parameters: generationId, sessionId'
      });
    }
    
    await historyStorage.deleteGeneration(generationId, sessionId);
    
    res.json({
      success: true,
      message: 'Generation deleted successfully'
    });
    
  } catch (error) {
    console.error('[History API] Delete generation error:', error);
    
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      return res.status(404).json({
        error: 'Generation not found or access denied'
      });
    }
    
    res.status(500).json({
      error: 'Failed to delete generation',
      message: error.message
    });
  }
}

// Сохранить скачанный баннер в историю
export async function saveDownloadedBanner(req, res) {
  try {
    const { sessionId, bannerData, generationContext } = req.body;
    
    console.log(`[History API] Saving downloaded banner for session: ${sessionId}`);
    
    if (!sessionId || !bannerData || !generationContext) {
      return res.status(400).json({
        error: 'Missing required parameters',
        required: ['sessionId', 'bannerData', 'generationContext']
      });
    }
    
    // Создаем запись истории для скачанного баннера
    const historyData = {
      sessionId,
      taskId: generationContext.taskId,
      input: generationContext.input,
      output: {
        webContent: generationContext.output.webContent,
        selectedHeadline: generationContext.output.selectedHeadline,
        banners: [bannerData], // Сохраняем только скачанный баннер
        images: [{ url: bannerData.imageUrl }]
      }
    };
    
    const generationId = await historyStorage.saveGeneration(historyData);
    
    res.json({
      success: true,
      generationId,
      message: 'Downloaded banner saved to history'
    });
    
  } catch (error) {
    console.error('[History API] Save downloaded banner error:', error);
    res.status(500).json({
      error: 'Failed to save downloaded banner',
      message: error.message
    });
  }
}

// Очистить всю историю пользователя
export async function clearUserHistory(req, res) {
  try {
    const { sessionId } = req.params;
    
    console.log(`[History API] Clearing all history for session: ${sessionId}`);
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId parameter'
      });
    }
    
    const clearedCount = await historyStorage.clearUserHistory(sessionId);
    
    res.json({
      success: true,
      clearedCount,
      message: `Cleared ${clearedCount} records from history`
    });
    
  } catch (error) {
    console.error('[History API] Clear history error:', error);
    res.status(500).json({
      error: 'Failed to clear history',
      message: error.message
    });
  }
}

// Получить статистику пользователя
export async function getUserStats(req, res) {
  try {
    const { sessionId } = req.params;
    
    console.log(`[History API] Getting stats for session: ${sessionId}`);
    
    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing sessionId parameter'
      });
    }
    
    const stats = await historyStorage.getStats(sessionId);
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('[History API] Get stats error:', error);
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message
    });
  }
}

// Воспроизвести генерацию (загрузить настройки для повторного использования)
export async function reproduceGeneration(req, res) {
  try {
    const { generationId } = req.params;
    const { sessionId } = req.query;
    
    console.log(`[History API] Reproducing generation: ${generationId}`);
    
    const generation = await historyStorage.getGeneration(generationId);
    
    if (!generation) {
      return res.status(404).json({
        error: 'Generation not found'
      });
    }
    
    // Проверяем права доступа
    if (sessionId && generation.sessionId !== sessionId) {
      return res.status(403).json({
        error: 'Access denied'
      });
    }
    
    // Возвращаем input данные и оригинальные баннеры для воспроизведения
    const reproductionData = {
      url: generation.input.url,
      size: generation.input.size,
      template: generation.input.template,
      font: generation.input.font,
      imageModel: generation.input.imageModel,
      uploadedImage: generation.input.uploadedImage,
      selectedHeadline: generation.output.selectedHeadline,
      // Оригинальные баннеры для отображения на этапе 5
      originalBanners: generation.output.banners || generation.output.bannersData || [],
      // Дополнительные данные для контекста
      originalId: generation.id,
      originalTimestamp: generation.timestamp
    };
    
    res.json({
      success: true,
      data: reproductionData,
      message: 'Generation data prepared for reproduction'
    });
    
  } catch (error) {
    console.error('[History API] Reproduce generation error:', error);
    res.status(500).json({
      error: 'Failed to reproduce generation',
      message: error.message
    });
  }
}

// Поиск в истории
export async function searchHistory(req, res) {
  try {
    const { sessionId } = req.params;
    const { query, type = 'headline', page = 1, limit = 20 } = req.query;
    
    console.log(`[History API] Searching in history: "${query}" for session: ${sessionId}`);
    
    if (!sessionId || !query) {
      return res.status(400).json({
        error: 'Missing required parameters: sessionId, query'
      });
    }
    
    // Получаем всю историю пользователя
    const historyData = await historyStorage.getUserHistory(sessionId, {
      page: 1,
      limit: 1000 // Большой лимит для поиска
    });
    
    // Фильтруем по поисковому запросу
    const searchResults = historyData.records.filter(record => {
      const searchText = query.toLowerCase();
      
      switch (type) {
        case 'headline':
          return record.selectedHeadline && record.selectedHeadline.toLowerCase().includes(searchText);
        case 'url':
          return record.url && record.url.toLowerCase().includes(searchText);
        case 'template':
          return record.template && record.template.toLowerCase().includes(searchText);
        default:
          // Поиск везде
          return (
            (record.selectedHeadline && record.selectedHeadline.toLowerCase().includes(searchText)) ||
            (record.url && record.url.toLowerCase().includes(searchText)) ||
            (record.template && record.template.toLowerCase().includes(searchText))
          );
      }
    });
    
    // Применяем пагинацию к результатам
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedResults = searchResults.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedResults,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: searchResults.length,
        totalPages: Math.ceil(searchResults.length / parseInt(limit))
      },
      query,
      type
    });
    
  } catch (error) {
    console.error('[History API] Search history error:', error);
    res.status(500).json({
      error: 'Failed to search history',
      message: error.message
    });
  }
}