// Image generation utilities for multi-agent system
import fetch from 'node-fetch';

export async function callOpenAIImageGeneration(prompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const requestBody = {
    model: options.model || process.env.OPENAI_IMAGE_MODEL || 'dall-e-3',
    prompt: `${prompt}\n\nStyle: An authentic photograph. Focus on realism, natural lighting, and photographic qualities like depth of field and lens characteristics. AVOID fantasy, sci-fi, and digital painting styles.`,
    // DALL·E 3 supports only these sizes: 1024x1024, 1024x1792, 1792x1024
    size: options.size || process.env.OPENAI_IMAGE_SIZE || '1024x1024',
    quality: options.quality || process.env.OPENAI_IMAGE_QUALITY || 'hd',
    n: 1,
    response_format: 'b64_json',
    ...options.extra
  };

  console.log(`[DALL-E] Generating image with prompt: ${prompt.substring(0, 100)}...`);
  
  const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI Image API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const first = data.data && data.data[0] ? data.data[0] : {};
  // Use base64 to ensure CORS-safe canvas composition on the client.
  // If API returns only a temporary URL, fetch it server-side and convert to base64.
  let imageUrl;
  if (first.b64_json) {
    imageUrl = `data:image/png;base64,${first.b64_json}`;
  } else if (first.url) {
    try {
      const imgRes = await fetch(first.url);
      if (!imgRes.ok) {
        throw new Error(`Image fetch failed: ${imgRes.status}`);
      }
      const arrayBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      imageUrl = `data:image/png;base64,${base64}`;
    } catch (e) {
      console.warn('[DALL-E] Fallback to remote URL due to fetch error:', e.message);
      imageUrl = first.url;
    }
  }
  return {
    url: imageUrl,
    revised_prompt: first.revised_prompt || prompt
  };
}