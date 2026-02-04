import { ENDPOINTS, SUBSCRIPTION_KEY, DEFAULT_PARAMS } from './constants/api.js';

const recommendationsData = await fetch('/blocks/sneak-peek/mock-data/recommendation_response.json').then((r) => r.json());
const businessInfoData = await fetch('/blocks/sneak-peek/mock-data/business_info.json').then((r) => r.json());

const MOCK_RECOMMENDATIONS = recommendationsData.recommendations[0] || [];
const MOCK_BUSINESS_INFO = businessInfoData.data || {};

// Enable mock data fallback when API is unavailable !!!
const USE_MOCK_FALLBACK = true;

/**
 * Fetch insights from the recommendations API
 * @param {Object} options - Query parameters
 * @param {string} options.business_type_id - Optional business type filter
 * @param {string} options.user_id - User ID
 * @returns {Promise<Array>} Array of transformed insight cards
 */
export async function fetchSneakPeek(options = {}) {
  const params = new URLSearchParams({
    ...DEFAULT_PARAMS,
    ...options,
  });

  const headers = {
    'X-Subscription-Key': SUBSCRIPTION_KEY,
    'X-User-ID': options.user_id,
    'X-Source': 'chefai-ui',
  };

  try {
    const response = await fetch(`${ENDPOINTS.recommendations}?${params}`, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        // No recommendations found - use mock data if enabled
        if (USE_MOCK_FALLBACK) {
          // eslint-disable-next-line no-console
          console.warn('API returned 404, using mock data');
          return MOCK_RECOMMENDATIONS;
        }
        return [];
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const recommendations = data.recommendations || [];

    // If no recommendations and mock fallback is enabled
    if (recommendations.length === 0 && USE_MOCK_FALLBACK) {
      // eslint-disable-next-line no-console
      console.warn('No API data available, using mock data');
      return MOCK_RECOMMENDATIONS;
    }

    // Transform and filter out invalid entries
    return recommendations
      .map(transformRecommendation)
      .filter(Boolean);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch insights:', error);

    // Use mock data as fallback on error
    if (USE_MOCK_FALLBACK) {
      // eslint-disable-next-line no-console
      console.warn('Using mock data due to API error');
      return MOCK_RECOMMENDATIONS;
    }

    return [];
  }
}


/**
 * Fetch insights from the recommendations API
 * @param {Object} options - Query parameters
 * @param {string} options.business_type_id - Optional business type filter
 * @param {string} options.user_id - User ID
 * @returns {Promise<Array>} Array of transformed insight cards
 */
export async function fetchBusinessInfo(options = {}) {
  const params = new URLSearchParams({
    ...DEFAULT_PARAMS,
    ...options,
  });

  const headers = {
    'X-Subscription-Key': SUBSCRIPTION_KEY,
    'X-User-ID': options.user_id,
    'X-Source': 'chefai-ui',
  };

  try {
    const response = await fetch(`${ENDPOINTS.recommendations}?${params}`, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        // No recommendations found - use mock data if enabled
        if (USE_MOCK_FALLBACK) {
          // eslint-disable-next-line no-console
          console.warn('API returned 404, using mock data');
          return MOCK_BUSINESS_INFO;
        }
        return [];
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const recommendations = data.recommendations || [];

    // If no recommendations and mock fallback is enabled
    if (recommendations.length === 0 && USE_MOCK_FALLBACK) {
      // eslint-disable-next-line no-console
      console.warn('No API data available, using mock data');
      return MOCK_BUSINESS_INFO;
    }

    // Transform and filter out invalid entries
    return recommendations
      .map(transformRecommendation)
      .filter(Boolean);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch insights:', error);

    // Use mock data as fallback on error
    if (USE_MOCK_FALLBACK) {
      // eslint-disable-next-line no-console
      console.warn('Using mock data due to API error');
      return MOCK_BUSINESS_INFO;
    }

    return [];
  }
}