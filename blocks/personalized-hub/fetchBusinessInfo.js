import { SUBSCRIPTION_KEY, ENDPOINTS } from '../chatbot/constants/api.js';

const TEMP_USER_ID = 'user123';

export default async function fetchBusinessInfo(businessName) {
  if (!businessName || !businessName.trim()) {
    throw new Error('Business name is required');
  }

  const trimmedName = businessName.trim();
  const endpoint = ENDPOINTS.businessInfo;
  const url = `${endpoint}?user_id=${encodeURIComponent(TEMP_USER_ID)}&name=${encodeURIComponent(trimmedName)}`;

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
    console.error('Business info API error:', errorText);
    throw new Error(`Failed to fetch business info: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  if (!responseText) {
    throw new Error('API returned empty response');
  }

  const json = JSON.parse(responseText);

  if (!json.success) {
    throw new Error(json.message ?? 'Business info API returned an error');
  }

  const data = json.data ?? {};

  const addressParts = [
    data.street,
    data.house_number,
    data.city,
    data.postal_code,
    data.country,
  ].filter(Boolean);

  return {
    business_name: data.name ?? trimmedName,
    address: addressParts.join(', '),
    image_url: data.image_url ?? '',
    logo_url: '',
  };
}
