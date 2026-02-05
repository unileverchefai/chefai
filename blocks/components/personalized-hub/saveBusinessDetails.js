import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import { getUserIdFromCookie } from '@components/chatbot/utils.js';

export default async function saveBusinessDetails(businessData, providedUserId = null) {
  const userId = providedUserId ?? getUserIdFromCookie();

  if (!userId) {
    throw new Error('User ID is required to save business details.');
  }

  const endpoint = `${ENDPOINTS.businessDetails}`;

  const payload = {
    user_id: userId,
    place_id: businessData?.place_id ?? '',
    name: businessData?.business_name ?? '',
    street: businessData?.street ?? '',
    house_number: businessData?.house_number ?? '',
    city: businessData?.city ?? '',
    postal_code: businessData?.postal_code ?? '',
    country: businessData?.country ?? '',
    image_url: businessData?.image_url ?? '',
    logo_url: businessData?.logo_url ?? '',
    url: businessData?.url ?? '',
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
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
