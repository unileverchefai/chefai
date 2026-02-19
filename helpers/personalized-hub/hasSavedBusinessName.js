import { SUBSCRIPTION_KEY, ENDPOINTS } from '../../scripts/custom/api/endpoints.js';
import { getUserIdFromCookie, getAnonymousUserId } from '../../scripts/custom/utils.js';

export function hasConfirmedBusiness() {
  try {
    const stored = sessionStorage.getItem('personalized-hub-business-data');
    if (!stored) return false;
    const businessData = JSON.parse(stored);
    const name = typeof businessData?.business_name === 'string' ? businessData.business_name.trim() : '';
    return name.length > 0;
  } catch {
    return false;
  }
}

export default async function hasSavedBusinessName() {
  try {
    const hasConsent = document.cookie
      .split(';')
      .some((c) => c.trim().startsWith('personalized-hub-consent=true'));

    if (!hasConsent) {
      return false;
    }

    const rawUserId = getUserIdFromCookie();
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
