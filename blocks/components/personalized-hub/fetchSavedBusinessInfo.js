import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import { getUserIdFromCookie } from '@components/chatbot/utils.js';

export default async function fetchSavedBusinessInfoAndLog() {
  try {
    const userId = getUserIdFromCookie();

    if (!userId) {
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
      return;
    }

    const json = JSON.parse(responseText);
    const data = json.data ?? {};

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
