// Headline Agent - Specialized in generating marketing headlines
import { callOpenAI } from '../utils/openai.js';

export class HeadlineAgent {
  constructor() {
    this.name = 'HeadlineAgent';
  }

  async generateHeadlines({ content, style, language = 'ru' }) {
    console.log(`[${this.name}] Generating headlines for ${language} content with ${style} style`);
    
    const systemPrompt = this.getSystemPrompt(language);
    const userPrompt = this.buildHeadlinePrompt(content, style, language);
    
    try {
      const response = await callOpenAI(systemPrompt, userPrompt);
      const headlines = this.parseHeadlines(response, style);
      
      // Check and fix headlines that are too long
      const validatedHeadlines = await this.validateHeadlineLengths(headlines, language, style);
      
      console.log(`[${this.name}] Generated ${validatedHeadlines.length} headlines`);
      
      return validatedHeadlines.map((text, index) => ({
        id: index + 1,
        text: text,
        style: this.getHeadlineStyle(index),
        language: language
      }));

    } catch (error) {
      console.error(`[${this.name}] Error generating headlines:`, error);
      return this.getFallbackHeadlines(content, language);
    }
  }

  getSystemPrompt(language) {
    switch (language) {
      case 'ru':
        return `Ты эксперт по созданию эффективных рекламных заголовков на русском языке. 
        Ты создаешь заголовки, которые привлекают внимание, вызывают эмоции и мотивируют к действию.
        Всегда соблюдай требования к длине и стилю заголовков.`;
      case 'fr':
        return `Vous êtes un expert en création de titres publicitaires efficaces en français.
        Vous créez des titres qui attirent l'attention, évoquent des émotions et motivent à l'action.
        Respectez toujours les exigences de longueur et de style des titres.`;
      case 'de':
        return `Sie sind Experte für die Erstellung effektiver Werbeschlagzeilen auf Deutsch.
        Sie erstellen Schlagzeilen, die Aufmerksamkeit erregen, Emotionen wecken und zum Handeln motivieren.
        Befolgen Sie immer die Anforderungen an Länge und Stil der Schlagzeilen.`;
      case 'es':
        return `Eres un experto en crear titulares publicitarios efectivos en español.
        Creas titulares que captan la atención, evocan emociones y motivan a la acción.
        Siempre sigue los requisitos de longitud y estilo de los titulares.`;
      default:
        return `You are an expert at creating effective advertising headlines in English.
        You create headlines that grab attention, evoke emotions and motivate action.
        Always follow requirements for headline length and style.`;
    }
  }

