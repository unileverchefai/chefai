import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import {
  getOrCreateThreadId,
  formatResponse,
  getAnonymousUserId,
  getUserIdFromCookie,
  getAnonymousUserIdFromCookie,
  createUser,
} from '@scripts/custom/utils.js';

let currentEndpoint = 'capgemini';

export function setEndpoint(endpoint) {
  if (ENDPOINTS[endpoint]) {
    currentEndpoint = endpoint;
  }
}

function fetchWithTimeout(url, options, timeout = 30000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: API took too long to respond')), timeout);
    }),
  ]);
}

export default async function sendMessage(message, options = {}) {
  const endpoint = ENDPOINTS[currentEndpoint];

  const cookieUserId = getUserIdFromCookie();
  const anonymousUserId = getAnonymousUserIdFromCookie();
  let userId = options.user_id ?? cookieUserId ?? anonymousUserId;

  if (!userId) {
    userId = await getAnonymousUserId();
  }

  // Get or reuse thread ID:
  // - If options.thread_id is provided, always reuse that thread
  // - Otherwise, use API-based flow to get or create a thread
  //   (if it fails because user doesn't exist, create a new user and retry)
  //   skipCache option prevents storing thread_id during business registration flow
  const skipCache = options.skipCache ?? false;
  let threadId = options.thread_id ?? null;
  if (!threadId) {
    try {
      threadId = await getOrCreateThreadId(userId, false, skipCache);
    } catch (error) {
      if (error.message && error.message.includes('does not exist')) {
        // User doesn't exist, create a new one and retry
        userId = await createUser();
        threadId = await getOrCreateThreadId(userId, false, skipCache);
      } else {
        throw error;
      }
    }
  }

  const payload = {
    message,
    thread_id: threadId,
    user_id: userId,
    country: options.country ?? 'BE',
  };

  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Subscription-Key': SUBSCRIPTION_KEY,
        },
        body: JSON.stringify(payload),
      },
      options.timeout || 30000,
    );

    if (!response.ok) {
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    if (!responseText) throw new Error('API returned empty response');

    return formatResponse(JSON.parse(responseText));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('API request failed:', error);
    throw error;
  }
}
