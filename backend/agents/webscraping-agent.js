// Web Scraping Agent - Specialized in analyzing web pages and extracting content
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

export class WebScrapingAgent {
  constructor() {
    this.name = 'WebScrapingAgent';
    this.cache = new Map(); // Простой кеш в памяти
    this.cacheTimeout = 10 * 60 * 1000; // 10 минут
  }

  async analyzeUrl(url) {
    console.log(`[${this.name}] Analyzing URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const analysis = this.parseContent(html);
      
      console.log(`[${this.name}] Content extracted:`, {
        title: analysis.title,
        language: analysis.detectedLanguage,
        contentLength: analysis.content.length
      });
      
      return analysis;

    } catch (error) {
      console.error(`[${this.name}] Error analyzing URL ${url}:`, error.message);
      
      // Determine error type
      const errorType = this.categorizeError(error);
      
      // Return fallback content with error info
      return this.generateFallbackContent(url, error, errorType);
    }
  }

  parseContent(html) {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove unwanted elements
    const unwanted = document.querySelectorAll('script, style, noscript, nav, footer, .advertisement, .ads');
    unwanted.forEach(el => el.remove());
    
    // Extract structured content
    const title = this.extractTitle(document);
    const description = this.extractDescription(document);
    const headings = this.extractHeadings(document);
    const content = this.extractMainContent(document);

    // Language hints from DOM
    const htmlLang = (document.querySelector('html')?.getAttribute('lang') || '').toLowerCase();
    const ogLocale = (document.querySelector('meta[property="og:locale"]')?.getAttribute('content') || '').toLowerCase();
    const localeHint = (ogLocale.includes('ru') ? 'ru'
                        : ogLocale.includes('fr') ? 'fr'
                        : ogLocale.includes('de') ? 'de'
                        : ogLocale.includes('es') ? 'es'
                        : ogLocale.includes('en') ? 'en'
                        : htmlLang.startsWith('ru') ? 'ru'
                        : htmlLang.startsWith('fr') ? 'fr'
                        : htmlLang.startsWith('de') ? 'de'
                        : htmlLang.startsWith('es') ? 'es'
                        : htmlLang.startsWith('en') ? 'en'
                        : '');

    const language = this.detectLanguage(title + ' ' + description + ' ' + content, localeHint);
    
    return {
      title,
      description,
      headings,
      content: content.slice(0, 3000), // Limit content
      detectedLanguage: language,
      wordCount: content.split(/\s+/).length,
      extractedAt: new Date().toISOString()
    };
  }

  extractTitle(document) {
    // Try multiple title sources
    const titleSources = [
      () => document.querySelector('title')?.textContent?.trim(),
      () => document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
      () => document.querySelector('h1')?.textContent?.trim()
    ];

    for (const source of titleSources) {
      const title = source();
      if (title && title.length > 0) {
        return title.slice(0, 200);
      }
    }
    
    return 'Untitled Page';
  }

  extractDescription(document) {
    // Try multiple description sources
    const descSources = [
      () => document.querySelector('meta[name="description"]')?.getAttribute('content'),
      () => document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
      () => document.querySelector('meta[name="twitter:description"]')?.getAttribute('content'),
      () => document.querySelector('.description')?.textContent?.trim(),
      () => document.querySelector('p')?.textContent?.trim()
    ];

    for (const source of descSources) {
      const desc = source();
      if (desc && desc.length > 10) {
        return desc.slice(0, 500);
      }
    }
    
    return '';
  }

  extractHeadings(document) {
    const headings = [];
    const headingTags = ['h1', 'h2', 'h3', 'h4'];
    
    headingTags.forEach(tag => {
      const elements = document.querySelectorAll(tag);
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 0 && text.length < 200) {
          headings.push({
            level: parseInt(tag.substring(1)),
            text: text
          });
        }
      });
    });
    
    return headings.slice(0, 10);
  }

  extractMainContent(document) {
    // Try to find main content areas
    const contentSelectors = [
      'main',
      '[role="main"]',
      '.main-content',
      '#main-content',
      '.content',
      '#content',
      'article',
      '.post-content',
      '.entry-content'
    ];

    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text && text.length > 100) {
          return text;
        }
      }
    }
    
    // Fallback: get all text content
    const bodyText = document.body?.textContent?.trim() || '';
    return bodyText.slice(0, 5000);
  }

  detectLanguage(text, hint = '') {
    if (['ru', 'en', 'fr', 'de', 'es'].includes(hint)) return hint;
    if (!text || text.length < 10) return 'en';

    // Normalize text
    const sample = text.slice(0, 8000).toLowerCase();

    // Character-based heuristics
    const cyrMatches = sample.match(/[а-яё]/gi) || [];
    
    // Language-specific stopwords
    const commonRussian = /\b(и|в|на|с|по|для|это|как|что|все|или|был|может|этот|эту|эта|к|от|до|из|под|над|же|у|мы|вы|они|он|она|оно|там|здесь|чтобы|также|но)\b/gi;
    const commonEnglish = /\b(the|and|of|to|a|in|for|is|it|you|that|he|was|on|are|as|with|his|they|at|be|this|have|from|or|one|had|by|but|what|some|we|can|out|other|were|all|there|when|your|how|each|which|their|time|will|about|many)\b/gi;
    const commonFrench = /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|plus|par|grand|en|une|être|et|ou|ce|mais|comme|si|leur|bien|deux|même|notre|qu|sans|très|me|nous|donc|où|du|au|peut|encore|aussi|cette|ces|après|sous|contre|tout|pendant|avant|entre|plusieurs|chaque|sans|faire|autre|près|depuis)\b/gi;
    const commonGerman = /\b(der|die|das|und|in|zu|den|von|ist|mit|sich|auf|für|als|sie|wie|ein|aus|er|zu|kann|war|nicht|werden|hat|dass|ich|eine|oder|aber|man|es|auch|sein|bei|um|im|noch|nach|so|über|nur|wenn|sehr|gegen|vom|durch|mehr|andere|haben|wird|seiner|einem|unter|hier|vor|zwischen|während|ohne|bis|seit|wegen|trotz|statt|außer|innerhalb|oberhalb|unterhalb)\b/gi;
    const commonSpanish = /\b(el|la|de|que|y|a|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|una|las|más|pero|sus|al|él|esto|todo|esta|uno|sobre|todos|muy|puede|dos|como|tiempo|cada|día|hasta|donde|mismo|ella|han|ser|fue|hacer|tienen|tanto|puede|nos|yo|también|si|bien|algo|vez|ya|entre|sin|años|estado|desde|después|durante|antes|contra|hacia|según|mediante|salvo|excepto)\b/gi;

    const ruStop = (sample.match(commonRussian) || []).length;
    const enStop = (sample.match(commonEnglish) || []).length;
    const frStop = (sample.match(commonFrench) || []).length;
    const deStop = (sample.match(commonGerman) || []).length;
    const esStop = (sample.match(commonSpanish) || []).length;

    // Language-specific characters and patterns
    const frenchChars = sample.match(/[àâäéèêëïîôöùûüÿç]/gi) || [];
    const frenchPatterns = sample.match(/\b(jusqu|près|été|où|déjà|très|après|français|france|pendant|plusieurs|aujourd|demain|dimanche)\b/gi) || [];
    
    const germanChars = sample.match(/[äöüß]/gi) || [];
    const germanPatterns = sample.match(/\b(durch|während|zwischen|außer|innerhalb|deutschland|deutsch|heute|morgen|sonntag|montag|dienstag|mittwoch|donnerstag|freitag|samstag)\b/gi) || [];
    
    const spanishChars = sample.match(/[ñáéíóúü¿¡]/gi) || [];
    const spanishPatterns = sample.match(/\b(también|después|durante|antes|contra|según|mediante|españa|español|hoy|mañana|domingo|lunes|martes|miércoles|jueves|viernes|sábado)\b/gi) || [];

    // Calculate scores
    const ruScore = ruStop * 3 + cyrMatches.length;
    const enScore = enStop * 3;
    const frScore = frStop * 3 + frenchChars.length * 2 + frenchPatterns.length * 4;
    const deScore = deStop * 3 + germanChars.length * 2 + germanPatterns.length * 4;
    const esScore = esStop * 3 + spanishChars.length * 2 + spanishPatterns.length * 4;

    // Find the highest score
    const scores = { ru: ruScore, en: enScore, fr: frScore, de: deScore, es: esScore };
    const maxLang = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    return maxLang;
  }

  categorizeError(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('enotfound') || message.includes('dns')) {
      return 'DNS_ERROR';
    }
    if (message.includes('timeout') || message.includes('etimedout')) {
      return 'TIMEOUT';
    }
    if (message.includes('econnrefused') || message.includes('connection refused')) {
      return 'CONNECTION_REFUSED';
    }
    if (message.includes('403') || message.includes('forbidden')) {
      return 'FORBIDDEN';
    }
    if (message.includes('404') || message.includes('not found')) {
      return 'NOT_FOUND';
    }
    if (message.includes('500') || message.includes('internal server error')) {
      return 'SERVER_ERROR';
    }
    if (message.includes('ssl') || message.includes('certificate')) {
      return 'SSL_ERROR';
    }
    
    return 'UNKNOWN_ERROR';
  }

  generateFallbackContent(url, error = null, errorType = null) {
    console.log(`[${this.name}] Generating fallback content for ${url}`);
    
    // Extract domain and path info
    let domain = '';
    let path = '';
    
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
      path = urlObj.pathname;
    } catch (e) {
      domain = url;
    }
    
    return {
      title: `Страница на ${domain}`,
      description: `Информация и услуги, представленные на сайте ${domain}`,
      headings: [
        { level: 1, text: `Главная страница ${domain}` }
      ],
      content: `Добро пожаловать на ${domain}. Здесь вы найдете полезную информацию и качественные услуги. Наша команда работает для того, чтобы предоставить вам лучший сервис и решения.`,
      detectedLanguage: 'ru',
      wordCount: 25,
      extractedAt: new Date().toISOString(),
      isFallback: true,
      error: error ? {
        message: error.message,
        type: errorType,
        timestamp: new Date().toISOString()
      } : null
    };
  }
}