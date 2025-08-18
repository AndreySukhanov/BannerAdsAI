import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

// Function to fetch and extract text content from URL
async function fetchPageContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove script and style elements
    const scripts = document.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());
    
    // Extract useful content
    const title = document.querySelector('title')?.textContent?.trim() || '';
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
    const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).filter(Boolean);
    const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()).filter(Boolean);
    
    // Get main content (try to find main content areas)
    const mainSelectors = ['main', '[role="main"]', '.main-content', '#main-content', '.content', '#content'];
    let mainContent = '';
    
    for (const selector of mainSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        mainContent = element.textContent.trim().slice(0, 2000); // Limit content
        break;
      }
    }
    
    if (!mainContent) {
      // Fallback: get body text but limit it
      mainContent = document.body.textContent.trim().slice(0, 2000);
    }
    
    return {
      title,
      description,
      headings: [...h1s.slice(0, 3), ...h2s.slice(0, 5)], // Limit headings
      content: mainContent
    };
    
  } catch (error) {
    console.error('Error fetching page content:', error);
    return null;
  }
}

// OpenAI API call
async function callOpenAI(prompt, pageContent = null) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  let enhancedPrompt = prompt;
  
  // Add page content context if available
  if (pageContent) {
    const contextInfo = `
КОНТЕКСТ СТРАНИЦЫ:
Заголовок: ${pageContent.title}
Описание: ${pageContent.description}
Основные заголовки: ${pageContent.headings.join(', ')}
Содержание: ${pageContent.content.slice(0, 1500)}

---
${prompt}`;
    enhancedPrompt = contextInfo;
  }
  
  const response = await fetch(`${process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Ты профессиональный креативный директор, специалист по маркетингу и AI промптам. Ты можешь создавать рекламные заголовки, промпты для генерации изображений и другой креативный контент. Ты всегда точно следуешь инструкциям пользователя, включая требования к языку и формату ответа.'
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

export async function invokeLLM(req, res) {
  try {
    const { prompt, add_context_from_internet } = req.body;
    
    console.log('=== LLM Request ===');
    console.log('Prompt:', prompt.substring(0, 200) + '...');
    console.log('Add context:', add_context_from_internet);
    
    if (!prompt) {
      return res.status(400).json({
        error: 'Missing required parameter: prompt'
      });
    }
    
    let pageContent = null;
    
    // Extract URL from prompt if context is requested
    if (add_context_from_internet) {
      const urlMatch = prompt.match(/URL[:\s]+([^\s\n]+)/i);
      if (urlMatch) {
        const url = urlMatch[1];
        console.log(`Fetching content from: ${url}`);
        pageContent = await fetchPageContent(url);
      }
    }
    
    // Call OpenAI API
    const result = await callOpenAI(prompt, pageContent);
    
    res.json({
      result,
      ...(pageContent && { page_info: pageContent })
    });
    
  } catch (error) {
    console.error('LLM invoke error:', error);
    res.status(500).json({
      error: 'LLM API Error',
      message: error.message
    });
  }
}