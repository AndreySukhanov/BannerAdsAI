# 🔧 Техническая интеграция BannerAdsAI

## TL;DR для разработчиков

```javascript
// Перед загрузкой компонента
window.BANNER_USER_ID = 12345;

// Готово! Теперь все работает с вашим userId
```

## 🎯 Что изменилось

- **Личный кабинет без авторизации** ✅
- **Привязка к внешнему userId** ✅  
- **Обратная совместимость** (работает standalone) ✅
- **История и аналитика** привязаны к userId ✅

## 📝 Как это работает

### 1. Система приоритетов ID:
1. `window.BANNER_USER_ID` (для интеграции)
2. `localStorage` (для standalone)  
3. Автогенерация (fallback)

### 2. API изменения:
- Все существующие endpoints работают
- `sessionId` заменен на `userId` внутренне
- История привязана к переданному ID

### 3. React компоненты:
```jsx
// Ваша платформа
<BannerAdsAI userId={user.id} />

// Внутри BannerAdsAI
export default function MainApp({ userId }) {
  // userId автоматически применяется ко всем компонентам
}
```

## ⚡ Быстрая интеграция

### HTML + JavaScript
```html
<script>
  window.BANNER_USER_ID = 12345;
</script>
<script src="/bannerads/dist/index.js"></script>
```

### React
```jsx
import BannerAdsAI from './BannerAdsAI';

<BannerAdsAI userId={user.id} />
```

### Проверка статуса
```javascript
console.log(window.BannerAdsAI.isReady());
// { ready: true, userInfo: { userId: "12345", mode: "integrated" } }
```

## 🔌 Backend интеграция

### API endpoints остались те же:
```
GET  /api/history/:userId
GET  /api/history/:userId/stats  
DELETE /api/history/:userId/clear
```

### Переменные окружения:
```bash
OPENAI_API_KEY=your-key
RECRAFT_API_KEY=your-key
PORT=3006
```

## 🧪 Тестирование

### Проверить интеграцию:
```javascript
// 1. Установить ID
window.BANNER_USER_ID = 'test_user_123';

// 2. Проверить применение
window.BannerAdsAI.isReady();

// 3. Создать баннер и проверить историю
// История должна сохраниться под 'test_user_123'
```

### Debug режим:
```javascript
// Включить подробные логи
localStorage.setItem('BANNER_DEBUG', 'true');

// В консоли будут логи:
// [MainApp] External User ID set: 12345
// [HistoryAPI] Getting history for session: 12345
```

## 🚦 Статусы интеграции

- **integrated** - работаем с внешним userId
- **standalone** - локальный режим (localStorage)

```javascript
const { mode } = window.BannerAdsAI.getUserId();
if (mode === 'integrated') {
    console.log('✅ Интеграция активна');
} else {
    console.log('⚠️ Standalone режим');
}
```

## 🔄 Миграция данных

Если нужно перенести историю из localStorage в новую систему:
```javascript
// Получить старые данные
const oldSessionId = localStorage.getItem('bannerads_session_id');

// API для миграции (нужно реализовать при необходимости)
POST /api/history/migrate
{
  "oldSessionId": "session_123_abc",
  "newUserId": "user_12345"
}
```

## ⚠️ Важные моменты

1. **userId должен быть установлен ДО инициализации React**
2. **Строковые и числовые ID поддерживаются**  
3. **Пустые ID (0, null, undefined) игнорируются**
4. **Данные полностью изолированы по userId**

## 📋 Чеклист интеграции

- [ ] Backend развернут и доступен
- [ ] API ключи настроены (OpenAI + Recraft)
- [ ] `window.BANNER_USER_ID` устанавливается перед загрузкой
- [ ] Frontend компилируется без ошибок
- [ ] История сохраняется под правильным userId
- [ ] Тестирование на разных пользователях

## 🛠 Полезные утилиты

```javascript
// Сменить пользователя
window.BannerAdsAI.setUserId(newUserId);

// Получить информацию о текущем пользователе  
window.BannerAdsAI.getUserId();

// Проверить готовность
window.BannerAdsAI.isReady();

// Версия API
console.log(window.BannerAdsAI.version); // "2.2.0"
```

---

**Время интеграции: ~30 минут** ⏱️  
**Сложность: Низкая** 🟢  
**Зависимости: Только userId** 📦