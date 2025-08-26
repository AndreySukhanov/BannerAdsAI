# 🔗 Руководство по интеграции BannerAdsAI

Это руководство описывает, как интегрировать BannerAdsAI в существующую платформу без системы авторизации, используя внешние идентификаторы пользователей.

## 📋 Обзор интеграции

BannerAdsAI теперь поддерживает **бесавторизационную интеграцию** - личный кабинет без авторизации, привязанный к внешнему идентификатору пользователя.

### Принцип работы:
1. Ваша платформа передает `userId` в компонент BannerAdsAI
2. Все данные пользователя (история, аналитика) привязываются к этому ID
3. Никакой авторизации внутри BannerAdsAI не требуется

## 🚀 Быстрый старт

### Вариант 1: Глобальная переменная (рекомендуется)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Ваша платформа</title>
</head>
<body>
    <div id="banner-container"></div>
    
    <script>
        // Задайте ID пользователя ДО загрузки BannerAdsAI
        window.BANNER_USER_ID = 12345; // Любой уникальный ID
    </script>
    
    <!-- Подключите скомпилированный BannerAdsAI -->
    <script src="/path/to/bannerads/dist/assets/index.js"></script>
</body>
</html>
```

### Вариант 2: React-интеграция

```jsx
import BannerAdsAI from '@/components/BannerAdsAI';

function UserBannerPage({ user }) {
    return (
        <div className="user-page">
            <h1>Создание баннеров для {user.name}</h1>
            
            {/* Передаем ID пользователя как проп */}
            <BannerAdsAI userId={user.id} />
        </div>
    );
}
```

### Вариант 3: VueJS-интеграция

#### Iframe подход (рекомендуется):
```vue
<template>
  <div class="banner-generator">
    <h2>Генератор баннеров для {{ user.name }}</h2>
    
    <iframe
      ref="bannerFrame"
      :src="bannerUrl"
      width="100%"
      height="800px"
      frameborder="0"
      @load="onFrameLoad"
    />
  </div>
</template>

<script>
export default {
  props: ['user'],
  
  computed: {
    bannerUrl() {
      return `/bannerads/index.html?userId=${this.user.id}`;
    }
  },
  
  mounted() {
    window.BANNER_USER_ID = this.user.id;
  },
  
  methods: {
    onFrameLoad() {
      const iframe = this.$refs.bannerFrame;
      iframe.contentWindow.BANNER_USER_ID = this.user.id;
    }
  }
}
</script>
```

#### Модальное окно:
```vue
<template>
  <div>
    <button @click="openBannerGenerator" class="btn-primary">
      Создать баннер
    </button>
    
    <el-dialog
      v-model="showBannerDialog"
      title="Генератор баннеров"
      width="90%"
    >
      <iframe
        v-if="showBannerDialog"
        src="/bannerads/index.html"
        width="100%"
        height="700px"
        frameborder="0"
      />
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      showBannerDialog: false
    }
  },
  
  props: ['user'],
  
  methods: {
    openBannerGenerator() {
      window.BANNER_USER_ID = this.user.id;
      this.showBannerDialog = true;
    },
    
    closeBannerGenerator() {
      this.showBannerDialog = false;
      delete window.BANNER_USER_ID;
    }
  }
}
</script>
```

#### Vue Plugin для удобства:
```javascript
// plugins/bannerads.js
export default {
  install(app, options) {
    app.config.globalProperties.$setBannerUser = (userId) => {
      window.BANNER_USER_ID = userId;
    };
    
    app.component('BannerAdsIframe', {
      props: ['userId', 'height'],
      template: `
        <iframe
          src="/bannerads/index.html"
          :width="'100%'"
          :height="height || '800px'"
          frameborder="0"
          @load="setUserId"
        />
      `,
      methods: {
        setUserId() {
          if (this.userId) {
            window.BANNER_USER_ID = this.userId;
          }
        }
      },
      mounted() {
        this.setUserId();
      }
    });
  }
};

