import { SUBSCRIPTION_KEY, ENDPOINTS, STREAMING_TIMEOUT_MS } from '@api/endpoints.js';
import { getCountry } from '@scripts/custom/locale.js';
import {
  getOrCreateThreadId,
  getAnonymousUserId,
  getUserIdFromCookie,
  getAnonymousUserIdFromCookie,
  createUser,
} from '@scripts/custom/utils.js';

const countryCode = getCountry();

let currentEndpoint = 'capgemini';

export function setEndpoint(endpoint) {
  if (ENDPOINTS[endpoint]) {
    currentEndpoint = endpoint;
  }
}

export function getEndpoint() {
  return ENDPOINTS[currentEndpoint];
}

export async function resolveUserId(explicitUserId) {
  const cookieUserId = getUserIdFromCookie();
  const anonymousUserId = getAnonymousUserIdFromCookie();

  let userId = explicitUserId ?? cookieUserId ?? anonymousUserId;

  if (!userId) {
    userId = await getAnonymousUserId();
  }

  return userId;
}

export async function resolveThreadId({
  userId,
  threadId = null,
  skipCache = false,
}) {
  if (threadId) {
    return threadId;
  }

  let resolvedThreadId = null;

  try {
    resolvedThreadId = await getOrCreateThreadId(userId, false, skipCache);
  } catch (error) {
    if (error.message && error.message.includes('does not exist')) {
      const newUserId = await createUser();
      resolvedThreadId = await getOrCreateThreadId(newUserId, false, skipCache);
    } else {
      throw error;
    }
  }

  return resolvedThreadId;
}

export function fetchWithTimeout(url, options, timeout = STREAMING_TIMEOUT_MS) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: API took too long to respond')), timeout);
    }),
  ]);
}

export async function postChatMessage({
  message,
  threadId,
  userId,
  country,
  runId,
  enableMetadata = false,
  timeout,
}) {
  const endpoint = getEndpoint();

  const payload = {
    message,
    thread_id: threadId,
    user_id: userId,
    country: country ?? countryCode,
  };

  if (runId) {
    payload.run_id = runId;
    if (enableMetadata) {
      payload.enable_metadata = true;
    }
  }

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
    timeout ?? STREAMING_TIMEOUT_MS,
  );

  if (!response.ok) {
    const errorText = await response.text();
    // eslint-disable-next-line no-console
    console.error('API error response:', errorText);
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();

  if (!responseText) {
    throw new Error('API returned empty response');
  }

  return JSON.parse(responseText);
}

