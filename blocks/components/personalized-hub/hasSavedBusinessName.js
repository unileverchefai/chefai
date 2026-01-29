import { SUBSCRIPTION_KEY, ENDPOINTS } from '../chatbot/constants/api.js';
import { getUserIdFromToken } from '../authentication/tokenManager.js';
import { getAnonymousUserId } from '../chatbot/utils.js';

export default async function hasSavedBusinessName() {
  try {
    const rawUserId = getUserIdFromToken();
    const userId = rawUserId || await getAnonymousUserId();

    if (!ENDPOINTS.businessInfo) {
      return false;
    }

    const url = `${ENDPOINTS.businessInfo}?user_id=${encodeURIComponent(userId)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      return false;
    }

    const responseText = await response.text();
    if (!responseText) {
      return false;
    }

    const json = JSON.parse(responseText);
    const data = json.data ?? {};
    const businessName = (data.name ?? '').trim();

    return businessName.length > 0;
  } catch {
    return false;
  }
}
