// История генераций баннеров
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Структура записи истории генерации
export const GenerationHistorySchema = {
  id: 'string', // UUID записи
  sessionId: 'string', // Идентификатор сессии пользователя  
  timestamp: 'string', // ISO дата создания
  
  // Исходные данные для генерации
  input: {
    url: 'string', // URL анализируемой страницы
    size: 'string', // Размер баннера (300x250, 336x280)
    template: 'string', // Шаблон (blue_white, red_white)
    font: 'string', // Выбранный шрифт
    imageModel: 'string', // Модель генерации изображений
    uploadedImage: 'string|null' // URL загруженного изображения
  },
  
  // Результат генерации
  output: {
    webContent: 'object', // Проанализированный контент сайта
    selectedHeadline: 'string', // Выбранный заголовок
    generatedHeadlines: 'array', // Все сгенерированные заголовки
    banners: 'array', // Массив созданных баннеров
    images: 'array' // Массив фоновых изображений
  },
  
  // Метаданные
  metadata: {
    taskId: 'number', // ID задачи из coordinator
    generationTime: 'number', // Время генерации в секундах
    bannersCount: 'number', // Количество созданных баннеров
    language: 'string', // Определенный язык контента
    status: 'string' // completed, failed, partial
  }
};

export class HistoryStorage {
  constructor() {
    this.historyDir = path.join(__dirname, '..', 'data', 'history');
    this.indexFile = path.join(this.historyDir, 'index.json');
    this.initStorage();
  }
  
  // Инициализация хранилища
  async initStorage() {
    try {
      await fs.mkdir(this.historyDir, { recursive: true });
      
      // Создаем индексный файл если его нет
      try {
        await fs.access(this.indexFile);
      } catch {
        await fs.writeFile(this.indexFile, JSON.stringify([], null, 2));
      }
    } catch (error) {
      console.error('[HistoryStorage] Failed to initialize storage:', error);
    }
  }
  
  // Сохранить запись истории
  async saveGeneration(generationData) {
    try {
      const record = {
        id: this.generateId(),
        sessionId: generationData.sessionId || 'anonymous',
        timestamp: new Date().toISOString(),
        input: generationData.input,
        output: generationData.output,
        metadata: {
          taskId: generationData.taskId,
          generationTime: generationData.generationTime || 0,
          bannersCount: generationData.output?.banners?.length || 0,
          language: generationData.output?.webContent?.language || 'unknown',
          status: 'completed'
        }
      };
      
      // Сохраняем детальные данные в отдельный файл
      const recordFile = path.join(this.historyDir, `${record.id}.json`);
      await fs.writeFile(recordFile, JSON.stringify(record, null, 2));
      
      // Обновляем индекс
      await this.updateIndex(record);
      
      console.log(`[HistoryStorage] Saved generation ${record.id}`);
      return record.id;
      
    } catch (error) {
      console.error('[HistoryStorage] Failed to save generation:', error);
      throw error;
    }
  }
  
  // Получить историю пользователя
  async getUserHistory(sessionId, options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'timestamp', sortOrder = 'desc' } = options;
      
      const index = await this.loadIndex();
      const userRecords = index.filter(record => 
        record.sessionId === sessionId || sessionId === 'all'
      );
      