// main.js
import { createApp } from 'vue';
import BannerAdsPlugin from './plugins/bannerads.js';

const app = createApp(App);
app.use(BannerAdsPlugin);

// Использование:
// <BannerAdsIframe :user-id="user.id" height="600px" />
```

### Вариант 4: Программная инициализация

```javascript
// В любом месте вашего кода
window.BannerAdsAI.setUserId(12345);

// Проверить текущий статус
console.log(window.BannerAdsAI.isReady());
// { ready: true, userInfo: { userId: "12345", mode: "integrated" } }
```

## ⚙️ API конфигурации

### Установка ID пользователя

```javascript
// Метод 1: Глобальная переменная (до загрузки)
window.BANNER_USER_ID = 12345;

// Метод 2: Программно (после загрузки)
window.BannerAdsAI.setUserId(12345);

// Метод 3: React пропс
<BannerAdsAI userId={12345} />
```

### Проверка статуса

```javascript
const status = window.BannerAdsAI.isReady();
console.log(status);

// Вывод:
// {
//   ready: true,
//   userInfo: {
//     userId: "12345",
//     mode: "integrated",        // integrated | standalone
//     source: "window.BANNER_USER_ID"
//   },
//   hasUserId: true
// }
```

### Получение информации о пользователе

```javascript
const userInfo = window.BannerAdsAI.getUserId();
console.log(userInfo);

// Вывод:
// {
//   userId: "12345",
//   mode: "integrated",
//   source: "window.BANNER_USER_ID"
// }
```

## 🔧 Настройка Backend

### Переменные окружения

Создайте файл `backend/.env`:

```bash
# OpenAI для генерации заголовков
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_CHAT_MODEL=gpt-4o-mini

# Recraft.ai для генерации изображений
RECRAFT_API_KEY=your-recraft-api-key-here

# Настройки сервера
PORT=3006
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com

# Директория для загрузок (опционально)
UPLOAD_DIR=uploads
```

### API Endpoints для интеграции

```
GET  /api/history/:userId              # История пользователя
GET  /api/history/:userId/stats        # Аналитика пользователя
DELETE /api/history/:userId/clear      # Очистить историю
POST /api/banner/download              # Сохранить скачанный баннер
```

## 📁 Структура интеграции

```
ваша-платформа/
├── public/
│   └── bannerads/                    # Скомпилированный BannerAdsAI
│       ├── index.html
│       ├── assets/
│       └── ...
├── src/
│   └── pages/
│       └── user-banners.jsx         # Ваша страница с BannerAdsAI
└── backend/
    └── bannerads-proxy/             # Опциональный прокси
```

## 🎯 Примеры использования

### Пример 1: Встроенная страница

```jsx
// pages/UserBanners.jsx
import { useParams } from 'react-router-dom';

export default function UserBanners() {
    const { userId } = useParams();
    
    // Устанавливаем ID перед рендером
    useEffect(() => {
        window.BANNER_USER_ID = userId;
    }, [userId]);
    
    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Генератор баннеров</h1>
                <p>Пользователь ID: {userId}</p>
            </div>
            
            {/* BannerAdsAI займет всю область */}
            <div className="banner-widget">
                <iframe 
                    src="/bannerads/index.html" 
                    width="100%" 
                    height="800px"
                    frameborder="0"
                />
            </div>
        </div>
    );
}
```

### Пример 2: Modal окно

```jsx
// components/BannerModal.jsx
function BannerModal({ isOpen, userId, onClose }) {
    useEffect(() => {
        if (isOpen && userId) {
            window.BANNER_USER_ID = userId;
        }
    }, [isOpen, userId]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <div className="modal-content">
                <h2>Создание баннера</h2>
                <iframe 
                    src="/bannerads/index.html"
                    width="100%"
                    height="600px"
                />
            </div>
        </Modal>
    );
}
```

### Пример 3: React компонент

```jsx
// components/BannerGenerator.jsx
import BannerAdsAI from '@/bannerads/BannerAdsAI';

