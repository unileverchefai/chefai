import { SUBSCRIPTION_KEY, ENDPOINTS } from './endpoints.js';

/**
 * Load mock recommendations data since API is not working....
 * @returns {Promise<Array>} Mock recommendations
 */
async function loadMockRecommendations() {
  try {
    const response = await fetch('/blocks/carousel-biz-api/mock-data/recommendation_response.json');
    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load mock data:', error);
    return [];
  }
}

/**
 * Fetch recommendations from API
 * @param {Object} options - Request options
 * @param {string} options.userId - User ID for personalized recommendations
 * @param {string} options.countryCode - Country code (default: 'BE')
 * @param {string} options.languageCode - Language code (default: 'en')
 * @param {number} options.limit - Maximum number of recommendations
 * @returns {Promise<Array>} Array of recommendation objects
 */
export async function fetchTimeBasedRecommendations(options = {}) {
  const {
    userId = 'staging-user',
    limit = 10,
    type = 'main',
    isSneakPeek = false,
  } = options;

  const currentDate = new Date().toISOString();

  const payload = {
    user_id: userId,
    current_date: currentDate,
    limit,
    type,
    is_sneakpeek: isSneakPeek,
  };

  try {
    // eslint-disable-next-line no-console
    console.log('[Recommendations API] Fetching from:', ENDPOINTS.recommendations);
    // eslint-disable-next-line no-console
    console.log('[Recommendations API] Payload:', payload);

    const response = await fetch(ENDPOINTS.recommendations, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // eslint-disable-next-line no-console
    console.log('[Recommendations API] Response status:', response.status);
    // eslint-disable-next-line no-console
    console.log('[Recommendations API] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error('[Recommendations API] Error response:', errorText);
      throw new Error(`Failed to fetch recommendations: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // eslint-disable-next-line no-console
    console.log('[Recommendations API] Success! Received', data.recommendations?.length || 0, 'recommendations');
    return data.recommendations ?? data.data?.recommendations ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Recommendations API] Error details:', {
      message: error.message,
      stack: error.stack,
      endpoint: ENDPOINTS.recommendations,
    });

    // Fallback to mock data if API fails
    // eslint-disable-next-line no-console
    console.warn('[Recommendations API] Using mock data as fallback');
    const mockData = await loadMockRecommendations();
    return mockData.slice(0, limit);
  }
}

/**
 * Fetch business types for filter dropdown
 * @returns {Promise<Array>} Array of business type objects
 */
export async function fetchBusinessTypes() {
  try {
    const response = await fetch(ENDPOINTS.businessTypes, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch business types: ${response.status}`);
    }

    const data = await response.json();
    return data.business_types ?? data.data ?? data ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch business types:', error);
    return [];
  }
}