      // Сортировка
      userRecords.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortOrder === 'desc' ? -comparison : comparison;
      });
      
      // Пагинация
      const startIndex = (page - 1) * limit;
      const paginatedIndexRecords = userRecords.slice(startIndex, startIndex + limit);
      
      // Загружаем полные данные для каждой записи
      const fullRecords = await Promise.all(
        paginatedIndexRecords.map(async (indexRecord) => {
          try {
            const fullRecord = await this.getGeneration(indexRecord.id);
            
            // Добавляем thumbnail изображения из первого баннера для превью
            let previewImage = null;
            if (fullRecord && fullRecord.output && fullRecord.output.banners && fullRecord.output.banners.length > 0) {
              previewImage = fullRecord.output.banners[0].imageUrl;
            }
            
            return {
              ...indexRecord,
              previewImage,
              bannersData: fullRecord?.output?.banners || []
            };
            
          } catch (error) {
            console.warn(`[HistoryStorage] Failed to load full data for ${indexRecord.id}:`, error);
            return {
              ...indexRecord,
              previewImage: null,
              bannersData: []
            };
          }
        })
      );
      
      return {
        records: fullRecords,
        pagination: {
          page,
          limit,
          total: userRecords.length,
          totalPages: Math.ceil(userRecords.length / limit)
        }
      };
      
    } catch (error) {
      console.error('[HistoryStorage] Failed to get user history:', error);
      return { records: [], pagination: { page: 1, limit, total: 0, totalPages: 0 } };
    }
  }
  
  // Получить конкретную запись
  async getGeneration(generationId) {
    try {
      const recordFile = path.join(this.historyDir, `${generationId}.json`);
      const recordData = await fs.readFile(recordFile, 'utf-8');
      return JSON.parse(recordData);
    } catch (error) {
      console.error(`[HistoryStorage] Failed to get generation ${generationId}:`, error);
      return null;
    }
  }
  
  // Удалить запись
  async deleteGeneration(generationId, sessionId) {
    try {
      // Проверяем права доступа
      const record = await this.getGeneration(generationId);
      if (!record || record.sessionId !== sessionId) {
        throw new Error('Generation not found or access denied');
      }
      
      // Удаляем файл записи
      const recordFile = path.join(this.historyDir, `${generationId}.json`);
      await fs.unlink(recordFile);
      
      // Обновляем индекс
      await this.removeFromIndex(generationId);
      
      console.log(`[HistoryStorage] Deleted generation ${generationId}`);
      return true;
      
    } catch (error) {
      console.error(`[HistoryStorage] Failed to delete generation ${generationId}:`, error);
      throw error;
    }
  }
  
  // Получить статистику
  async getStats(sessionId) {
    try {
      const index = await this.loadIndex();
      const userRecords = index.filter(record => 
        record.sessionId === sessionId || sessionId === 'all'
      );
      
      // Загружаем полные данные для анализа
      const fullRecords = await Promise.all(
        userRecords.map(async (indexRecord) => {
          try {
            return await this.getGeneration(indexRecord.id);
          } catch (error) {
            console.warn(`[HistoryStorage] Could not load full record ${indexRecord.id}`);
            return null;
          }
        })
      );
      
      const validRecords = fullRecords.filter(Boolean);
      
      // Анализируем шрифты
      const fontUsage = {};
      const siteUsage = {};
      const modelUsage = {};
      
      validRecords.forEach(record => {
        // Шрифты
        const font = record.input?.font || 'неизвестно';
        fontUsage[font] = (fontUsage[font] || 0) + 1;
        
        // Сайты (домены)
        try {
          const domain = new URL(record.input?.url || '').hostname;
          siteUsage[domain] = (siteUsage[domain] || 0) + 1;
        } catch (e) {
          siteUsage['неизвестно'] = (siteUsage['неизвестно'] || 0) + 1;
        }
        
        // Модели изображений
        const model = record.input?.imageModel || 'неизвестно';
        modelUsage[model] = (modelUsage[model] || 0) + 1;
      });
      
      // Сортируем по популярности
      const sortByUsage = (obj) => Object.entries(obj)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Топ 5
      
      return {
        totalGenerations: userRecords.length,
        fonts: sortByUsage(fontUsage),
        sites: sortByUsage(siteUsage),
        models: sortByUsage(modelUsage)
      };
      
    } catch (error) {
      console.error('[HistoryStorage] Failed to get stats:', error);
      return {
        totalGenerations: 0,
        fonts: [],
        sites: [],
        models: []
      };
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
      console.error('[HistoryStorage] Failed to load index:', error);
      return [];
    }
  }
  
  async updateIndex(record) {
    try {
      const index = await this.loadIndex();
      
      // Создаем краткую запись для индекса
      const indexRecord = {
        id: record.id,
        sessionId: record.sessionId,
        timestamp: record.timestamp,
        url: record.input.url,
        template: record.input.template,
        size: record.input.size,
        selectedHeadline: record.output.selectedHeadline?.substring(0, 50) + '...',
        bannersCount: record.metadata.bannersCount,
        language: record.metadata.language,
        status: record.metadata.status
      };
      
      // Добавляем в начало (последние записи сверху)
      index.unshift(indexRecord);
      
      // Ограничиваем размер индекса (последние 100 записей)
      if (index.length > 100) {
        const removedRecords = index.splice(100);
        // Удаляем старые файлы записей
        for (const oldRecord of removedRecords) {
          try {
            const oldFile = path.join(this.historyDir, `${oldRecord.id}.json`);
            await fs.unlink(oldFile);
          } catch (error) {
            console.warn(`[HistoryStorage] Could not delete old record ${oldRecord.id}:`, error);
          }
        }
      }
      
      await fs.writeFile(this.indexFile, JSON.stringify(index, null, 2));
      
    } catch (error) {
      console.error('[HistoryStorage] Failed to update index:', error);
    }
  }
  
  async removeFromIndex(generationId) {
    try {
      const index = await this.loadIndex();
      const filteredIndex = index.filter(record => record.id !== generationId);
      await fs.writeFile(this.indexFile, JSON.stringify(filteredIndex, null, 2));
    } catch (error) {
      console.error('[HistoryStorage] Failed to remove from index:', error);
    }
  }

  // Очистить всю историю пользователя
  async clearUserHistory(sessionId) {
    try {
      const index = await this.loadIndex();
      const userRecords = index.filter(record => record.sessionId === sessionId);
      
      // Удаляем файлы генераций пользователя
      for (const record of userRecords) {
        try {
          const recordFile = path.join(this.historyDir, `${record.id}.json`);
          await fs.unlink(recordFile);
        } catch (error) {
          console.warn(`[HistoryStorage] Could not delete record file ${record.id}:`, error);
        }
      }
      
      // Обновляем индекс, убирая записи пользователя
      const filteredIndex = index.filter(record => record.sessionId !== sessionId);
      await fs.writeFile(this.indexFile, JSON.stringify(filteredIndex, null, 2));
      
      console.log(`[HistoryStorage] Cleared ${userRecords.length} records for session ${sessionId}`);
      return userRecords.length;
      
    } catch (error) {
      console.error('[HistoryStorage] Failed to clear user history:', error);
      throw error;
    }
  }
}

// Экспортируем глобальный экземпляр
export const historyStorage = new HistoryStorage();