function BannerGenerator({ user }) {
    return (
        <div className="banner-section">
            <div className="section-header">
                <h3>Создать баннер</h3>
                <p>Для пользователя: {user.email}</p>
            </div>
            
            <BannerAdsAI 
                userId={user.id}
                onBannerCreated={(banner) => {
                    console.log('Создан баннер:', banner);
                    // Ваша логика обработки
                }}
            />
        </div>
    );
}
```

## 🔒 Безопасность

### Изоляция данных пользователей

- ✅ Каждый `userId` имеет изолированную историю
- ✅ Данные не пересекаются между пользователями  
- ✅ Нет глобального доступа к данным других пользователей

### Валидация userId

```javascript
// Рекомендуемая проверка перед установкой
function setUserIdSafely(userId) {
    // Проверяем тип и формат
    if (typeof userId !== 'string' && typeof userId !== 'number') {
        throw new Error('userId must be string or number');
    }
    
    // Проверяем на пустые значения
    if (!userId || userId === '0' || userId === 0) {
        throw new Error('userId cannot be empty or zero');
    }
    
    // Устанавливаем
    window.BANNER_USER_ID = String(userId);
    return userId;
}
```

## 🚀 Деплой и хостинг

### Вариант 1: Отдельный поддомен

```nginx
# nginx.conf
server {
    server_name bannerads.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:3006/api;
    }
}
```

### Вариант 2: Подпапка основного домена

```nginx
# nginx.conf  
server {
    server_name yourdomain.com;
    
    location /bannerads {
        alias /var/www/bannerads/dist;
        try_files $uri $uri/ /bannerads/index.html;
    }
    
    location /bannerads/api {
        proxy_pass http://localhost:3006/api;
    }
}
```

## 📊 Мониторинг и аналитика

### API для получения статистики

```javascript
// Получить статистику пользователя
fetch(`/api/history/${userId}/stats`)
    .then(response => response.json())
    .then(stats => {
        console.log('Статистика пользователя:', stats);
        // {
        //   totalGenerations: 15,
        //   fonts: [['roboto', 8], ['inter', 4]],
        //   sites: [['example.com', 5], ['test.com', 3]],
        //   models: [['recraftv3', 10], ['realistic', 5]]
        // }
    });
```

### Логирование активности

```javascript
// В вашей платформе
window.addEventListener('bannerGenerated', (event) => {
    const { userId, bannerData } = event.detail;
    
    // Отправить в вашу аналитику
    analytics.track('Banner Generated', {
        userId,
        template: bannerData.template,
        size: bannerData.size
    });
});
```

## ❓ FAQ

### Q: Можно ли использовать строковые ID?
**A:** Да, система принимает как числовые (12345), так и строковые ('user_abc_123') ID.

### Q: Что происходит, если userId не задан?
**A:** Система автоматически переходит в standalone режим с localStorage.

### Q: Можно ли менять userId во время сессии?
**A:** Да, вызовите `window.BannerAdsAI.setUserId(newUserId)`.

### Q: Как очистить данные пользователя?
**A:** Используйте `DELETE /api/history/:userId/clear` или кнопку в интерфейсе.

### Q: Поддерживается ли SSR?
**A:** Да, но `window.BANNER_USER_ID` нужно устанавливать на клиенте.

## 📞 Поддержка

При возникновении проблем:

1. Проверьте консоль браузера на ошибки
2. Убедитесь что `userId` установлен корректно
3. Проверьте доступность backend API
4. Создайте Issue в репозитории проекта

## 🔄 Версионность

- **v2.2.1** - Добавлена поддержка внешних userId и VueJS интеграция
- **v2.2.0** - Регенерация контента с AI фидбеком + Система истории
- **v2.1.0** - Recraft.ai интеграция и улучшенный UX
- **v2.0.0** - Мультиагентная система

---

**Готово к интеграции!** 🎉

Этот режим позволяет легко встроить BannerAdsAI в любую существующую платформу без необходимости реализации собственной системы авторизации.