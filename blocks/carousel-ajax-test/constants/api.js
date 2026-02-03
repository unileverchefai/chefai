import { API_BASE_URL, SUBSCRIPTION_KEY } from '../../components/chatbot/constants/api.js';

export { SUBSCRIPTION_KEY };

export const ENDPOINTS = {
  getUserThreads: `${API_BASE_URL}/chat/users/threads`,
};

/**
 * Fetch data with pagination support
 * @param {Object} options - Query parameters
 * @param {string} options.user_id - User ID (required)
 * @param {number} options.limit - Number of items per page
 * @param {number} options.offset - Offset for pagination
 * @param {boolean} [options.is_saved] - Optional filter for saved threads
 * @returns {Promise<Array>} Array of items
 */
export async function fetchPaginatedData(options = {}) {
  const {
    user_id,
    limit = 5,
    offset = 0,
    is_saved,
  } = options;

  if (!user_id) {
    throw new Error('user_id is required');
  }

  const params = new URLSearchParams({
    user_id,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (is_saved !== undefined) {
    params.append('is_saved', is_saved.toString());
  }

  try {
    const response = await fetch(`${ENDPOINTS.getUserThreads}?${params}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    // Handle different response formats
    return Array.isArray(data) ? data : (data.threads ?? data.data ?? []);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch paginated data:', error);
    throw error;
  }
}
