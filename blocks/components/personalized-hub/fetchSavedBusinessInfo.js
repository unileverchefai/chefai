import { SUBSCRIPTION_KEY, ENDPOINTS } from '../chatbot/constants/api.js';
import { getUserIdFromToken } from '../authentication/tokenManager.js';

/**
 * Fetches the saved business info for the current user and logs
 * the business name to the console. Intended for debugging/verification.
 */
export default async function fetchSavedBusinessInfoAndLog() {
  try {
    const rawUserId = getUserIdFromToken();

    if (!rawUserId) {
      // eslint-disable-next-line no-console
      console.warn('[User Data] No user_id found in token. Cannot fetch business info.');
      return;
    }

    const userId = rawUserId;
    const endpoint = ENDPOINTS.businessInfo;
    const url = `${endpoint}?user_id=${encodeURIComponent(userId)}`;

    // eslint-disable-next-line no-console
    console.log('[User Data] Fetching business info for user_id:', userId);

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

    // Log complete user business data
    // eslint-disable-next-line no-console
    console.log('[User Data] Complete business info from API:', {
      user_id: userId,
      business_name: data.name ?? '<none>',
      place_id: data.place_id ?? '<none>',
      address: {
        street: data.street ?? '<none>',
        house_number: data.house_number ?? '<none>',
        city: data.city ?? '<none>',
        postal_code: data.postal_code ?? '<none>',
        country: data.country ?? '<none>',
      },
      images: {
        image_url: data.image_url ?? '<none>',
        logo_url: data.logo_url ?? '<none>',
      },
      url: data.url ?? '<none>',
      full_data: data,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Personalized Hub] Error while fetching saved business info:', error);
  }
}
