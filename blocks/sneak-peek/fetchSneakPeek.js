import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import { getUserIdFromCookie } from '@helpers/chatbot/utils.js';

const DEFAULT_PARAMS = {
  is_sneakpeek: true,
  limit: 3,
  refresh: false,
  type: 'main',
};

async function getActiveUserId() {
  const cookieUserId = getUserIdFromCookie();
  if (cookieUserId) {
    return cookieUserId;
  }
  return null;
}

/**
 * Fetch insights from the recommendations API
 * @param {Object} options - Query parameters
 * @param {string} options.business_type_id - Optional business type filter
 * @param {string} options.user_id - User ID
 * @returns {Promise<Object|null>} Single recommendation object or null
 */
export async function fetchSneakPeek() {
  const userId = await getActiveUserId();

  if (!userId) {
    // eslint-disable-next-line no-console
    console.warn('[Sneak Peek] No user id available, skipping recommendations fetch');
    return null;
  }

  const headers = {
    Accept: 'application/json',
    'X-Subscription-Key': SUBSCRIPTION_KEY,
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    ...DEFAULT_PARAMS,
    current_date: new Date().toISOString(),
    user_id: userId,
  });

  try {
    const response = await fetch(`${ENDPOINTS.recommendations}/`, { method: 'POST', headers, body });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const [firstRecommendation] = data.recommendations || [];

    if (!firstRecommendation) {
      // eslint-disable-next-line no-console
      console.warn('[Sneak Peek] Recommendations API returned no data');
      return null;
    }

    return firstRecommendation;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Sneak Peek] Failed to fetch recommendations:', error);
    return null;
  }
}

/**
 * Fetch insights from the recommendations API
 * @param {Object} options - Query parameters
 * @param {string} options.business_type_id - Optional business type filter
 * @param {string} options.user_id - User ID
 * @returns {Promise<Object|null>} Business info object or null
 */
export async function fetchBusinessInfo() {
  const userId = getUserIdFromCookie();

  if (!userId) {
    // eslint-disable-next-line no-console
    console.warn('[Sneak Peek] No user id available, skipping business info fetch');
    return null;
  }

  const url = `${ENDPOINTS.businessInfo}?user_id=${encodeURIComponent(userId)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const businessInfo = data.data || null;

    if (!businessInfo) {
      // eslint-disable-next-line no-console
      console.warn('[Sneak Peek] Business info API returned no data');
      return null;
    }

    return businessInfo;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Sneak Peek] Failed to fetch business info:', error);
    return null;
  }
}
