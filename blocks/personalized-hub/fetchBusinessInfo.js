import { SUBSCRIPTION_KEY, ENDPOINTS } from '../chatbot/constants/api.js';

export default async function fetchBusinessInfo(businessName) {
  if (!businessName || !businessName.trim()) {
    throw new Error('Business name is required');
  }

  const endpoint = ENDPOINTS.businessInfo;
  const url = `${endpoint}?business_name=${encodeURIComponent(businessName.trim())}`;

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

  return JSON.parse(responseText);
}
