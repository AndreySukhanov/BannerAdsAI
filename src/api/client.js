// API Client for Banner Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3006';

class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  // Remove Content-Type for FormData requests
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }
    
    const data = await response.json();
    return data;
    
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new APIError(
      `Network error: ${error.message}`,
      0,
      { originalError: error }
    );
  }
}

// LLM API call
export async function InvokeLLM({ prompt, add_context_from_internet = false }) {
  try {
    console.log('Calling LLM API with prompt:', prompt.slice(0, 100) + '...');
    
    const response = await apiRequest('/api/invoke-llm', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        add_context_from_internet
      })
    });
    
    // Return the result string
    return response.result;
    
  } catch (error) {
    console.error('LLM API Error:', error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

// Image Generation API call
export async function GenerateImage({ prompt }) {
  try {
    console.log('Calling Image Generation API with prompt:', prompt.slice(0, 100) + '...');
    
    const response = await apiRequest('/api/generate-image', {
      method: 'POST',
      body: JSON.stringify({
        prompt
      })
    });
    
    // Return object with url property
    return {
      url: response.url,
      revised_prompt: response.revised_prompt
    };
    
  } catch (error) {
    console.error('Image Generation API Error:', error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}

// File Upload API call
export async function UploadFile({ file }) {
  try {
    console.log('Uploading file:', file.name, 'Size:', file.size);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiRequest('/api/upload-file', {
      method: 'POST',
      body: formData
    });
    
    // Return object with file_url property
    return {
      file_url: response.file_url,
      filename: response.filename,
      size: response.size
    };
    
  } catch (error) {
    console.error('File Upload API Error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

// Health check function
export async function checkAPIHealth() {
  try {
    const response = await apiRequest('/health');
    return response;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    throw error;
  }
}

// Export API configuration for debugging
export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  version: '1.0.0'
};