  buildHeadlinePrompt(content, style, language) {
    const templateStyles = {
      'blue_white': {
        'ru': 'деловой и надежный',
        'fr': 'professionnel et fiable',
        'de': 'professionell und vertrauenswürdig',
        'es': 'profesional y confiable',
        'en': 'professional and reliable'
      },
      'red_white': {
        'ru': 'энергичный и призывающий к действию',
        'fr': 'énergique et incitatif à l\'action',
        'de': 'energiegeladen und handlungsauffordernd',
        'es': 'enérgico y que llama a la acción',
        'en': 'energetic and call-to-action'
      }
    };

    const universalStyles = {
      'ru': 'универсальный',
      'fr': 'universel',
      'de': 'universell',
      'es': 'universal',
      'en': 'universal'
    };

    const templateStyle = (templateStyles[style] && templateStyles[style][language]) 
                         || universalStyles[language] 
                         || universalStyles['en'];

    switch (language) {
      case 'ru':
        return `Создай 3 рекламных заголовка на основе этого контента:

КОНТЕНТ:
Заголовок: ${content.title}
Описание: ${content.description}
Основные заголовки: ${content.headings.map(h => h.text).join(', ')}

ТРЕБОВАНИЯ:
- Стиль: ${templateStyle}
- Каждый заголовок СТРОГО до 100 символов включительно (не более 100)
- 3 разных подхода:
  1. ПРЯМАЯ ВЫГОДА - что получит клиент
  2. РЕШЕНИЕ ПРОБЛЕМЫ - какую проблему решаем
  3. ПРИЗЫВ К ДЕЙСТВИЮ - что нужно сделать

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО 3 заголовка, каждый с новой строки, БЕЗ нумерации и дополнительного текста.`;

      case 'fr':
        return `Créez 3 titres publicitaires basés sur ce contenu:

CONTENU:
Titre: ${content.title}
Description: ${content.description}
Titres principaux: ${content.headings.map(h => h.text).join(', ')}

EXIGENCES:
- Style: ${templateStyle}
- Chaque titre STRICTEMENT jusqu'à 100 caractères inclus (pas plus de 100)
- 3 approches différentes:
  1. AVANTAGE DIRECT - ce que le client obtiendra
  2. RÉSOLUTION DE PROBLÈME - quel problème nous résolvons
  3. APPEL À L'ACTION - ce qui doit être fait

FORMAT DE RÉPONSE:
Retournez SEULEMENT 3 titres, chacun sur une nouvelle ligne, SANS numérotation ni texte supplémentaire.`;

      case 'de':
        return `Erstellen Sie 3 Werbeschlagzeilen basierend auf diesem Inhalt:

INHALT:
Titel: ${content.title}
Beschreibung: ${content.description}
Hauptüberschriften: ${content.headings.map(h => h.text).join(', ')}

ANFORDERUNGEN:
- Stil: ${templateStyle}
- Jede Schlagzeile STRENG bis zu 100 Zeichen inklusive (nicht mehr als 100)
- 3 verschiedene Ansätze:
  1. DIREKTER NUTZEN - was der Kunde erhalten wird
  2. PROBLEMLÖSUNG - welches Problem wir lösen
  3. HANDLUNGSAUFFORDERUNG - was getan werden muss

ANTWORTFORMAT:
Geben Sie NUR 3 Schlagzeilen zurück, jede in einer neuen Zeile, OHNE Nummerierung oder zusätzlichen Text.`;

      case 'es':
        return `Crea 3 titulares publicitarios basados en este contenido:

CONTENIDO:
Título: ${content.title}
Descripción: ${content.description}
Títulos principales: ${content.headings.map(h => h.text).join(', ')}

REQUISITOS:
- Estilo: ${templateStyle}
- Cada titular 90-100 caracteres (apunte a 100)
- 3 enfoques diferentes:
  1. BENEFICIO DIRECTO - lo que obtendrá el cliente
  2. SOLUCIÓN DE PROBLEMAS - qué problema resolvemos
  3. LLAMADA A LA ACCIÓN - lo que se debe hacer

FORMATO DE RESPUESTA:
Devuelve SOLO 3 titulares, cada uno en una nueva línea, SIN numeración ni texto adicional.`;

      default:
        return `Create 3 advertising headlines based on this content:

CONTENT:
Title: ${content.title}
Description: ${content.description}
Main headings: ${content.headings.map(h => h.text).join(', ')}

REQUIREMENTS:
- Style: ${templateStyle}
- Each headline STRICTLY up to 100 characters inclusive (no more than 100)
- 3 different approaches:
  1. DIRECT BENEFIT - what the client will get
  2. PROBLEM SOLVING - what problem we solve
  3. CALL TO ACTION - what needs to be done

RESPONSE FORMAT:
Return ONLY 3 headlines, each on a new line, WITHOUT numbering or additional text.`;
    }
  }

