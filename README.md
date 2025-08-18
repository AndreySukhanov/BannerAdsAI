# 🎨 BannerAdsAI

Автоматическое создание профессиональных рекламных баннеров с помощью искусственного интеллекта.

## 🚀 Возможности

- **Анализ веб-страниц**: Автоматический анализ контента сайта для создания релевантных заголовков
- **Мультиязычность**: Поддержка русского, английского, французского, немецкого и испанского языков
- **AI-генерация**: Создание заголовков через OpenAI GPT-4o-mini и изображений через DALL-E 3
- **Мультиагентная система**: Специализированные агенты для разных задач
- **Загрузка изображений**: Возможность использовать собственные изображения
- **Готовые размеры**: 300x250 и 336x280 пикселей
- **Цветовые схемы**: Синий деловой и красный энергичный стили

## 🛠 Технологии

### Frontend
- **React.js** + **Vite** - современная сборка
- **Tailwind CSS** - стилизация
- **shadcn/ui** - UI компоненты
- **Framer Motion** - анимации
- **HTML5 Canvas** - рендеринг баннеров

### Backend
- **Node.js** + **Express** - сервер
- **Мультиагентная система** - специализированные агенты
- **OpenAI API** - генерация контента и изображений
- **JSDOM** - веб-скрапинг

## 📦 Установка

### Требования
- Node.js 18+
- OpenAI API ключ

### Быстрый старт

1. **Клонирование репозитория**
```bash
git clone https://github.com/yourusername/banner-ads-ai.git
cd banner-ads-ai
```

2. **Установка зависимостей**
```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

3. **Настройка переменных окружения**
```bash
# Создайте файл backend/.env
echo "OPENAI_API_KEY=your-openai-api-key-here" > backend/.env
echo "OPENAI_BASE_URL=https://api.openai.com/v1" >> backend/.env
echo "OPENAI_CHAT_MODEL=gpt-4o-mini" >> backend/.env
echo "PORT=3001" >> backend/.env
```

4. **Запуск приложения**
```bash
# Терминал 1 - Backend
cd backend
npm run dev

# Терминал 2 - Frontend
npm run dev
```

Приложение будет доступно по адресу: http://localhost:5173

## 🎯 Использование

1. **Введите URL** посадочной страницы
2. **Выберите размер** баннера (300x250 или 336x280)
3. **Выберите цветовую схему** (синий или красный стиль)
4. **Выберите заголовок** из 3 сгенерированных вариантов
5. **Получите готовые баннеры** и скачайте их в формате PNG

### Дополнительные возможности
- Загрузка собственного изображения (PNG с прозрачным фоном)
- Генерация новых вариантов заголовков
- Создание новых вариантов баннеров
- Скачивание всех баннеров одним кликом

## 🏗 Архитектура

### Мультиагентная система

- **WebScrapingAgent** - анализ веб-страниц и извлечение контента
- **HeadlineAgent** - генерация маркетинговых заголовков
- **ImageAgent** - создание фоновых изображений
- **BannerAgent** - сборка финальных баннеров
- **Coordinator** - координация работы всех агентов

### API Endpoints

```
POST /api/agents/generate-headlines    # Генерация заголовков
POST /api/agents/generate-banner       # Полная генерация баннера
POST /api/agents/generate-banner-from-headline  # Баннер из заголовка
GET  /api/agents/stats                # Статистика системы
POST /api/upload-file                 # Загрузка файлов
```

## 🚀 Деплой

### Frontend
- **Vercel**: `vercel --prod`
- **Netlify**: `npm run build` → загрузить папку `dist`
- **Собственный сервер**: `npm run build` → настроить nginx

### Backend
- **Railway**: подключить репозиторий
- **Render**: создать Web Service
- **VPS**: PM2 + nginx

### Переменные окружения для production
```bash
OPENAI_API_KEY=your-production-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_CHAT_MODEL=gpt-4o-mini
PORT=3001
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

## 📝 Разработка

### Структура проекта
```
├── src/                    # Frontend
│   ├── api/               # API клиенты
│   ├── components/        # React компоненты
│   ├── pages/            # Страницы
│   └── hooks/            # React хуки
├── backend/              # Backend
│   ├── agents/          # Мультиагентная система
│   ├── routes/          # API маршруты
│   ├── utils/           # Утилиты
│   └── server.js        # Основной сервер
└── docs/                # Документация
```

### Команды разработки
```bash
npm run dev          # Запуск frontend в dev режиме
npm run build        # Сборка для production
npm run preview      # Предпросмотр production сборки
npm run lint         # Проверка кода

cd backend
npm run dev          # Запуск backend с nodemon
npm start           # Запуск backend в production
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку для новой функции: `git checkout -b feature/amazing-feature`
3. Зафиксируйте изменения: `git commit -m 'Добавить потрясающую функцию'`
4. Отправьте в ветку: `git push origin feature/amazing-feature`
5. Создайте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл [LICENSE](LICENSE) для получения дополнительной информации.

## 🆘 Поддержка

Если у вас возникли проблемы или вопросы:

1. Проверьте [Issues](https://github.com/yourusername/banner-ads-ai/issues)
2. Создайте новый Issue с описанием проблемы
3. Приложите логи и скриншоты

## 🔗 Полезные ссылки

- [Техническое описание проекта](./Техническое%20описание%20проекта%20Banner.txt)
- [Документация мультиагентной системы](./MULTIAGENT_SYSTEM.md)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [React Documentation](https://react.dev)

---