// Image Agent - Specialized in generating images and visual content using Recraft.ai and Nebius AI Studio
import { callOpenAI } from '../utils/openai.js';
import { callRecraftImageGeneration, optimizePromptForRecraft, RECRAFT_MODELS } from '../utils/recraft.js';
import { callNebiusImageGeneration, optimizePromptForNebius, retryNebiusGeneration, NEBIUS_MODELS, createNebiusFallback } from '../utils/nebius.js';

export class ImageAgent {
  constructor() {
    this.name = 'ImageAgent';
  }

  async generateImages({ content, headlines, count = 3, model = 'recraftv3', brandingData = null, useBrandStyle = false }) {
    const contentTitle = content?.title || 'No content provided';
    console.log(`[${this.name}] Generating ${count} images for content: ${contentTitle} using model: ${model}`);
    console.log(`[${this.name}] Brand styling: ${useBrandStyle ? 'ENABLED' : 'DISABLED'}`);

    if (!content) {
      console.warn(`[${this.name}] Warning: No content provided for image generation`);
    }

    try {
      // Step 1: Generate image prompts based on content and headlines
      const imagePrompts = await this.generateImagePrompts(content, headlines, count, brandingData, useBrandStyle);
      
      // Step 2: Generate actual images from prompts
      const imagePromises = imagePrompts.map(async (prompt, index) => {
        try {
          const enhancedPrompt = this.enhancePrompt(prompt);

          // Определяем провайдера и оптимизируем промпт соответственно
          const isNebiusModel = Object.keys(NEBIUS_MODELS).includes(model);
          let optimizedPrompt, finalPrompt;

          if (isNebiusModel) {
            optimizedPrompt = optimizePromptForNebius(enhancedPrompt, model);
            finalPrompt = optimizedPrompt; // Nebius может обрабатывать длинные промпты
          } else {
            optimizedPrompt = optimizePromptForRecraft(enhancedPrompt, model);
            // Ensure prompt is exactly 1000 characters or less for Recraft.ai
            finalPrompt = optimizedPrompt;
            if (finalPrompt.length > 1000) {
              finalPrompt = optimizedPrompt.substring(0, 1000);
            }
          }
            
          // Retry логика для повышения надежности
          const imageResult = await this.retryImageGeneration(finalPrompt, model, {
            size: '1024x1024',
            n: 1
          }, 3); // максимум 3 попытки
          
          return {
            id: index + 1,
            url: imageResult.url,
            prompt: prompt,
            enhancedPrompt: enhancedPrompt,
            optimizedPrompt: finalPrompt,
            revisedPrompt: imageResult.revised_prompt,
            model: model,
            generatedAt: new Date().toISOString()
          };
        } catch (error) {
          console.error(`[${this.name}] Failed to generate image ${index + 1} after retries:`, error.message);
          return null;
        }
      });

      const images = (await Promise.all(imagePromises)).filter(img => img !== null);
      
      console.log(`[${this.name}] Successfully generated ${images.length}/${count} images`);
      
      // Логирование предупреждения если не все изображения созданы
      if (images.length < count) {
        const failedCount = count - images.length;
        console.warn(`[${this.name}] Failed to generate ${failedCount} out of ${count} images`);
      }
      
      // Если ни одного изображения не создалось, пробуем создать fallback изображения
      if (images.length === 0) {
        console.warn(`[${this.name}] No images generated, creating fallback images`);
        return await this.generateFallbackImages(content, headlines, count, model);
      }
      
      return images;

    } catch (error) {
      console.error(`[${this.name}] Error in image generation:`, error);
      return [];
    }
  }

