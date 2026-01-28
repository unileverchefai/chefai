import { SUBSCRIPTION_KEY, ENDPOINTS } from '../chatbot/constants/api.js';
import { getUserIdFromToken } from '../authentication/tokenManager.js';

/**
 * Fetches the saved business info for the current user and logs
 * the business name to the console. Intended for debugging/verification.
 */
export default async function fetchSavedBusinessInfoAndLog() {
  try {
    const userId = getUserIdFromToken();
    if (!userId) {
      // eslint-disable-next-line no-console
      console.log('[Personalized Hub] No auth token found, skipping business info fetch.');
      return;
    }

    const endpoint = ENDPOINTS.businessInfo;
    const url = `${endpoint}?user_id=${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error('[Personalized Hub] Failed to fetch saved business info:', errorText);
      return;
    }

    const responseText = await response.text();
    if (!responseText) {
      // eslint-disable-next-line no-console
      console.log('[Personalized Hub] Business info API returned empty response.');
      return;
    }

    const json = JSON.parse(responseText);
    const data = json.data ?? {};

    const businessName = data.name ?? '';

    // Final debug output requested: log business name on page reload.
    // eslint-disable-next-line no-console
    console.log('[Personalized Hub] Saved business name from API:', businessName || '<none>');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Personalized Hub] Error while fetching saved business info:', error);
  }
}

