import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import { getUserIdFromCookie } from '@scripts/custom/utils.js';

/**
 * Build payload for POST /api/v1/business/details.
 * Maps businessData (from confirmation) to the API shape.
 */
function buildBusinessDetailsPayload(businessData, userId) {
  const addressStr = businessData?.address ?? '';
  return {
    user_id: userId,
    name: businessData?.business_name ?? '',
    place_id: businessData?.place_id ?? '',
    street: businessData?.street ?? addressStr,
    house_number: businessData?.house_number ?? '',
    city: businessData?.city ?? '',
    postal_code: businessData?.postal_code ?? '',
    phone_number: businessData?.phone_number ?? '',
    url: businessData?.url ?? '',
    rating: businessData?.rating ?? null,
    business_type: businessData?.business_type ?? '',
    cuisine_type: businessData?.cuisine_type ?? '',
    keywords: Array.isArray(businessData?.keywords) ? businessData.keywords : [],
  };
}

export default async function saveBusinessDetails(businessData, providedUserId = null) {
  const userId = providedUserId ?? getUserIdFromCookie();

  if (!userId) {
    throw new Error('User ID is required to save business details.');
  }

  const payload = buildBusinessDetailsPayload(businessData, userId);

  const response = await fetch(ENDPOINTS.businessDetails, {
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': 'application/json',
      'X-Subscription-Key': SUBSCRIPTION_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // eslint-disable-next-line no-console
    console.error('Business details API error:', errorText);
    throw new Error(`Failed to save business details: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return null;
  }
}
