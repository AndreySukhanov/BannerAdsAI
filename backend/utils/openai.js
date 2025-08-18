// OpenAI utilities for multi-agent system
import fetch from 'node-fetch';

export async function callOpenAI(systemPrompt, userPrompt, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const requestBody = {
    model: options.model || process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    max_tokens: options.maxTokens || 500,
    temperature: options.temperature || 0.7,
    ...options.extra
  };

  console.log(`[OpenAI] API call with model: ${requestBody.model}`);
  
  const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}