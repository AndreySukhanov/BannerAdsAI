// Multi-Agent API Client for Banner Generation
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3006';

class MultiAgentAPIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'MultiAgentAPIError';
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
    console.log(`[MultiAgent] ${config.method || 'GET'} ${endpoint}`);
    console.log(`[MultiAgent] Request body:`, config.body);
    console.log(`[MultiAgent] Request headers:`, config.headers);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new MultiAgentAPIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }
    
    const data = await response.json();
    console.log(`[MultiAgent] Response:`, { success: data.success, taskId: data.taskId });
    return data;
    
  } catch (error) {
    if (error instanceof MultiAgentAPIError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new MultiAgentAPIError(
      `Network error: ${error.message}`,
      0,
      { originalError: error }
    );
  }
}

// Generate headlines using multi-agent system
export async function generateHeadlines(config) {
  try {
    console.log('[MultiAgent] Generating headlines:', { url: config.url, template: config.template });
    
    const response = await apiRequest('/api/agents/generate-headlines', {
      method: 'POST',
      body: JSON.stringify({
        url: config.url,
        template: config.template
      })
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to generate headlines');
    }
    
    return {
      headlines: response.headlines,
      webContent: response.webContent,
      taskId: response.taskId
    };
    
  } catch (error) {
    console.error('[MultiAgent] Headlines generation error:', error);
    throw new Error(`Failed to generate headlines: ${error.message}`);
  }
}

// Generate complete banner from URL
export async function generateCompleteBanner(config) {
  try {
    console.log('[MultiAgent] Generating complete banner:', {
      url: config.url,
      size: config.size,
      template: config.template,
      hasUploadedImage: !!config.uploadedImage
    });
    
    const response = await apiRequest('/api/agents/generate-banner', {
      method: 'POST',
      body: JSON.stringify({
        url: config.url,
        size: config.size,
        template: config.template,
        uploadedImage: config.uploadedImage
      })
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to generate banner');
    }
    
    return {
      headlines: response.headlines,
      images: response.images,
      banners: response.banners,
      webContent: response.webContent,
      taskId: response.taskId
    };
    
  } catch (error) {
    console.error('[MultiAgent] Complete banner generation error:', error);
    throw new Error(`Failed to generate banner: ${error.message}`);
  }
}

// Generate banner from selected headline
export async function generateBannerFromHeadline(config) {
  try {
    console.log('[MultiAgent] Generating banner from headline:', {
      headline: config.selectedHeadline?.substring(0, 30) + '...',
      size: config.size,
      template: config.template
    });
    
    const response = await apiRequest('/api/agents/generate-banner-from-headline', {
      method: 'POST',
      body: JSON.stringify({
        selectedHeadline: config.selectedHeadline,
        size: config.size,
        template: config.template,
        uploadedImage: config.uploadedImage,
        webContent: config.webContent,
        url: config.url
      })
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to generate banner from headline');
    }
    
    return {
      banners: response.banners,
      images: response.images,
      taskId: response.taskId
    };
    
  } catch (error) {
    console.error('[MultiAgent] Banner from headline error:', error);
    throw new Error(`Failed to generate banner: ${error.message}`);
  }
}

// Get task status
export async function getTaskStatus(taskId) {
  try {
    const response = await apiRequest(`/api/agents/task/${taskId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to get task status');
    }
    
    return response.task;
    
  } catch (error) {
    console.error('[MultiAgent] Get task status error:', error);
    throw new Error(`Failed to get task status: ${error.message}`);
  }
}

// Get system statistics
export async function getSystemStats() {
  try {
    const response = await apiRequest('/api/agents/stats');
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to get system stats');
    }
    
    return response.stats;
    
  } catch (error) {
    console.error('[MultiAgent] Get system stats error:', error);
    throw new Error(`Failed to get system stats: ${error.message}`);
  }
}

// File upload (reuse from existing client)
export async function uploadFile(file) {
  try {
    console.log('[MultiAgent] Uploading file:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiRequest('/api/upload-file', {
      method: 'POST',
      body: formData
    });
    
    return {
      file_url: response.file_url,
      filename: response.filename,
      size: response.size
    };
    
  } catch (error) {
    console.error('[MultiAgent] File upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

// Health check
export async function checkHealth() {
  try {
    const response = await apiRequest('/health');
    return response;
  } catch (error) {
    console.error('[MultiAgent] Health check failed:', error);
    throw error;
  }
}

// Export configuration
export const MULTI_AGENT_CONFIG = {
  baseUrl: API_BASE_URL,
  version: '2.0.0',
  agentSystem: 'multi-agent'
};