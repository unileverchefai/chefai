import { SUBSCRIPTION_KEY, ENDPOINTS } from '@components/chatbot/constants/api.js';

export { SUBSCRIPTION_KEY };

export async function fetchInsights(options = {}) {
  const {
    userId = 'staging-user',
  } = options;

  const payload = {
    user_id: userId,
  };

  try {
    const response = await fetch(`${ENDPOINTS.recommendations}/time-based`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to load mock data: ${response.status}`);
    }

    const data = await response.json();
    // Expected shape: { recommendations: [...] }
    return data.recommendations ?? data.data?.recommendations ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch time-based recommendations:', error);
    throw error;
  }
}