  async generateImagePrompts(content, headlines, count, brandingData = null, useBrandStyle = false) {
    console.log(`[${this.name}] Generating ${count} image prompts`);
    if (useBrandStyle && brandingData) {
      console.log(`[${this.name}] Using brand styling for: ${brandingData.title} (${brandingData.industry})`);
    }
    
    const systemPrompt = `You are a photo editor for a prestigious science and nature magazine (like National Geographic or Nature).
    Your task is to commission genuine, technically accurate, and compelling photographs.
    The images must look like they were captured by professional photographers on location with real camera equipment.
    Crucially, you must distinguish between an authentic photograph and a digital illustration/CGI. Reject anything that looks like fantasy, sci-fi, or digital painting.`;

    const headlinesText = headlines.map(h => h.text || h).join('\n');
    
    // Build brand styling instructions if enabled
    let brandStylingPrompt = '';
    if (useBrandStyle && brandingData) {
      const primaryColors = brandingData.colors && brandingData.colors.length > 0 
        ? brandingData.colors.slice(0, 2) 
        : [];
      const secondaryColors = brandingData.colors && brandingData.colors.length > 2 
        ? brandingData.colors.slice(2, 4)
        : [];
      
      const colorRequirements = primaryColors.length > 0 
        ? `DOMINANT COLORS: Must prominently feature ${primaryColors.join(' and ')} as the main color scheme. ${secondaryColors.length > 0 ? `Secondary colors: ${secondaryColors.join(', ')}. ` : ''}` 
        : '';
      
      const industryContext = brandingData.industry !== 'Other' 
        ? `${brandingData.industry} industry aesthetic. ` 
        : '';
      
      brandStylingPrompt = `

⚠️ CRITICAL BRANDING REQUIREMENTS - MUST BE HIGHLY VISIBLE:
✓ BRAND: ${brandingData.title}
✓ ${colorRequirements}
✓ INDUSTRY: ${industryContext}Create visuals that immediately reflect the brand identity
✓ STYLE: Incorporate visual elements typical of ${brandingData.title} brand aesthetics
✓ COMPOSITION: Use branded color scheme as background, lighting, or dominant visual elements
✓ MOOD: Match the professional tone and visual style of ${brandingData.industry || 'business'} industry
✓ IMPACT: Brand colors should be IMMEDIATELY noticeable and central to the image composition

IMPORTANT: This is a BRANDED banner - the brand identity must be unmistakably present in the visual design!
`;
    }
    
    const userPrompt = `Analyze this content and create ${count} authentic photographic concepts. The images must be strictly photorealistic and suitable for a science magazine cover.

CONTENT TO ANALYZE:
Title: ${content?.title || 'No title provided'}
Description: ${content?.description || 'No description provided'}
Banner Headlines: ${headlinesText}${brandStylingPrompt}

TASK: Create ${count} different concepts for real photographs.

VISUAL CONCEPT REQUIREMENTS:
- CONCEPT 1: A wide, environmental shot. Capture the subject within its natural context (e.g., a landscape for a meteor shower, a city for a business story).
- CONCEPT 2: A human-element shot. Show a person interacting with the subject. Must be a candid, authentic moment. Anonymous person, focus on the interaction.
- CONCEPT 3: A detailed close-up/macro shot. Focus on a key object with realistic texture and detail.

TECHNICAL REQUIREMENTS:
- **Strictly photorealistic. Must look like a real photograph, not a digital painting, illustration, or 3D render.**
- Shot with professional DSLR or mirrorless cameras (e.g., Sony A7R IV, Nikon Z8) and high-quality prime lenses (e.g., 50mm f/1.2, 135mm f/1.8).
- **Realistic lighting:** Must adhere to natural light sources. For night shots, this means long exposures, high ISO with natural grain. For day shots, realistic sun/overcast conditions.
- **Authentic photographic properties:** Natural depth of field (bokeh), lens flares appropriate for the lens, slight motion blur on moving elements, natural film grain or sensor noise.
- **NO fantasy, sci-fi, or overly artistic/dramatic styles.** The goal is authenticity and realism.

RESPONSE FORMAT:
Return ${count} detailed photographic descriptions, one per line, numbered 1-${count}.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt);
      return this.parseImagePrompts(response, count);
    } catch (error) {
      console.error(`[${this.name}] Error generating image prompts:`, error);
      return this.getFallbackImagePrompts(content, count);
    }
  }

  parseImagePrompts(response, expectedCount) {
    const lines = response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Remove numbering and clean up
        return line
          .replace(/^\d+[.)]\s*/, '')
          .replace(/^[-•]\s*/, '')
          .trim();
      })
      .filter(line => line.length > 20); // Ensure substantial prompts

    // Take exactly the expected count
    return lines.slice(0, expectedCount);
  }

  enhancePrompt(basePrompt) {
    // Add professional photography and quality enhancements
    const enhancements = [
      'authentic photograph',
      'shot on Sony A7R IV with a 50mm f/1.2 prime lens',
      'natural lighting, high ISO with subtle grain',
      'realistic depth of field, sharp focus on subject',
      'no digital painting, no CGI, no fantasy elements',
      'magazine-quality photojournalism',
      'candid and unstaged moment'
    ];

    return `${basePrompt}, ${enhancements.join(', ')}`;
  }

  getFallbackImagePrompts(content, count) {
    console.log(`[${this.name}] Using fallback image prompts`);
    
    const fallbackPrompts = [
      'Professional business team collaborating in modern office space with natural lighting',
      'Abstract geometric pattern with gradients representing growth and success',
      'Happy professional person using laptop with satisfied expression in bright environment',
      'Minimalist clean workspace with modern technology and soft shadows',
      'Symbolic representation of progress with ascending elements and positive energy'
    ];

    return fallbackPrompts.slice(0, count);
  }

  // Get available Recraft.ai models
  getAvailableModels() {
    return Object.values(RECRAFT_MODELS);
  }

  // Validate if model is supported
  isModelSupported(model) {
    return Object.keys(RECRAFT_MODELS).includes(model);
  }

  // Regenerate images with user feedback
  async regenerateImages({ content, headlines, userFeedback, model = 'recraftv3', count = 3, brandingData = null, useBrandStyle = false }) {
    console.log(`[${this.name}] Regenerating ${count} images with user feedback: "${userFeedback}"`);
    console.log(`[${this.name}] Brand styling: ${useBrandStyle ? 'ENABLED' : 'DISABLED'}`);
    
    try {
      // Step 1: Generate new image prompts based on feedback
      const imagePrompts = await this.generateImagePromptsWithFeedback(content, headlines, userFeedback, count, brandingData, useBrandStyle);
      
      // Step 2: Generate actual images from enhanced prompts
      const imagePromises = imagePrompts.map(async (prompt, index) => {
        try {
          const enhancedPrompt = this.enhancePromptWithFeedback(prompt, userFeedback);
          const optimizedPrompt = optimizePromptForRecraft(enhancedPrompt, model);
          
          // Ensure prompt is exactly 1000 characters or less for Recraft.ai
          let finalPrompt = optimizedPrompt;
          if (finalPrompt.length > 1000) {
            finalPrompt = optimizedPrompt.substring(0, 1000);
          }
            
          const imageResult = await callRecraftImageGeneration(finalPrompt, model, {
            size: '1024x1024',
            n: 1
          });
          
          return {
            id: index + 1,
            url: imageResult.url,
            prompt: prompt,
            enhancedPrompt: enhancedPrompt,
            optimizedPrompt: finalPrompt,
            revisedPrompt: imageResult.revised_prompt,
            model: model,
            regenerated: true,
            feedback: userFeedback,
            generatedAt: new Date().toISOString()
          };
        } catch (error) {
          console.error(`[${this.name}] Failed to regenerate image ${index + 1}:`, error.message);
          return null;
        }
      });

      const images = (await Promise.all(imagePromises)).filter(img => img !== null);
      
      console.log(`[${this.name}] Successfully regenerated ${images.length}/${count} images`);
      
      // Логирование предупреждения если не все изображения регенерированы
      if (images.length < count) {
        const failedCount = count - images.length;
        console.warn(`[${this.name}] Failed to regenerate ${failedCount} out of ${count} images`);
      }
      
      // Если ни одного изображения не регенерировалось, возвращаем пустой массив с предупреждением
      if (images.length === 0) {
        console.error(`[${this.name}] No images regenerated with feedback: "${userFeedback}"`);
      }
      
      return images;

    } catch (error) {
      console.error(`[${this.name}] Error in image regeneration:`, error);
      return [];
    }
  }

  async generateImagePromptsWithFeedback(content, headlines, userFeedback, count, brandingData = null, useBrandStyle = false) {
    console.log(`[${this.name}] Generating ${count} image prompts with user feedback`);
    
    const systemPrompt = `You are a photo editor for a prestigious science and nature magazine.
    Your task is to commission genuine, technically accurate, and compelling photographs based on user feedback.
    The images must look like they were captured by professional photographers on location with real camera equipment.`;

    const headlinesText = headlines.map(h => h.text || h).join('\n');
    
    // Build brand styling instructions if enabled
    let brandStylingPrompt = '';
    if (useBrandStyle && brandingData) {
      const primaryColors = brandingData.colors && brandingData.colors.length > 0 
        ? brandingData.colors.slice(0, 2) 
        : [];
      const secondaryColors = brandingData.colors && brandingData.colors.length > 2 
        ? brandingData.colors.slice(2, 4)
        : [];
      
      const colorRequirements = primaryColors.length > 0 
        ? `DOMINANT COLORS: Must prominently feature ${primaryColors.join(' and ')} as the main color scheme. ${secondaryColors.length > 0 ? `Secondary colors: ${secondaryColors.join(', ')}. ` : ''}` 
        : '';
      
      const industryContext = brandingData.industry !== 'Other' 
        ? `${brandingData.industry} industry aesthetic. ` 
        : '';
      
      brandStylingPrompt = `

⚠️ CRITICAL BRANDING REQUIREMENTS - MUST BE HIGHLY VISIBLE:
✓ BRAND: ${brandingData.title}
✓ ${colorRequirements}
✓ INDUSTRY: ${industryContext}Create visuals that immediately reflect the brand identity
✓ STYLE: Incorporate visual elements typical of ${brandingData.title} brand aesthetics
✓ COMPOSITION: Use branded color scheme as background, lighting, or dominant visual elements
✓ MOOD: Match the professional tone and visual style of ${brandingData.industry || 'business'} industry
✓ IMPACT: Brand colors should be IMMEDIATELY noticeable and central to the image composition

IMPORTANT: This is a BRANDED banner - the brand identity must be unmistakably present in the visual design!
`;
    }
    
    const userPrompt = `Analyze this content and create ${count} authentic photographic concepts based on user feedback.

CONTENT TO ANALYZE:
Title: ${content?.title || 'No title provided'}
Description: ${content?.description || 'No description provided'}
Banner Headlines: ${headlinesText}${brandStylingPrompt}

USER FEEDBACK: "${userFeedback}"

TASK: Create ${count} different concepts for real photographs that incorporate the user feedback.

REQUIREMENTS:
- Apply the user feedback (e.g., "more aggressive", "add humor", "make warmer", etc.)
- **Strictly photorealistic. Must look like a real photograph**
- Shot with professional cameras and lenses
- **Realistic lighting and authentic photographic properties**
- **NO fantasy, sci-fi, or overly artistic/dramatic styles**

RESPONSE FORMAT:
Return ${count} detailed photographic descriptions, one per line, numbered 1-${count}.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt);
      return this.parseImagePrompts(response, count);
    } catch (error) {
      console.error(`[${this.name}] Error generating image prompts with feedback:`, error);
      return this.getFallbackImagePromptsWithFeedback(content, userFeedback, count);
    }
  }

  enhancePromptWithFeedback(basePrompt, userFeedback) {
    // Apply user feedback to the prompt
    let enhancedPrompt = basePrompt;
    
    // Parse common feedback types and apply enhancements
    const feedback = userFeedback.toLowerCase();
    
    if (feedback.includes('агрессив') || feedback.includes('aggressive')) {
      enhancedPrompt += ', bold dramatic lighting, high contrast, intense atmosphere, dynamic composition';
    } else if (feedback.includes('юмор') || feedback.includes('humor') || feedback.includes('funny')) {
      enhancedPrompt += ', playful atmosphere, candid moment, lighthearted scene, natural smile';
    } else if (feedback.includes('тепл') || feedback.includes('warm')) {
      enhancedPrompt += ', warm golden hour lighting, cozy atmosphere, soft warm tones';
    } else if (feedback.includes('професс') || feedback.includes('professional')) {
      enhancedPrompt += ', clean professional setting, business attire, corporate environment';
    } else if (feedback.includes('ярк') || feedback.includes('bright') || feedback.includes('vibrant')) {
      enhancedPrompt += ', vibrant colors, bright natural lighting, energetic composition';
    } else if (feedback.includes('мини') || feedback.includes('minimal')) {
      enhancedPrompt += ', clean minimalist composition, simple background, focused subject';
    }
    
    // Add user feedback as context
    enhancedPrompt += `, incorporating user request: ${userFeedback}`;
    
    const enhancements = [
      'authentic photograph',
      'shot on professional camera',
      'natural lighting',
      'realistic depth of field',
      'no digital painting, no CGI',
      'magazine-quality photojournalism'
    ];

    return `${enhancedPrompt}, ${enhancements.join(', ')}`;
  }

  getFallbackImagePromptsWithFeedback(content, userFeedback, count) {
    console.log(`[${this.name}] Using fallback image prompts with feedback`);
    
    const fallbackPrompts = [
      `Professional workspace environment with natural lighting, incorporating: ${userFeedback}`,
      `Clean modern setting with soft shadows and natural atmosphere, incorporating: ${userFeedback}`,
      `Candid professional moment with authentic lighting, incorporating: ${userFeedback}`,
      `Minimalist clean background with focused subject, incorporating: ${userFeedback}`,
      `Natural environment with professional composition, incorporating: ${userFeedback}`
    ];

    return fallbackPrompts.slice(0, count);
  }

  // Создать fallback изображения с простыми градиентами
  async generateFallbackImages(content, headlines, count, model) {
    console.log(`[${this.name}] Generating ${count} fallback images`);
    
    const fallbackImages = [];
    const colors = [
      ['#4f46e5', '#7c3aed'], // indigo to purple
      ['#059669', '#0891b2'], // emerald to cyan
      ['#dc2626', '#ea580c'], // red to orange
      ['#1f2937', '#4b5563'], // gray to slate
      ['#7c2d12', '#a16207']  // brown to amber
    ];

    for (let i = 0; i < count; i++) {
      const [color1, color2] = colors[i % colors.length];
      
      // Создаем простое изображение с градиентом и текстом
      fallbackImages.push({
        id: i + 1,
        url: this.createGradientImageDataUrl(color1, color2, content?.title || 'Banner'),
        prompt: `Fallback gradient image ${i + 1}`,
        enhancedPrompt: `Simple gradient background from ${color1} to ${color2}`,
        optimizedPrompt: `Gradient fallback`,
        revisedPrompt: `Fallback gradient background`,
        model: model,
        isFallback: true,
        generatedAt: new Date().toISOString()
      });
    }
    
    console.log(`[${this.name}] Created ${fallbackImages.length} fallback images`);
    return fallbackImages;
  }

  // Создать Data URL для простого градиентного изображения
  createGradientImageDataUrl(color1, color2, title) {
    // Создаем SVG с градиентом и текстом
    const svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" 
              fill="white" font-size="48" font-family="Arial, sans-serif" 
              font-weight="bold" opacity="0.3">
          ${title.substring(0, 30)}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  // Retry механизм для генерации изображений (поддерживает Recraft и Nebius)
  async retryImageGeneration(prompt, model, options, maxRetries = 3) {
    let lastError;

    // Определяем провайдера по модели
    const isNebiusModel = Object.keys(NEBIUS_MODELS).includes(model);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[${this.name}] Image generation attempt ${attempt}/${maxRetries} using ${isNebiusModel ? 'Nebius' : 'Recraft'}`);

        let result;
        if (isNebiusModel) {
          result = await retryNebiusGeneration(prompt, model, options, 1); // 1 попытка в retryNebiusGeneration, общие попытки здесь
        } else {
          result = await callRecraftImageGeneration(prompt, model, options);
        }

        return result;
      } catch (error) {
        lastError = error;
        console.warn(`[${this.name}] Attempt ${attempt} failed:`, error.message);

        // Если ошибка не retryable или это последняя попытка - прекращаем
        if (!error.retryable || attempt === maxRetries) {
          break;
        }

        // Экспоненциальная задержка между попытками
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[${this.name}] Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Если все попытки провалились, создаем fallback изображение
    if (isNebiusModel) {
      console.warn(`[${this.name}] Creating Nebius fallback after all retries failed`);
      return createNebiusFallback(model);
    }

    throw lastError;
  }
}