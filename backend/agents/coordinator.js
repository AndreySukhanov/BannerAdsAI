// Coordinator Agent - Main orchestrator for banner generation tasks
import { HeadlineAgent } from './headline-agent.js';
import { ImageAgent } from './image-agent.js';
import { BannerAgent } from './banner-agent.js';
import { WebScrapingAgent } from './webscraping-agent.js';
import { historyStorage } from '../utils/history-storage.js';

export class CoordinatorAgent {
  constructor() {
    this.agents = {
      webscraping: new WebScrapingAgent(),
      headline: new HeadlineAgent(),
      image: new ImageAgent(),
      banner: new BannerAgent()
    };
    
    this.tasks = new Map();
    this.taskId = 0;
  }

  // Main method to generate complete banner from URL
  async generateBanner(request) {
    const taskId = this.createTask(request);
    
    try {
      console.log(`[Coordinator] Starting banner generation task ${taskId}`);
      console.log(`[Coordinator] Request:`, JSON.stringify(request, null, 2));

      // Phase 1: Web scraping and analysis
      console.log(`[Coordinator] Phase 1: Web content analysis`);
      const webContent = await this.agents.webscraping.analyzeUrl(request.url);
      
      // Check if web scraping failed and throw appropriate error
      if (webContent.isFallback && webContent.error) {
        const errorMessage = this.getUserFriendlyErrorMessage(webContent.error);
        const error = new Error(errorMessage);
        error.code = 'SCRAPING_FAILED';
        error.errorType = webContent.error.type;
        error.originalError = webContent.error.message;
        throw error;
      }
      
      // Phase 2: Generate headlines based on content and requirements
      console.log(`[Coordinator] Phase 2: Headline generation`);
      const headlines = await this.agents.headline.generateHeadlines({
        content: webContent,
        style: request.template,
        language: webContent.detectedLanguage || 'ru'
      });

      // Phase 3: Generate image prompts and create images
      console.log(`[Coordinator] Phase 3: Image generation`);
      const images = await this.agents.image.generateImages({
        content: webContent,
        headlines: headlines,
        count: request.uploadedImage ? 2 : 3,
        model: request.imageModel || 'recraftv3'
      });

      // Phase 4: Create final banners by combining images and headlines
      console.log(`[Coordinator] Phase 4: Banner composition`);
      const banners = await this.agents.banner.createBanners({
        headlines: headlines,
        images: images,
        uploadedImage: request.uploadedImage,
        size: request.size,
        template: request.template,
        font: request.font
      });

      const result = {
        taskId,
        headlines,
        images,
        banners,
        webContent: {
          title: webContent.title,
          description: webContent.description,
          language: webContent.detectedLanguage
        }
      };

      this.completeTask(taskId, result);
      console.log(`[Coordinator] Task ${taskId} completed successfully`);
      
      return result;

    } catch (error) {
      console.error(`[Coordinator] Task ${taskId} failed:`, error);
      this.failTask(taskId, error);
      throw error;
    }
  }

  // Generate only headlines
  async generateHeadlines(request) {
    const taskId = this.createTask(request);
    
    try {
      console.log(`[Coordinator] Starting headline generation task ${taskId}`);
      
      const webContent = await this.agents.webscraping.analyzeUrl(request.url);
      
      // Check if web scraping failed and throw appropriate error
      if (webContent.isFallback && webContent.error) {
        const errorMessage = this.getUserFriendlyErrorMessage(webContent.error);
        const error = new Error(errorMessage);
        error.code = 'SCRAPING_FAILED';
        error.errorType = webContent.error.type;
        error.originalError = webContent.error.message;
        throw error;
      }
      
      const headlines = await this.agents.headline.generateHeadlines({
        content: webContent,
        style: request.template,
        language: webContent.detectedLanguage || 'ru'
      });

      const result = { taskId, headlines, webContent };
      this.completeTask(taskId, result);
      
      return result;

    } catch (error) {
      console.error(`[Coordinator] Headline task ${taskId} failed:`, error);
      this.failTask(taskId, error);
      throw error;
    }
  }

