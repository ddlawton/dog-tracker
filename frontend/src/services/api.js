/**
 * API service for making HTTP requests to the backend
 */

const API_BASE = '/api';

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || 'Request failed',
        response.status,
        errorData.details || errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or parsing error
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      error
    );
  }
}

/**
 * Settings API
 */
export const settingsAPI = {
  async get() {
    return fetchAPI('/settings');
  },

  async update(timezone) {
    return fetchAPI('/settings', {
      method: 'PUT',
      body: JSON.stringify({ timezone })
    });
  }
};

/**
 * Activities API
 */
export const activitiesAPI = {
  async getAll(date = null) {
    const queryString = date ? `?date=${date}` : '';
    return fetchAPI(`/activities${queryString}`);
  },

  async create(activityData) {
    return fetchAPI('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData)
    });
  },

  async delete(id) {
    return fetchAPI(`/activities/${id}`, {
      method: 'DELETE'
    });
  },

  async getStats() {
    return fetchAPI('/activities/stats');
  },

  async export() {
    return fetchAPI('/export');
  }
};

/**
 * Health check API
 */
export const healthAPI = {
  async check() {
    return fetchAPI('/health');
  }
};

export { ApiError };
