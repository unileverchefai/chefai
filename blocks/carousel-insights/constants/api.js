import { SUBSCRIPTION_KEY, ENDPOINTS } from '@components/chatbot/constants/api.js';

export { SUBSCRIPTION_KEY };

export async function fetchPaginatedData(options = {}) {
  const {
    isSneakpeek = false,
    limit = 3,
    refresh = false,
    type = 'main',
    userId = 'staging-user',
  } = options;

  const payload = {
    is_sneakpeek: isSneakpeek,
    limit,
    refresh,
    type,
    user_id: userId,
  };

  try {
    const response = await fetch(ENDPOINTS.getUserThreads, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    // Expected shape: { recommendations: [...] }
    return data.threads ?? data.data?.threads ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch paginated data:', error);
    throw error;
  }
}
