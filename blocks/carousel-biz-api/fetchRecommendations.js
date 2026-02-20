import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import { getUserIdFromCookie } from '@scripts/custom/utils.js';

const DEFAULT_PARAMS = {
  limit: 10,
  type: 'main',
  refresh: false,
  is_sneakpeek: false,
};

/**
 * Fetch business recommendations from the recommendations API.
 *
 * The block lives inside the personalized hub, which requires login, so a
 * userId is always expected at runtime. Falls back to 'staging-user' for
 * local/staging environments where no session cookie is present.
 *
 * @returns {Promise<Array>} Array of recommendation objects, or empty array on failure.
 */
export default async function fetchRecommendations() {
  const userId = getUserIdFromCookie() ?? 'staging-user';

  const headers = {
    Accept: 'application/json',
    'X-Subscription-Key': SUBSCRIPTION_KEY,
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    ...DEFAULT_PARAMS,
    user_id: userId,
    current_date: new Date().toISOString(),
  });

  try {
    const response = await fetch(`${ENDPOINTS.recommendations}/`, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Support both current and alternative response shapes
    return data.recommendations ?? data.data?.recommendations ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[carousel-biz-api] Failed to fetch recommendations:', error);
    return [];
  }
}
