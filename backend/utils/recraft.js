// Recraft.ai API Integration
import fetch from 'node-fetch';

const RECRAFT_API_URL = 'https://external.api.recraft.ai/v1';

// Available Recraft.ai models for banner generation
export const RECRAFT_MODELS = {
  'recraftv3': {
    id: 'recraftv3',
    name: 'Recraft V3',
    description: 'Универсальная модель высокого качества',
    best_for: 'Общие цели, разнообразные стили'
  },
  'realistic': {
    id: 'recraftv3', 
    name: 'Realistic',
    description: 'Фотореалистичные изображения (через Recraft V3)',
    best_for: 'Реалистичные фотографии, продукты'
  },
  'digital_illustration': {
    id: 'recraftv3',
    name: 'Digital Illustration', 
    description: 'Цифровые иллюстрации (через Recraft V3)',
    best_for: 'Яркие рекламные изображения'
  },
  'vector_illustration': {
    id: 'recraftv3',
    name: 'Vector Art',
    description: 'Векторная графика (через Recraft V3)',
    best_for: 'Чистые геометрические формы'
  }
};

export async function callRecraftImageGeneration(prompt, model = 'recraftv3', options = {}) {
  const RECRAFT_API_KEY = process.env.RECRAFT_API_KEY;
  
  if (!RECRAFT_API_KEY) {
    const error = new Error('RECRAFT_API_KEY не установлен в переменных окружения');
    error.code = 'MISSING_API_KEY';
    error.type = 'configuration';
    throw error;
  }

  // Validate model
  if (!RECRAFT_MODELS[model]) {
    const error = new Error(`Неподдерживаемая модель: ${model}. Доступные модели: ${Object.keys(RECRAFT_MODELS).join(', ')}`);
    error.code = 'INVALID_MODEL';
    error.type = 'validation';
    throw error;
  }

  // Get the correct model ID
  const modelId = RECRAFT_MODELS[model]?.id || model;
  
  const requestData = {
    prompt: prompt,
    model: modelId,
    size: options.size || '1024x1024',
    n: options.n || 1,
    response_format: 'url',
    ...options
  };

  console.log(`[Recraft] Generating image with model: ${model}`);
  console.log(`[Recraft] Prompt: ${prompt.substring(0, 100)}...`);

  try {
    const response = await fetch(`${RECRAFT_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RECRAFT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(getRecraftErrorMessage(response.status, errorData));
      error.code = 'RECRAFT_API_ERROR';
      error.status = response.status;
      error.type = 'api';
      error.details = errorData;
      throw error;
    }

    const result = await response.json();
    
    if (!result.data || !result.data[0]) {
      throw new Error('Неожиданный формат ответа от Recraft API');
    }

    console.log(`[Recraft] Image generated successfully with model: ${model}`);
    
    return {
      url: result.data[0].url,
      model: model,
      revised_prompt: result.data[0].revised_prompt || prompt,
      created: result.created,
      size: requestData.size
    };

  } catch (error) {
    console.error('[Recraft] Image generation failed:', error);
    throw error;
  }
}

export async function getRecraftModels() {
  const RECRAFT_API_KEY = process.env.RECRAFT_API_KEY;
  
  try {
    const response = await fetch(`${RECRAFT_API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${RECRAFT_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`[Recraft] Could not fetch models: ${response.status}`);
      return Object.values(RECRAFT_MODELS);
    }

    const result = await response.json();
    return result.data || Object.values(RECRAFT_MODELS);

  } catch (error) {
    console.warn('[Recraft] Using fallback models:', error.message);
    return Object.values(RECRAFT_MODELS);
  }
}

// Helper function to optimize prompts for Recraft.ai
export function optimizePromptForRecraft(prompt, model = 'recraftv3') {
  let optimizedPrompt = prompt;

  // Model-specific optimizations
  switch (model) {
    case 'realistic':
      optimizedPrompt = `High-quality photograph, professional studio lighting, sharp focus, ${prompt}, photorealistic, ultra-detailed, commercial photography, professional composition`;
      break;
    case 'digital_illustration':
      optimizedPrompt = `Digital art style illustration, highly detailed, vibrant colors, glowing light effects, sharp outlines, smooth textures, fantasy atmosphere, dramatic contrast, artistic stylization, not photorealistic, imaginative composition, ${prompt}`;
      break;
    case 'vector_illustration':
      optimizedPrompt = `Vector art style, clean bold lines, geometric shapes, flat colors, ${prompt}, minimal design, modern flat design illustration, simple composition, scalable graphics`;
      break;
    default: // recraftv3
      optimizedPrompt = `High-quality image, professional, ${prompt}, detailed, modern`;
  }

  return optimizedPrompt;
}

// Helper function for user-friendly error messages
function getRecraftErrorMessage(status, errorData) {
  const errorMessages = {
    400: 'Неверный запрос к Recraft API. Проверьте параметры генерации.',
    401: 'Неверный API ключ Recraft. Проверьте настройки.',
    402: 'Недостаточно средств на аккаунте Recraft.',
    403: 'Доступ запрещен. Проверьте права API ключа.',
    404: 'Модель Recraft не найдена.',
    429: 'Превышен лимит запросов к Recraft API. Попробуйте позже.',
    500: 'Внутренняя ошибка сервера Recraft.',
    502: 'Recraft API временно недоступен.',
    503: 'Сервис Recraft перегружен. Попробуйте позже.'
  };

  const userMessage = errorMessages[status] || 'Произошла ошибка при обращении к Recraft API.';
  const detailMessage = errorData.message ? ` Детали: ${errorData.message}` : '';
  
  return userMessage + detailMessage;
}

export default {
  callRecraftImageGeneration,
  getRecraftModels,
  optimizePromptForRecraft,
  RECRAFT_MODELS
};