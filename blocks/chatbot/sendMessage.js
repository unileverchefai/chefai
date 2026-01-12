import { getThreadId, formatResponse } from './utils.js';
import { SUBSCRIPTION_KEY, ENDPOINTS } from './constants/api.js';

let currentEndpoint = 'capgemini';

export function setEndpoint(endpoint) {
  if (ENDPOINTS[endpoint]) {
    currentEndpoint = endpoint;
  }
}

export default async function sendMessage(message, options = {}) {
  const endpoint = ENDPOINTS[currentEndpoint];
  const threadId = getThreadId();

  const payload = {
    message,
    thread_id: threadId,
    user_id: options.user_id || 'user123',
    country: options.country || 'BE',
    ...options,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    // eslint-disable-next-line no-console
    console.error('API error response:', errorText);
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  if (!responseText) throw new Error('API returned empty response');

  return formatResponse(JSON.parse(responseText));
}
