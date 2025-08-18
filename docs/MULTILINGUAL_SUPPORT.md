# Поддержка многоязычности

Система Banner Generator поддерживает автоматическое определение языка и генерацию контента на 5 языках.

## Поддерживаемые языки

| Язык | Код | Флаг | Пример сайта |
|------|-----|------|--------------|
| Русский | `ru` | 🇷🇺 | rt.com, lenta.ru |
| Английский | `en` | 🇺🇸 | bbc.com, cnn.com |
| Французский | `fr` | 🇫🇷 | lefigaro.fr, lemonde.fr |
| Немецкий | `de` | 🇩🇪 | bild.de, spiegel.de |
| Испанский | `es` | 🇪🇸 | elmundo.es, elpais.com |

## Автоматическое определение языка

### WebScrapingAgent

Система автоматически определяет язык контента используя:

1. **DOM подсказки**:
   - `html[lang]` атрибут (`lang="fr"`, `lang="de"`)
   - `meta[property="og:locale"]` (`og:locale="es_ES"`)

2. **Анализ текста**:
   - **Стоп-слова**: частотные слова для каждого языка
   - **Специальные символы**: диакритика и уникальные символы
   - **Языковые паттерны**: характерные слова и фразы

### Алгоритм детекции

```javascript
// Специальные символы по языкам
const frenchChars = /[àâäéèêëïîôöùûüÿç]/gi;  // Французский
const germanChars = /[äöüß]/gi;                // Немецкий  
const spanishChars = /[ñáéíóúü¿¡]/gi;         // Испанский
const cyrillicChars = /[а-яё]/gi;             // Русский

// Вычисление скоринга
const scores = {
  ru: stopWords * 3 + cyrillicChars.length,
  en: stopWords * 3,
  fr: stopWords * 3 + frenchChars * 2 + patterns * 4,
  de: stopWords * 3 + germanChars * 2 + patterns * 4,
  es: stopWords * 3 + spanishChars * 2 + patterns * 4
};
```

## Генерация заголовков

### HeadlineAgent

Для каждого языка настроены:

1. **Системные промпты** на соответствующем языке
2. **Стили шаблонов**:
   - `blue_white`: деловой/профессиональный стиль
   - `red_white`: энергичный/призывающий к действию
3. **Структурированные требования** к заголовкам
4. **Fallback заголовки** на случай ошибок API

### Примеры стилей

| Язык | Blue/White (деловой) | Red/White (энергичный) |
|------|---------------------|------------------------|
| 🇷🇺 Русский | деловой и надежный | энергичный и призывающий к действию |
| 🇺🇸 Английский | professional and reliable | energetic and call-to-action |
| 🇫🇷 Французский | professionnel et fiable | énergique et incitatif à l'action |
| 🇩🇪 Немецкий | professionell und vertrauenswürdig | energiegeladen und handlungsauffordernd |
| 🇪🇸 Испанский | profesional y confiable | enérgico y que llama a la acción |

### Структура промптов

Каждый язык использует единую структуру с 3 подходами:

1. **ПРЯМАЯ ВЫГОДА** / **DIRECT BENEFIT** / **AVANTAGE DIRECT** / **DIREKTER NUTZEN** / **BENEFICIO DIRECTO**
2. **РЕШЕНИЕ ПРОБЛЕМЫ** / **PROBLEM SOLVING** / **RÉSOLUTION** / **PROBLEMLÖSUNG** / **SOLUCIÓN**  
3. **ПРИЗЫВ К ДЕЙСТВИЮ** / **CALL TO ACTION** / **APPEL À L'ACTION** / **HANDLUNGSAUFFORDERUNG** / **LLAMADA A LA ACCIÓN**

## Примеры работы

### Французский сайт (lefigaro.fr)
```
Входной URL: https://www.lefigaro.fr/meteo/...
Определенный язык: 'fr'
Сгенерированные заголовки:
- "CHALEUR CANICULAIRE : RESTEZ AU FRAIS"
- "ÉVITEZ LA DÉSHYDRATATION : CONSEILS"  
- "PROTÉGEZ-VOUS DÈS MAINTENANT"
```

### Испанский сайт (elmundo.es)
```
Входной URL: https://www.elmundo.es/espana/...
Определенный язык: 'es'
Сгенерированные заголовки:
- "INSEGURIDAD EN BARCELONA: ¡ACTÚA YA!"
- "PROTEGE TUS PERTENENCIAS HOY"
- "SOLUCIONES INMEDIATAS AQUÍ"
```

## Fallback заголовки

При сбоях API используются предустановленные заголовки:

### Русский (ru)
- ПОЛУЧИТЕ ЛУЧШЕЕ РЕШЕНИЕ СЕГОДНЯ
- РЕШАЕМ ВАШУ ПРОБЛЕМУ БЫСТРО  
- НАЧНИТЕ ПРЯМО СЕЙЧАС

### Французский (fr)
- OBTENEZ LA MEILLEURE SOLUTION AUJOURD'HUI
- RÉSOLVONS VOTRE PROBLÈME RAPIDEMENT
- COMMENCEZ DÈS MAINTENANT

### Немецкий (de)
- HOLEN SIE SICH HEUTE DIE BESTE LÖSUNG
- WIR LÖSEN IHR PROBLEM SCHNELL
- STARTEN SIE JETZT GLEICH

### Испанский (es)  
- OBTENGA LA MEJOR SOLUCIÓN HOY
- RESOLVEMOS SU PROBLEMA RÁPIDO
- COMIENCE AHORA MISMO

### Английский (en)
- GET THE BEST SOLUTION TODAY
- SOLVE YOUR PROBLEM FAST
- START RIGHT NOW

## Техническая реализация

### Файлы конфигурации

- `backend/agents/webscraping-agent.js` - детекция языка
- `backend/agents/headline-agent.js` - генерация заголовков  
- `backend/agents/image-agent.js` - генерация изображений (язык-нейтральная)
- `backend/agents/banner-agent.js` - композиция баннеров

### API ответы

Все заголовки содержат поле `language`:

```json
{
  "headlines": [
    {
      "id": 1,
      "text": "CHALEUR CANICULAIRE : RESTEZ AU FRAIS",
      "style": "benefit", 
      "language": "fr"
    }
  ]
}
```

## Добавление нового языка

Для добавления поддержки нового языка:

1. **WebScrapingAgent**: добавить стоп-слова, символы, паттерны
2. **HeadlineAgent**: добавить системный промпт, стили, fallback заголовки
3. **Обновить** список поддерживаемых языков в коде
4. **Протестировать** на реальных сайтах

### Пример для итальянского (it)

```javascript
// webscraping-agent.js
const commonItalian = /\b(il|la|di|che|e|a|in|un|è|per|con|non|una|su|le|da|questo|come|ma|se|del|della|sono|lo|più|molto|anche|dove|quando|stesso|già|tra|dopo|prima|ancora|altri|quale|tutto|ogni|loro|suoi|nostro|così|solo|poi|tanto|niente|nulla)\b/gi;
const italianChars = /[àèéìíîòóù]/gi;

// headline-agent.js  
case 'it':
  return `Sei un esperto nella creazione di titoli pubblicitari efficaci in italiano.
  Crei titoli che attirano l'attenzione, evocano emozioni e motivano all'azione.
  Segui sempre i requisiti di lunghezza e stile dei titoli.`;
```