  // Generate banner from existing headline
  async generateBannerFromHeadline(request) {
    const taskId = this.createTask(request);
    
    try {
      console.log(`[Coordinator] Starting banner generation from headline task ${taskId}`);
      
      // Use provided web content or scrape again
      let webContent = request.webContent;
      if (!webContent && request.url) {
        webContent = await this.agents.webscraping.analyzeUrl(request.url);
      }

      const images = await this.agents.image.generateImages({
        content: webContent,
        headlines: [request.selectedHeadline],
        count: request.uploadedImage ? 2 : 3,
        model: request.imageModel || 'recraftv3'
      });

      const banners = await this.agents.banner.createBanners({
        headlines: [request.selectedHeadline],
        images: images,
        uploadedImage: request.uploadedImage,
        size: request.size,
        template: request.template,
        font: request.font
      });

      const result = { taskId, banners, images };
      this.completeTask(taskId, result);
      
      // Примечание: Сохранение в историю теперь происходит только при скачивании пользователем
      
      return result;

    } catch (error) {
      console.error(`[Coordinator] Banner from headline task ${taskId} failed:`, error);
      this.failTask(taskId, error);
      throw error;
    }
  }

  // Regenerate headlines with user feedback
  async regenerateHeadlines(request) {
    const taskId = this.createTask(request);
    
    try {
      console.log(`[Coordinator] Starting headlines regeneration task ${taskId}`);
      
      // Get web content if not provided
      let webContent = request.webContent;
      if (!webContent && request.url) {
        webContent = await this.agents.webscraping.analyzeUrl(request.url);
      }
      
      // Generate new headlines with user feedback
      const headlines = await this.agents.headline.regenerateHeadlines({
        webContent,
        template: request.template,
        currentHeadlines: request.currentHeadlines,
        userFeedback: request.userFeedback
      });
      
      const result = { taskId, headlines, webContent };
      this.completeTask(taskId, result);
      
      return result;
      
    } catch (error) {
      console.error(`[Coordinator] Headlines regeneration task ${taskId} failed:`, error);
      this.failTask(taskId, error);
      throw error;
    }
  }
  
  // Regenerate images with user feedback
  async regenerateImages(request) {
    const taskId = this.createTask(request);
    
    try {
      console.log(`[Coordinator] Starting images regeneration task ${taskId}`);
      
      const images = await this.agents.image.regenerateImages({
        content: request.webContent,
        headlines: request.headlines,
        userFeedback: request.userFeedback,
        model: request.imageModel,
        count: request.count
      });
      
      const result = { taskId, images };
      this.completeTask(taskId, result);
      
      return result;
      
    } catch (error) {
      console.error(`[Coordinator] Images regeneration task ${taskId} failed:`, error);
      this.failTask(taskId, error);
      throw error;
    }
  }

  // Сохранить генерацию в историю
  async saveToHistory(data) {
    try {
      await historyStorage.saveGeneration(data);
      console.log(`[Coordinator] Saved task ${data.taskId} to history`);
    } catch (error) {
      console.error(`[Coordinator] Failed to save to history:`, error);
      throw error;
    }
  }

  // Task management
  createTask(request) {
    const taskId = ++this.taskId;
    this.tasks.set(taskId, {
      id: taskId,
      status: 'running',
      request,
      startTime: Date.now(),
      result: null,
      error: null
    });
    return taskId;
  }

  completeTask(taskId, result) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'completed';
      task.result = result;
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
    }
  }

  failTask(taskId, error) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
    }
  }

  getTaskStatus(taskId) {
    return this.tasks.get(taskId);
  }

  // Get agent statistics
  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      runningTasks: tasks.filter(t => t.status === 'running').length,
      averageDuration: tasks
        .filter(t => t.duration)
        .reduce((avg, t, _, arr) => avg + t.duration / arr.length, 0)
    };
  }

  getUserFriendlyErrorMessage(error) {
    const errorMessages = {
      'DNS_ERROR': 'Не удалось найти сайт. Проверьте правильность URL или попробуйте позже.',
      'TIMEOUT': 'Сайт слишком долго отвечает. Попробуйте другую ссылку или повторите позже.',
      'CONNECTION_REFUSED': 'Сайт недоступен. Проверьте URL или попробуйте другой сайт.',
      'FORBIDDEN': 'Доступ к сайту запрещен. Этот сайт блокирует автоматические запросы.',
      'NOT_FOUND': 'Страница не найдена. Проверьте правильность ссылки.',
      'SERVER_ERROR': 'На сайте произошла ошибка сервера. Попробуйте позже.',
      'SSL_ERROR': 'Проблема с безопасным соединением. Проверьте правильность URL.',
      'UNKNOWN_ERROR': 'Не удалось загрузить страницу. Попробуйте другую ссылку.'
    };

    return errorMessages[error.type] || errorMessages['UNKNOWN_ERROR'];
  }
}

// Singleton instance
export const coordinator = new CoordinatorAgent();