  parseHeadlines(response, style = null) {
    return response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove numbering, quotes, and other formatting
        const cleanLine = line
          .replace(/^\d+[.)]\s*/, '')
          .replace(/^[-•]\s*/, '')
          .replace(/^["«»]/, '')
          .replace(/["«»]$/, '')
          .trim();
        
        // Применяем uppercase только для шаблонов, которые этого требуют
        return style === 'branded' ? cleanLine : cleanLine.toUpperCase();
      })
      .filter(line => line.length > 0)
      .slice(0, 3);
  }

  getHeadlineStyle(index) {
    const styles = ['benefit', 'problem-solving', 'call-to-action'];
    return styles[index] || 'generic';
  }

  getTemplateStyle(template, language = 'ru') {
    const templateStyles = {
      'blue_white': {
        'ru': 'деловой и надежный',
        'fr': 'professionnel et fiable',
        'de': 'professionell und vertrauenswürdig',
        'es': 'profesional y confiable',
        'en': 'professional and reliable'
      },
      'red_white': {
        'ru': 'энергичный и призывающий к действию',
        'fr': 'énergique et incitatif à l\'action',
        'de': 'energiegeladen und handlungsauffordernd',
        'es': 'enérgico y que llama a la acción',
        'en': 'energetic and call-to-action'
      }
    };

    const universalStyles = {
      'ru': 'универсальный',
      'fr': 'universel',
      'de': 'universell',
      'es': 'universal',
      'en': 'universal'
    };

    return (templateStyles[template] && templateStyles[template][language]) 
           || universalStyles[language] 
           || universalStyles['en'];
  }

  getFallbackHeadlines(content, language) {
    console.log(`[${this.name}] Using fallback headlines for ${language}`);
    
    const fallbackHeadlines = {
      'ru': [
        { id: 1, text: 'ПОЛУЧИТЕ ЛУЧШЕЕ РЕШЕНИЕ СЕГОДНЯ', style: 'benefit', language: 'ru' },
        { id: 2, text: 'РЕШАЕМ ВАШУ ПРОБЛЕМУ БЫСТРО', style: 'problem-solving', language: 'ru' },
        { id: 3, text: 'НАЧНИТЕ ПРЯМО СЕЙЧАС', style: 'call-to-action', language: 'ru' }
      ],
      'fr': [
        { id: 1, text: 'OBTENEZ LA MEILLEURE SOLUTION AUJOURD\'HUI', style: 'benefit', language: 'fr' },
        { id: 2, text: 'RÉSOLVONS VOTRE PROBLÈME RAPIDEMENT', style: 'problem-solving', language: 'fr' },
        { id: 3, text: 'COMMENCEZ DÈS MAINTENANT', style: 'call-to-action', language: 'fr' }
      ],
      'de': [
        { id: 1, text: 'HOLEN SIE SICH HEUTE DIE BESTE LÖSUNG', style: 'benefit', language: 'de' },
        { id: 2, text: 'WIR LÖSEN IHR PROBLEM SCHNELL', style: 'problem-solving', language: 'de' },
        { id: 3, text: 'STARTEN SIE JETZT GLEICH', style: 'call-to-action', language: 'de' }
      ],
      'es': [
        { id: 1, text: 'OBTENGA LA MEJOR SOLUCIÓN HOY', style: 'benefit', language: 'es' },
        { id: 2, text: 'RESOLVEMOS SU PROBLEMA RÁPIDO', style: 'problem-solving', language: 'es' },
        { id: 3, text: 'COMIENCE AHORA MISMO', style: 'call-to-action', language: 'es' }
      ],
      'en': [
        { id: 1, text: 'GET THE BEST SOLUTION TODAY', style: 'benefit', language: 'en' },
        { id: 2, text: 'SOLVE YOUR PROBLEM FAST', style: 'problem-solving', language: 'en' },
        { id: 3, text: 'START RIGHT NOW', style: 'call-to-action', language: 'en' }
      ]
    };

    return fallbackHeadlines[language] || fallbackHeadlines['en'];
  }

  // Regenerate headlines with user feedback
  async regenerateHeadlines({ webContent, template, currentHeadlines, userFeedback }) {
    console.log(`[${this.name}] Regenerating headlines with user feedback: "${userFeedback}"`);
    
    try {
      const language = webContent.language || 'ru';
      const templateStyle = this.getTemplateStyle(template, language);
      
      const systemPrompt = `Ты специалист по созданию рекламных заголовков. Твоя задача - создать новые заголовки на основе фидбека пользователя.`;
      
      const userPrompt = this.buildRegenerationPrompt(webContent, templateStyle, currentHeadlines, userFeedback, language);
      
      const response = await callOpenAI(systemPrompt, userPrompt);
      const headlines = this.parseHeadlines(response, template);
      
      if (headlines.length === 0) {
        throw new Error('No valid headlines generated after feedback application');
      }
      
      const result = headlines.map((text, index) => ({
        id: index + 1,
        text: text,
        style: this.getHeadlineStyle(index),
        language: language,
        regenerated: true,
        feedback: userFeedback
      }));
      
      console.log(`[${this.name}] Generated ${result.length} regenerated headlines`);
      return result;
      
    } catch (error) {
      console.error(`[${this.name}] Error in headline regeneration:`, error);
      
      // Return enhanced current headlines as fallback
      return currentHeadlines.map((headline, index) => ({
        id: index + 1,
        text: headline,
        style: this.getHeadlineStyle(index),
        language: webContent.language || 'ru',
        regenerated: true,
        feedback: userFeedback,
        fallback: true
      }));
    }
  }

  buildRegenerationPrompt(content, templateStyle, currentHeadlines, userFeedback, language) {
    const headlinesText = currentHeadlines.join('\n');
    
    switch (language) {
      case 'ru':
        return `Перепиши заголовки с учетом пожеланий пользователя.

КОНТЕНТ:
Заголовок: ${content.title}
Описание: ${content.description}

ТЕКУЩИЕ ЗАГОЛОВКИ:
${headlinesText}

ПОЖЕЛАНИЯ ПОЛЬЗОВАТЕЛЯ: "${userFeedback}"

ТРЕБОВАНИЯ:
- Стиль: ${templateStyle}
- Каждый заголовок СТРОГО до 100 символов включительно (не более 100)
- Учти пожелания пользователя
- Сохрани суть контента
- 3 разных подхода: выгода, решение проблемы, призыв к действию

ФОРМАТ ОТВЕТА:
Верни ТОЛЬКО 3 новых заголовка, каждый с новой строки, БЕЗ нумерации.`;

      case 'en':
        return `Rewrite headlines based on user feedback.

CONTENT:
Title: ${content.title}
Description: ${content.description}

CURRENT HEADLINES:
${headlinesText}

USER FEEDBACK: "${userFeedback}"

REQUIREMENTS:
- Style: ${templateStyle}
- Each headline STRICTLY up to 100 characters inclusive (no more than 100)
- Apply user feedback
- Keep content essence
- 3 different approaches: benefit, problem-solving, call-to-action

RESPONSE FORMAT:
Return ONLY 3 new headlines, each on a new line, WITHOUT numbering.`;

      default:
        return `Rewrite headlines based on user feedback.

CONTENT:
Title: ${content.title}
Description: ${content.description}

CURRENT HEADLINES:
${headlinesText}

USER FEEDBACK: "${userFeedback}"

REQUIREMENTS:
- Style: ${templateStyle}
- Each headline STRICTLY up to 100 characters inclusive (no more than 100)
- Apply user feedback
- Keep content essence

RESPONSE FORMAT:
Return ONLY 3 new headlines, each on a new line, WITHOUT numbering.`;
    }
  }

  // Перевод заголовков на русский язык для медиабайеров
  async translateHeadlines(headlines) {
    console.log(`[${this.name}] Translating ${headlines.length} headlines to Russian`);
    
    try {
      // Отфильтруем заголовки, которые уже на русском языке
      const nonRussianHeadlines = headlines.filter(headline => {
        return headline.language && headline.language !== 'ru';
      });

      if (nonRussianHeadlines.length === 0) {
        console.log(`[${this.name}] All headlines are already in Russian, skipping translation`);
        return headlines; // Все заголовки уже на русском
      }

      // Создаем промпт для перевода
      const headlinesForTranslation = nonRussianHeadlines.map(h => h.text).join('\n');
      
      const systemPrompt = `You are a professional translator specializing in marketing content. 
Your task is to translate advertising headlines from any language to Russian, preserving the marketing impact and emotional appeal.`;

      const userPrompt = `Translate these advertising headlines to Russian. Keep the same marketing style, emotional impact, and call-to-action power.

HEADLINES TO TRANSLATE:
${headlinesForTranslation}

REQUIREMENTS:
- Preserve marketing impact and emotional appeal
- Keep STRICTLY up to 100 characters inclusive (no more than 100)
- Use natural, fluent Russian
- Maintain the advertising tone
- Each headline should sound native to Russian speakers

RESPONSE FORMAT:
Return ONLY the translated headlines, each on a new line, in the same order, WITHOUT numbering or additional text.`;

      const response = await callOpenAI(systemPrompt, userPrompt);
      const translatedTexts = response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Добавляем переводы к соответствующим заголовкам
      let translationIndex = 0;
      const result = headlines.map(headline => {
        if (headline.language && headline.language !== 'ru') {
          const translation = translatedTexts[translationIndex];
          translationIndex++;
          
          return {
            ...headline,
            russianTranslation: translation || headline.text
          };
        }
        return headline; // Русские заголовки остаются без изменений
      });

      console.log(`[${this.name}] Successfully translated ${nonRussianHeadlines.length} headlines`);
      return result;

    } catch (error) {
      console.error(`[${this.name}] Error translating headlines:`, error);
      // В случае ошибки возвращаем исходные заголовки
      return headlines;
    }
  }

  // Validate headline lengths and fix if needed
  async validateHeadlineLengths(headlines, language, style = null) {
    const validatedHeadlines = [];
    
    for (const headline of headlines) {
      if (headline.length <= 100) {
        validatedHeadlines.push(headline);
      } else {
        console.log(`[${this.name}] Headline too long (${headline.length} chars), requesting shorter version`);
        try {
          const shortenedHeadline = await this.shortenHeadline(headline, language, style);
          validatedHeadlines.push(shortenedHeadline);
        } catch (error) {
          console.warn(`[${this.name}] Failed to shorten headline, using truncated version:`, error.message);
          // Fallback: smart truncation at word boundary
          const truncated = this.smartTruncate(headline, 100);
          validatedHeadlines.push(truncated);
        }
      }
    }
    
    return validatedHeadlines;
  }

  // Request AI to shorten a headline while preserving meaning
  async shortenHeadline(headline, language, style = null) {
    const systemPrompt = language === 'ru' 
      ? `Ты эксперт по созданию кратких рекламных заголовков. Сокращай заголовки, сохраняя смысл и эмоциональное воздействие.`
      : `You are an expert at creating concise advertising headlines. Shorten headlines while preserving meaning and emotional impact.`;

    const userPrompt = language === 'ru'
      ? `Сократи этот заголовок до 100 символов максимум, сохранив смысл и силу воздействия:

"${headline}"

Верни ТОЛЬКО сокращенный заголовок, без объяснений.`
      : `Shorten this headline to maximum 100 characters while preserving meaning and impact:

"${headline}"

Return ONLY the shortened headline, no explanations.`;

    const response = await callOpenAI(systemPrompt, userPrompt);
    const cleanShortened = response.trim().replace(/^["«»]/, '').replace(/["«»]$/, '');
    
    // Применяем uppercase только для шаблонов, которые этого требуют
    const shortened = style === 'branded' ? cleanShortened : cleanShortened.toUpperCase();
    
    // Ensure it's actually shorter
    return shortened.length <= 100 ? shortened : this.smartTruncate(shortened, 100);
  }

  // Smart truncation at word boundaries
  smartTruncate(text, maxLength) {
    if (text.length <= maxLength) return text;
    
    // Try to cut at word boundary
    const truncated = text.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) { // If we can save at least 20% of length
      return truncated.substring(0, lastSpace) + '...';
    }
    
    // Otherwise just cut and add ellipsis
    return text.substring(0, maxLength - 3) + '...';
  }
}