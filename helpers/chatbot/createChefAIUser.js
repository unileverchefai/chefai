import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import { COUNTRY_CODE, LANGUAGE_CODE } from '@api/authentication/constants.js';

export default async function createChefAIUser(userId, userName, businessData = null) {
  if (!userId) {
    throw new Error('User ID is required to create ChefAI user');
  }

  // Build metadata with business_verified if business data exists
  const metadata = {};
  if (businessData && businessData.business_name) {
    let addressStr = businessData.address ?? '';
    if (!addressStr && (businessData.street || businessData.city || businessData.country)) {
      addressStr = [
        businessData.street,
        businessData.house_number,
        businessData.city,
        businessData.postal_code,
        businessData.country,
      ].filter(Boolean).join(', ');
    }

    metadata.business_verified = {
      name: businessData.business_name ?? '',
      address: addressStr || '',
      rating: businessData.rating ?? null,
      price_level: businessData.price_level ?? null,
      place_id: businessData.place_id ?? '',
      phone_number: businessData.phone_number ?? '',
      image_url: businessData.image_url ?? '',
      types: businessData.types ?? [],
      website_uri: businessData.url ?? '',
    };
  }
  metadata.additionalProperty = 'anything';

  const payload = {
    user_id: userId,
    country: COUNTRY_CODE,
    content_language_code: LANGUAGE_CODE.toUpperCase(),
    user_name: userName ?? '',
    metadata,
    tc_agreed: true,
  };

  const response = await fetch(ENDPOINTS.users, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'X-Subscription-Key': SUBSCRIPTION_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // eslint-disable-next-line no-console
    console.error('[ChefAI User] Failed to create user:', errorText);
    throw new Error(`Failed to create ChefAI user: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  if (!responseText) {
    return null;
  }

  const json = JSON.parse(responseText);
  // eslint-disable-next-line no-console
  console.log('[ChefAI User] User created successfully:', json);
  return json;
}
