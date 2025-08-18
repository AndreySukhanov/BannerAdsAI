import fetch from 'node-fetch';

// OpenAI DALL-E 3 API call
async function callOpenAIImageGeneration(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: prompt,
      size: '1024x1024',
      quality: 'hd',
      n: 1
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI Image API error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return {
    url: data.data[0].url,
    revised_prompt: data.data[0].revised_prompt || prompt
  };
}

// Stability AI API call (alternative)
async function callStabilityAI(prompt) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error('Stability AI API key not configured');
  }
  
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text_prompts: [{ text: prompt }],
      cfg_scale: 7,
      height: 1024,
      width: 1024,
      samples: 1,
      steps: 30
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Stability AI error: ${error.message || response.statusText}`);
  }
  
  const data = await response.json();
  const imageBase64 = data.artifacts[0].base64;
  
  // Convert base64 to data URL
  const dataUrl = `data:image/png;base64,${imageBase64}`;
  
  return {
    url: dataUrl,
    revised_prompt: prompt
  };
}

// Together AI API call (alternative)
async function callTogetherAI(prompt) {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error('Together AI API key not configured');
  }
  
  const response = await fetch('https://api.together.xyz/inference', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'stabilityai/stable-diffusion-xl-base-1.0',
      prompt: prompt,
      width: 1024,
      height: 1024,
      steps: 20,
      n: 1
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Together AI error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  
  return {
    url: data.output.choices[0].image_base64 ? 
         `data:image/png;base64,${data.output.choices[0].image_base64}` : 
         data.output.choices[0].image_url,
    revised_prompt: prompt
  };
}

export async function generateImage(req, res) {
  try {
    const { prompt } = req.body;
    
    console.log('=== Image Generation Request ===');
    console.log('Prompt:', prompt.substring(0, 150) + '...');
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required parameter: prompt'
      });
    }
    
    let result;
    
    // Try different image generation APIs based on available keys
    if (process.env.OPENAI_API_KEY) {
      console.log('Using OpenAI DALL-E 3 for image generation');
      result = await callOpenAIImageGeneration(prompt);
    } else if (process.env.STABILITY_API_KEY) {
      console.log('Using Stability AI for image generation');
      result = await callStabilityAI(prompt);
    } else if (process.env.TOGETHER_API_KEY) {
      console.log('Using Together AI for image generation');
      result = await callTogetherAI(prompt);
    } else {
      throw new Error('No image generation API key configured. Please set OPENAI_API_KEY, STABILITY_API_KEY, or TOGETHER_API_KEY');
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({
      error: 'Image Generation Error',
      message: error.message
    });
  }
}