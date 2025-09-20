// BannerAdsAI Widget Integration
// Этот файл предоставляет простой API для интеграции BannerAdsAI в другие проекты

import { setCurrentUserId, getUserIdInfo } from '@/utils/user-id';

/**
 * Инициализация BannerAdsAI виджета
 * @param {string|number} userId - ID пользователя
 * @param {HTMLElement|string} container - Контейнер для виджета (элемент или селектор)
 * @param {Object} options - Дополнительные опции
 */
export function initBannerWidget(userId, container, options = {}) {
  // Установить ID пользователя
  if (userId !== undefined && userId !== null) {
    setCurrentUserId(userId);
    console.log('[BannerWidget] Initialized with user ID:', userId);
  }

  // Настройки по умолчанию
  const config = {
    apiBaseUrl: options.apiBaseUrl || 'http://localhost:3014',
    theme: options.theme || 'default',
    language: options.language || 'auto',
    ...options
  };

  // Установить API base URL если передан
  if (config.apiBaseUrl) {
    window.BANNER_API_BASE_URL = config.apiBaseUrl;
  }

  console.log('[BannerWidget] Configuration:', {
    userId: getUserIdInfo(),
    config
  });

  return {
    getUserId: () => getUserIdInfo(),
    updateUserId: (newUserId) => setCurrentUserId(newUserId),
    getConfig: () => config
  };
}

/**
 * Быстрая инициализация через глобальную переменную
 * Использование:
 * window.BANNER_USER_ID = 12345;
 * BannerAdsAI.init();
 */
export function quickInit() {
  const userId = window.BANNER_USER_ID;
  
  if (userId === undefined) {
    console.warn('[BannerWidget] Quick init: window.BANNER_USER_ID not found, using localStorage fallback');
  }

  return initBannerWidget(userId);
}

/**
 * Проверка готовности виджета
 */
export function isReady() {
  const userInfo = getUserIdInfo();
  return {
    ready: true,
    userInfo,
    mode: userInfo.mode,
    hasUserId: !!userInfo.userId
  };
}

/**
 * Глобальный API для window.BannerAdsAI
 */
export const BannerAdsAI = {
  init: initBannerWidget,
  quickInit,
  isReady,
  setUserId: setCurrentUserId,
  getUserId: getUserIdInfo,
  version: '2.2.1'
};

// Экспорт в глобальную область для удобства интеграции
if (typeof window !== 'undefined') {
  window.BannerAdsAI = BannerAdsAI;
}