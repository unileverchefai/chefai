import { getThreadId, formatResponse, getAnonymousUserId } from './utils.js';
import { SUBSCRIPTION_KEY, ENDPOINTS } from './constants/api.js';
import { getUserIdFromToken } from '../authentication/tokenManager.js';

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
  const threadId = getThreadId();

  const tokenUserId = getUserIdFromToken();
  let userId = options.user_id ?? tokenUserId;

  // If no authenticated user, get/create anonymous user ID
  if (!userId) {
    userId = await getAnonymousUserId();
  }

  const payload = {
    ...options,
    message,
    thread_id: threadId,
    user_id: userId,
    country: options.country || 'BE',
  };

  const startTime = performance.now();
  // eslint-disable-next-line no-console
  console.log('Sending message to API:', endpoint);

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

    const requestTime = performance.now() - startTime;
    // eslint-disable-next-line no-console
    console.log(`API request completed in ${requestTime.toFixed(2)}ms`);

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
    const requestTime = performance.now() - startTime;
    // eslint-disable-next-line no-console
    console.error(`API request failed after ${requestTime.toFixed(2)}ms:`, error);
    throw error;
  }
}
