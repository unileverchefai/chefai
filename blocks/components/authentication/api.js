import {
  API_BASE_URL,
  SUBSCRIPTION_KEY,
} from './constants.js';

const DEFAULT_TIMEOUT = 30000;

function getCookies() {
  if (!document.cookie) {
    return '';
  }

  const cookies = document.cookie.split(';');
  let affinityCookie = '';
  let affinityCorsCookie = '';

  cookies.forEach((c) => {
    const trimmed = c.trim();
    if (trimmed.startsWith('ApplicationGatewayAffinity=') && !trimmed.startsWith('ApplicationGatewayAffinityCORS=')) {
      affinityCookie = trimmed;
    } else if (trimmed.startsWith('ApplicationGatewayAffinityCORS=')) {
      affinityCorsCookie = trimmed;
    }
  });

  const cookieParts = [];
  if (affinityCookie) {
    cookieParts.push(affinityCookie);
  }
  if (affinityCorsCookie) {
    cookieParts.push(affinityCorsCookie);
  }

  return cookieParts.join('; ');
}

function fetchWithTimeout(url, options, timeout = DEFAULT_TIMEOUT) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout: API took too long to respond')), timeout);
    }),
  ]);
}

// eslint-disable-next-line import/prefer-default-export
export async function apiRequest(endpoint, options = {}) {
  const {
    method = 'POST',
    body,
    headers = {},
    authorization,
    isTextResponse = false,
    timeout = DEFAULT_TIMEOUT,
  } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const requestHeaders = {
    'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
    ...headers,
  };

  if (body && method !== 'GET') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  if (endpoint === '/authenticate') {
    requestHeaders.accept = 'application/json';
  }

  if (authorization) {
    requestHeaders.Authorization = authorization;
  }

  const cookies = getCookies();
  if (cookies) {
    requestHeaders.Cookie = cookies;
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      },
      timeout,
    );

    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message ?? errorJson.error ?? errorJson.code ?? errorMessage;
        }
      } catch {
        // Use default error message
      }
      throw new Error(errorMessage);
    }

    if (isTextResponse) {
      return await response.text();
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('API returned empty response');
    }

    return JSON.parse(responseText);
  } catch (error) {
    if (error.message.includes('timeout')) {
      throw new Error('Request timeout. Please try again.');
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw error;
  }
}
