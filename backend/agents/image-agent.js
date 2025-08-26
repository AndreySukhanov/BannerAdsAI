// Image Agent - Specialized in generating images and visual content using Recraft.ai
import { callOpenAI } from '../utils/openai.js';
import { callRecraftImageGeneration, optimizePromptForRecraft, RECRAFT_MODELS } from '../utils/recraft.js';

export class ImageAgent {
  constructor() {
    this.name = 'ImageAgent';
  }

  async generateImages({ content, headlines, count = 3, model = 'recraftv3' }) {
    console.log(`[${this.name}] Generating ${count} images for content: ${content.title} using model: ${model}`);
    
    try {
      // Step 1: Generate image prompts based on content and headlines
      const imagePrompts = await this.generateImagePrompts(content, headlines, count);
      
      // Step 2: Generate actual images from prompts
      const imagePromises = imagePrompts.map(async (prompt, index) => {
        try {
          const enhancedPrompt = this.enhancePrompt(prompt);
          const optimizedPrompt = optimizePromptForRecraft(enhancedPrompt, model);
          
          // Limit prompt length to 1000 characters for Recraft.ai
          const finalPrompt = optimizedPrompt.length > 1000 
            ? optimizedPrompt.substring(0, 997) + '...'
            : optimizedPrompt;
            
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
            generatedAt: new Date().toISOString()
          };
        } catch (error) {
          console.error(`[${this.name}] Failed to generate image ${index + 1}:`, error.message);
          return null;
        }
      });

      const images = (await Promise.all(imagePromises)).filter(img => img !== null);
      
      console.log(`[${this.name}] Successfully generated ${images.length}/${count} images`);
      
      return images;

    } catch (error) {
      console.error(`[${this.name}] Error in image generation:`, error);
      return [];
    }
  }

  async generateImagePrompts(content, headlines, count) {
    console.log(`[${this.name}] Generating ${count} image prompts`);
    
    const systemPrompt = `You are a photo editor for a prestigious science and nature magazine (like National Geographic or Nature).
    Your task is to commission genuine, technically accurate, and compelling photographs.
    The images must look like they were captured by professional photographers on location with real camera equipment.
    Crucially, you must distinguish between an authentic photograph and a digital illustration/CGI. Reject anything that looks like fantasy, sci-fi, or digital painting.`;

    const headlinesText = headlines.map(h => h.text || h).join('\n');
    
    const userPrompt = `Analyze this content and create ${count} authentic photographic concepts. The images must be strictly photorealistic and suitable for a science magazine cover.

CONTENT TO ANALYZE:
Title: ${content.title}
Description: ${content.description}
Banner Headlines: ${headlinesText}

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
  async regenerateImages({ content, headlines, userFeedback, model = 'recraftv3', count = 3 }) {
    console.log(`[${this.name}] Regenerating ${count} images with user feedback: "${userFeedback}"`);
    
    try {
      // Step 1: Generate new image prompts based on feedback
      const imagePrompts = await this.generateImagePromptsWithFeedback(content, headlines, userFeedback, count);
      
      // Step 2: Generate actual images from enhanced prompts
      const imagePromises = imagePrompts.map(async (prompt, index) => {
        try {
          const enhancedPrompt = this.enhancePromptWithFeedback(prompt, userFeedback);
          const optimizedPrompt = optimizePromptForRecraft(enhancedPrompt, model);
          
          // Limit prompt length to 1000 characters for Recraft.ai
          const finalPrompt = optimizedPrompt.length > 1000 
            ? optimizedPrompt.substring(0, 997) + '...'
            : optimizedPrompt;
            
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
      
      return images;

    } catch (error) {
      console.error(`[${this.name}] Error in image regeneration:`, error);
      return [];
    }
  }

  async generateImagePromptsWithFeedback(content, headlines, userFeedback, count) {
    console.log(`[${this.name}] Generating ${count} image prompts with user feedback`);
    
    const systemPrompt = `You are a photo editor for a prestigious science and nature magazine.
    Your task is to commission genuine, technically accurate, and compelling photographs based on user feedback.
    The images must look like they were captured by professional photographers on location with real camera equipment.`;

    const headlinesText = headlines.map(h => h.text || h).join('\n');
    
    const userPrompt = `Analyze this content and create ${count} authentic photographic concepts based on user feedback.

CONTENT TO ANALYZE:
Title: ${content.title}
Description: ${content.description}
Banner Headlines: ${headlinesText}

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
}