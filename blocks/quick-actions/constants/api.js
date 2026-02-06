import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';

export { SUBSCRIPTION_KEY };

export async function fetchQuickActions(options = {}) {
  const {
    userId = 'staging-user',
    limit = 4,
    isSneakpeek = false,
    refresh = false,
    type = 'quick',
  } = options;

  const payload = {
    is_sneakpeek: isSneakpeek,
    limit,
    refresh,
    type,
    user_id: userId,
  };

  try {
    const response = await fetch(`${ENDPOINTS.recommendations}/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to load quick actions: ${response.status}`);
    }

    const data = await response.json();
    return data.recommendations ?? data.data?.recommendations ?? [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch quick recommendations:', error);
    throw error;
  }
}
