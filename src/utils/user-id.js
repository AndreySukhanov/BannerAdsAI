// Утилита для управления ID пользователя
// Поддерживает как внешнее задание ID (для интеграции), так и localStorage (для standalone)

/**
 * Получить текущий ID пользователя
 * Приоритет:
 * 1. window.BANNER_USER_ID (задается внешней платформой)
 * 2. localStorage (для standalone режима)
 * 3. Генерация нового ID
 */
export function getCurrentUserId() {
  // 1. Проверяем глобальную переменную (приоритет для интеграции)
  if (window.BANNER_USER_ID !== undefined) {
    return String(window.BANNER_USER_ID);
  }
  
  // 2. Проверяем localStorage (для standalone)
  let storedId = localStorage.getItem('bannerads_session_id');
  if (storedId) {
    return storedId;
  }
  
  // 3. Генерируем новый ID только в standalone режиме
  storedId = generateSessionId();
  localStorage.setItem('bannerads_session_id', storedId);
  return storedId;
}

/**
 * Установить ID пользователя (для программного управления)
 */
export function setCurrentUserId(userId) {
  if (userId !== undefined && userId !== null) {
    window.BANNER_USER_ID = String(userId);
    return String(userId);
  }
  return getCurrentUserId();
}

/**
 * Проверить, работаем ли мы в интегрированном режиме
 */
export function isIntegratedMode() {
  return window.BANNER_USER_ID !== undefined;
}

/**
 * Генерация ID сессии для standalone режима
 */
function generateSessionId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${randomStr}`;
}

/**
 * Очистить ID (для тестирования)
 */
export function clearUserId() {
  delete window.BANNER_USER_ID;
  localStorage.removeItem('bannerads_session_id');
}

/**
 * Получить информацию о текущем режиме
 */
export function getUserIdInfo() {
  const currentId = getCurrentUserId();
  const mode = isIntegratedMode() ? 'integrated' : 'standalone';
  
  return {
    userId: currentId,
    mode,
    source: isIntegratedMode() ? 'window.BANNER_USER_ID' : 'localStorage'
  };
}

// Экспорт конфигурации для совместимости
export const USER_ID_CONFIG = {
  globalVariable: 'BANNER_USER_ID',
  localStorageKey: 'bannerads_session_id',
  version: '1.0.0'
};