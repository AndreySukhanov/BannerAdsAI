import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем директорию для кеша
const CACHE_DIR = path.join(__dirname, '../../data/brand-cache');
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

// Инициализация кеша
function initializeCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      console.log('✅ Кеш брендинга инициализирован:', CACHE_DIR);
    }
  } catch (error) {
    console.error('❌ Ошибка инициализации кеша:', error);
  }
}

// Генерирует ключ для кеша на основе URL
function generateCacheKey(url) {
  try {
    // Нормализуем URL (убираем параметры, якори, trailing slash)
    const normalizedUrl = new URL(url);
    const baseUrl = `${normalizedUrl.protocol}//${normalizedUrl.hostname}${normalizedUrl.pathname.replace(/\/$/, '')}`;
    
    // Создаем SHA-256 хеш
    return crypto.createHash('sha256').update(baseUrl).digest('hex');
  } catch (error) {
    console.error('❌ Ошибка генерации ключа кеша:', error);
    return crypto.createHash('sha256').update(url).digest('hex');
  }
}

// Получает путь к файлу кеша
function getCacheFilePath(cacheKey) {
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}

// Проверяет, истек ли кеш
function isCacheExpired(timestamp) {
  return (Date.now() - timestamp) > CACHE_EXPIRY;
}

// Сохраняет данные в кеш
export function setBrandingCache(url, brandingData) {
  try {
    initializeCache();
    
    const cacheKey = generateCacheKey(url);
    const cacheFilePath = getCacheFilePath(cacheKey);
    
    const cacheEntry = {
      url: url,
      data: brandingData,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_EXPIRY
    };
    
    fs.writeFileSync(cacheFilePath, JSON.stringify(cacheEntry, null, 2), 'utf8');
    
    console.log(`💾 Брендинг сохранен в кеш: ${url} -> ${cacheKey}`);
    return true;
    
  } catch (error) {
    console.error('❌ Ошибка сохранения в кеш:', error);
    return false;
  }
}

// Получает данные из кеша
export function getBrandingCache(url) {
  try {
    const cacheKey = generateCacheKey(url);
    const cacheFilePath = getCacheFilePath(cacheKey);
    
    // Проверяем существование файла
    if (!fs.existsSync(cacheFilePath)) {
      console.log(`🔍 Кеш не найден для: ${url}`);
      return null;
    }
    
    // Читаем файл кеша
    const cacheData = fs.readFileSync(cacheFilePath, 'utf8');
    const cacheEntry = JSON.parse(cacheData);
    
    // Проверяем срок действия
    if (isCacheExpired(cacheEntry.timestamp)) {
      console.log(`⏰ Кеш истек для: ${url}`);
      // Удаляем устаревший кеш
      try {
        fs.unlinkSync(cacheFilePath);
      } catch (unlinkError) {
        console.error('❌ Ошибка удаления устаревшего кеша:', unlinkError);
      }
      return null;
    }
    
    console.log(`✅ Кеш найден для: ${url} (возраст: ${Math.round((Date.now() - cacheEntry.timestamp) / 1000 / 60)} мин)`);
    return cacheEntry.data;
    
  } catch (error) {
    console.error('❌ Ошибка чтения кеша:', error);
    return null;
  }
}

// Очищает весь кеш
export function clearBrandingCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { cleared: 0, message: 'Кеш пуст' };
    }
    
    const files = fs.readdirSync(CACHE_DIR);
    let cleared = 0;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          fs.unlinkSync(path.join(CACHE_DIR, file));
          cleared++;
        } catch (unlinkError) {
          console.error(`❌ Ошибка удаления файла ${file}:`, unlinkError);
        }
      }
    }
    
    console.log(`🧹 Очищен кеш брендинга: ${cleared} файлов`);
    return { cleared, message: `Удалено ${cleared} файлов` };
    
  } catch (error) {
    console.error('❌ Ошибка очистки кеша:', error);
    return { cleared: 0, error: error.message };
  }
}

// Очищает устаревшие записи кеша
export function cleanupExpiredCache() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { removed: 0, total: 0 };
    }
    
    const files = fs.readdirSync(CACHE_DIR);
    let removed = 0;
    let total = 0;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        total++;
        try {
          const cacheFilePath = path.join(CACHE_DIR, file);
          const cacheData = fs.readFileSync(cacheFilePath, 'utf8');
          const cacheEntry = JSON.parse(cacheData);
          
          if (isCacheExpired(cacheEntry.timestamp)) {
            fs.unlinkSync(cacheFilePath);
            removed++;
          }
        } catch (fileError) {
          console.error(`❌ Ошибка обработки файла ${file}:`, fileError);
          // Удаляем поврежденный файл
          try {
            fs.unlinkSync(path.join(CACHE_DIR, file));
            removed++;
          } catch (unlinkError) {
            console.error(`❌ Ошибка удаления поврежденного файла ${file}:`, unlinkError);
          }
        }
      }
    }
    
    if (removed > 0) {
      console.log(`🧹 Очистка кеша: удалено ${removed} из ${total} файлов`);
    }
    
    return { removed, total };
    
  } catch (error) {
    console.error('❌ Ошибка очистки устаревшего кеша:', error);
    return { removed: 0, total: 0, error: error.message };
  }
}

// Получает статистику кеша
export function getCacheStats() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return {
        totalEntries: 0,
        validEntries: 0,
        expiredEntries: 0,
        cacheSize: 0,
        oldestEntry: null,
        newestEntry: null
      };
    }
    
    const files = fs.readdirSync(CACHE_DIR);
    let totalEntries = 0;
    let validEntries = 0;
    let expiredEntries = 0;
    let cacheSize = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const cacheFilePath = path.join(CACHE_DIR, file);
          const stats = fs.statSync(cacheFilePath);
          cacheSize += stats.size;
          
          const cacheData = fs.readFileSync(cacheFilePath, 'utf8');
          const cacheEntry = JSON.parse(cacheData);
          
          totalEntries++;
          
          if (isCacheExpired(cacheEntry.timestamp)) {
            expiredEntries++;
          } else {
            validEntries++;
          }
          
          if (cacheEntry.timestamp < oldestTimestamp) {
            oldestTimestamp = cacheEntry.timestamp;
          }
          
          if (cacheEntry.timestamp > newestTimestamp) {
            newestTimestamp = cacheEntry.timestamp;
          }
          
        } catch (fileError) {
          console.error(`❌ Ошибка обработки файла статистики ${file}:`, fileError);
        }
      }
    }
    
    return {
      totalEntries,
      validEntries,
      expiredEntries,
      cacheSize: Math.round(cacheSize / 1024), // в KB
      oldestEntry: totalEntries > 0 ? new Date(oldestTimestamp).toISOString() : null,
      newestEntry: totalEntries > 0 ? new Date(newestTimestamp).toISOString() : null
    };
    
  } catch (error) {
    console.error('❌ Ошибка получения статистики кеша:', error);
    return { error: error.message };
  }
}

// Автоматическая очистка при запуске
if (process.env.NODE_ENV !== 'test') {
  setTimeout(() => {
    cleanupExpiredCache();
  }, 1000); // Очищаем через секунду после запуска
}

// Периодическая очистка каждые 6 часов
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    cleanupExpiredCache();
  }, 6 * 60 * 60 * 1000); // 6 часов
}