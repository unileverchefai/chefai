import { SUBSCRIPTION_KEY, ENDPOINTS } from '../../api/endpoints.js';
import { getUserIdFromCookie, setCookie } from '../../scripts/custom/utils.js';

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

    const userData = {
      user_id: userId,
      business_name: data.name ?? null,
      place_id: data.place_id ?? null,
      address: {
        street: data.street ?? null,
        house_number: data.house_number ?? null,
        city: data.city ?? null,
        postal_code: data.postal_code ?? null,
        country: data.country ?? null,
      },
      images: {
        image_url: data.image_url ?? null,
        logo_url: data.logo_url ?? null,
      },
      url: data.url ?? null,
      full_data: data,
    };

    // eslint-disable-next-line no-console
    console.log('[User Data] Complete business info from API:', userData);

    if (data) {
      // Set cookie user data
      setCookie('user_data', JSON.stringify(userData));
      document.dispatchEvent(new CustomEvent('userDataUpdated', { detail: userData }));
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Personalized Hub] Error while fetching saved business info:', error);
  }
}
