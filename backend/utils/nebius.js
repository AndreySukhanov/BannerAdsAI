// Nebius AI Studio API Integration
import fetch from 'node-fetch';

const NEBIUS_API_URL = process.env.NEBIUS_BASE_URL || 'https://api.studio.nebius.ai/v1';

// Available Nebius AI Studio models for banner generation
export const NEBIUS_MODELS = {
  'flux-schnell': {
    id: 'black-forest-labs/flux-schnell',
    name: 'Flux.1 Schnell',
    description: 'Ультра-быстрая генерация (1.8 сек)',
    best_for: 'Быстрые прототипы, UI/UX элементы',
    cost: '$0.0013 per image',
    speed: 'ultra-fast'
  },
  'flux-dev': {
    id: 'black-forest-labs/flux-dev',
    name: 'Flux.1 Dev',
    description: 'Продакшн качество с продвинутым контролем',
    best_for: 'Маркетинговые материалы, e-commerce',
    cost: '$0.007 per image',
    speed: 'balanced'
  },
  'sdxl': {
    id: 'stabilityai/stable-diffusion-xl-base-1.0',
    name: 'Stable Diffusion XL',
    description: 'Премиум художественное качество',
    best_for: 'Высококачественные визуалы, детальные изображения',
    cost: '$0.003 per image',
    speed: 'quality-focused'
  }
};

/**
 * Call Nebius AI Studio image generation API
 * @param {string} prompt - The image generation prompt
 * @param {string} model - The model to use (flux-schnell, flux-dev, sdxl)
 * @param {Object} options - Additional generation options
 * @returns {Promise<Object>} Generated image data
 */
export async function callNebiusImageGeneration(prompt, model = 'flux-schnell', options = {}) {
  const NEBIUS_API_KEY = process.env.NEBIUS_API_KEY;
  if (!NEBIUS_API_KEY) {
    throw new Error('NEBIUS_API_KEY environment variable is not set');
  }

  const selectedModel = NEBIUS_MODELS[model];
  if (!selectedModel) {
    throw new Error(`Unknown Nebius model: ${model}. Available models: ${Object.keys(NEBIUS_MODELS).join(', ')}`);
  }

  // Default options
  const requestOptions = {
    model: selectedModel.id,
    prompt: prompt.trim(),
    size: options.size || '1024x1024',
    response_format: options.response_format || 'url',
    num_inference_steps: options.num_inference_steps || (model === 'flux-schnell' ? 4 : 20),
    ...options
  };

  // Remove undefined values
  Object.keys(requestOptions).forEach(key => {
    if (requestOptions[key] === undefined) {
      delete requestOptions[key];
    }
  });

  console.log(`[Nebius] Generating image with model: ${selectedModel.name}`);
  console.log(`[Nebius] Prompt length: ${prompt.length} characters`);

  try {
    const response = await fetch(`${NEBIUS_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEBIUS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestOptions)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Nebius] API Error ${response.status}:`, errorText);
      throw new Error(`Nebius API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.data || !result.data.length) {
      throw new Error('Nebius API returned no image data');
    }

    const imageData = result.data[0];

    return {
      url: imageData.url,
      revised_prompt: imageData.revised_prompt || prompt,
      model: selectedModel.name,
      model_id: selectedModel.id,
      size: requestOptions.size,
      generation_time: result.generation_time || null,
      cost_estimate: selectedModel.cost
    };

  } catch (error) {
    console.error(`[Nebius] Image generation failed:`, error.message);
    throw error;
  }
}

/**
 * Optimize prompt for specific Nebius models
 * @param {string} prompt - Original prompt
 * @param {string} model - Target model
 * @returns {string} Optimized prompt
 */
export function optimizePromptForNebius(prompt, model = 'flux-schnell') {
  let optimizedPrompt = prompt;

  switch (model) {
    case 'flux-schnell':
      // Flux Schnell works best with concise, direct prompts
      optimizedPrompt = `${prompt}, high quality, clean composition, professional`;
      break;

    case 'flux-dev':
      // Flux Dev can handle more detailed prompts
      optimizedPrompt = `${prompt}, highly detailed, professional photography, marketing quality, sharp focus, excellent composition`;
      break;

    case 'sdxl':
      // SDXL excels with artistic and style prompts
      optimizedPrompt = `${prompt}, masterpiece, best quality, ultra detailed, professional artwork, premium visual design, exceptional composition`;
      break;
  }

  return optimizedPrompt;
}

/**
 * Retry mechanism for Nebius API calls with exponential backoff
 * @param {string} prompt - Image prompt
 * @param {string} model - Model to use
 * @param {Object} options - Generation options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} Generated image data
 */
export async function retryNebiusGeneration(prompt, model, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await callNebiusImageGeneration(prompt, model, options);
      console.log(`[Nebius] Generation successful on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`[Nebius] Attempt ${attempt}/${maxRetries} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10s delay
        console.log(`[Nebius] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`Nebius generation failed after ${maxRetries} attempts: ${lastError.message}`);
}

/**
 * Generate fallback gradient image data for failed generations
 * @param {string} model - Failed model name
 * @returns {Object} Fallback image data
 */
export function createNebiusFallback(model = 'unknown') {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ];

  const gradient = gradients[Math.floor(Math.random() * gradients.length)];

  return {
    url: `data:image/svg+xml;base64,${Buffer.from(`
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" dy="0.3em">
          ${model.toUpperCase()} Fallback
        </text>
      </svg>
    `).toString('base64')}`,
    revised_prompt: 'Fallback gradient image',
    model: `${model} (fallback)`,
    model_id: 'fallback',
    size: '1024x1024',
    generation_time: null,
    cost_estimate: '$0.00',
    is_fallback: true
  };
}

export default {
  NEBIUS_MODELS,
  callNebiusImageGeneration,
  optimizePromptForNebius,
  retryNebiusGeneration,
  createNebiusFallback
};