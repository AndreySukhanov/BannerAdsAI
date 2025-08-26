// History API Client
import { getCurrentUserId } from '@/utils/user-id';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3006';

class HistoryAPIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'HistoryAPIError';
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
  
  try {
    console.log(`[HistoryAPI] ${config.method || 'GET'} ${endpoint}`);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new HistoryAPIError(
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData
      );
    }
    
    const data = await response.json();
    console.log(`[HistoryAPI] Response:`, { success: data.success });
    return data;
    
  } catch (error) {
    if (error instanceof HistoryAPIError) {
      throw error;
    }
    
    // Network or parsing errors
    throw new HistoryAPIError(
      `Network error: ${error.message}`,
      0,
      { originalError: error }
    );
  }
}

// Get user history
export async function getUserHistory(sessionId, options = {}) {
  try {
    console.log('[HistoryAPI] Getting user history:', { sessionId, ...options });
    
    const queryParams = new URLSearchParams();
    if (options.page) queryParams.set('page', options.page);
    if (options.limit) queryParams.set('limit', options.limit);
    if (options.sortBy) queryParams.set('sortBy', options.sortBy);
    if (options.sortOrder) queryParams.set('sortOrder', options.sortOrder);
    
    const response = await apiRequest(`/api/history/${sessionId}?${queryParams}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to get user history');
    }
    
    return {
      data: response.data,
      pagination: response.pagination
    };
    
  } catch (error) {
    console.error('[HistoryAPI] Get user history error:', error);
    throw new Error(`Failed to get user history: ${error.message}`);
  }
}

// Get specific generation
export async function getGeneration(generationId, sessionId) {
  try {
    console.log('[HistoryAPI] Getting generation:', { generationId, sessionId });
    
    const queryParams = new URLSearchParams();
    if (sessionId) queryParams.set('sessionId', sessionId);
    
    const response = await apiRequest(`/api/generation/${generationId}?${queryParams}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to get generation');
    }
    
    return {
      data: response.data
    };
    
  } catch (error) {
    console.error('[HistoryAPI] Get generation error:', error);
    throw new Error(`Failed to get generation: ${error.message}`);
  }
}

// Save generation
export async function saveGeneration(generationData) {
  try {
    console.log('[HistoryAPI] Saving generation:', {
      sessionId: generationData.sessionId,
      hasInput: !!generationData.input,
      hasOutput: !!generationData.output
    });
    
    const response = await apiRequest('/api/generation', {
      method: 'POST',
      body: JSON.stringify(generationData)
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to save generation');
    }
    
    return {
      generationId: response.generationId
    };
    
  } catch (error) {
    console.error('[HistoryAPI] Save generation error:', error);
    throw new Error(`Failed to save generation: ${error.message}`);
  }
}

// Delete generation
export async function deleteGeneration(generationId, sessionId) {
  try {
    console.log('[HistoryAPI] Deleting generation:', { generationId, sessionId });
    
    const response = await apiRequest(`/api/generation/${generationId}`, {
      method: 'DELETE',
      body: JSON.stringify({ sessionId })
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete generation');
    }
    
    return response;
    
  } catch (error) {
    console.error('[HistoryAPI] Delete generation error:', error);
    throw new Error(`Failed to delete generation: ${error.message}`);
  }
}

// Get user stats
export async function getUserStats(sessionId) {
  try {
    console.log('[HistoryAPI] Getting user stats:', { sessionId });
    
    const response = await apiRequest(`/api/history/${sessionId}/stats`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to get user stats');
    }
    
    return {
      data: response.data
    };
    
  } catch (error) {
    console.error('[HistoryAPI] Get user stats error:', error);
    throw new Error(`Failed to get user stats: ${error.message}`);
  }
}

// Reproduce generation (load settings for re-editing)
export async function reproduceGeneration(generationId, sessionId) {
  try {
    console.log('[HistoryAPI] Reproducing generation:', { generationId, sessionId });
    
    const queryParams = new URLSearchParams();
    if (sessionId) queryParams.set('sessionId', sessionId);
    
    const response = await apiRequest(`/api/generation/${generationId}/reproduce?${queryParams}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to reproduce generation');
    }
    
    return {
      data: response.data
    };
    
  } catch (error) {
    console.error('[HistoryAPI] Reproduce generation error:', error);
    throw new Error(`Failed to reproduce generation: ${error.message}`);
  }
}

// Search in history
export async function searchHistory(sessionId, options = {}) {
  try {
    console.log('[HistoryAPI] Searching history:', { sessionId, ...options });
    
    const queryParams = new URLSearchParams();
    if (options.query) queryParams.set('query', options.query);
    if (options.type) queryParams.set('type', options.type);
    if (options.page) queryParams.set('page', options.page);
    if (options.limit) queryParams.set('limit', options.limit);
    
    const response = await apiRequest(`/api/history/${sessionId}/search?${queryParams}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to search history');
    }
    
    return {
      data: response.data,
      pagination: response.pagination,
      query: response.query,
      type: response.type
    };
    
  } catch (error) {
    console.error('[HistoryAPI] Search history error:', error);
    throw new Error(`Failed to search history: ${error.message}`);
  }
}

// Get current user ID (compatibility wrapper)
export function getSessionId() {
  return getCurrentUserId();
}

// Legacy function for backward compatibility
export function generateSessionId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `session_${timestamp}_${randomStr}`;
}

// Clear all user history
export async function clearUserHistory(sessionId) {
  try {
    console.log('[HistoryAPI] Clearing all history for session:', sessionId);
    
    const response = await apiRequest(`/api/history/${sessionId}/clear`, {
      method: 'DELETE'
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to clear history');
    }
    
    return {
      clearedCount: response.clearedCount
    };
    
  } catch (error) {
    console.error('[HistoryAPI] Clear history error:', error);
    throw new Error(`Failed to clear history: ${error.message}`);
  }
}

// Save downloaded banner to history
export async function saveDownloadedBanner(sessionId, bannerData, generationContext) {
  try {
    console.log('[HistoryAPI] Saving downloaded banner:', {
      sessionId,
      bannerData: !!bannerData,
      generationContext: !!generationContext
    });
    
    const response = await apiRequest('/api/banner/download', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        bannerData,
        generationContext
      })
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to save downloaded banner');
    }
    
    return {
      generationId: response.generationId
    };
    
  } catch (error) {
    console.error('[HistoryAPI] Save downloaded banner error:', error);
    throw new Error(`Failed to save downloaded banner: ${error.message}`);
  }
}

// Export configuration
export const HISTORY_CONFIG = {
  baseUrl: API_BASE_URL,
  version: '1.0.0',
  storageKey: 'bannerads_session_id'
};