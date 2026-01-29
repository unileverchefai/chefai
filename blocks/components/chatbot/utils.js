import formatResponse from './responseHandler.js';
import { SUBSCRIPTION_KEY, ENDPOINTS } from './constants/api.js';

export { formatResponse };

export function setCookie(name, value, days = 365) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value || '')}${expires}; path=/`;
  } catch {
    // ignore cookie errors
  }
}

function getCookie(name) {
  try {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i += 1) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  } catch {
    return null;
  }
}

export function getThreadId() {
  let threadId = getCookie('chef-ai-thread-id');
  if (!threadId) {
    threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setCookie('chef-ai-thread-id', threadId);
  }
  return threadId;
}

/**
 * Gets the anonymous user ID from cookie if it exists, without creating a new one.
 * @returns {string|null} The anonymous user ID or null if not found
 */
export function getAnonymousUserIdFromCookie() {
  const cookieName = 'chef-ai-anonymous-user-id';
  return getCookie(cookieName);
}

/**
 * Clears the anonymous user ID cookie.
 */
export function clearAnonymousUserIdCookie() {
  const cookieName = 'chef-ai-anonymous-user-id';
  setCookie(cookieName, '', -1); // Set to expire immediately
}

/**
 * Clears all chat-related cookies and session storage data.
 * Should be called on logout to ensure clean state.
 */
export function clearAllChatData() {
  // Clear cookies
  setCookie('chef-ai-thread-id', '', -1);
  setCookie('chef-ai-anonymous-user-id', '', -1);
  setCookie('personalized-hub-consent', '', -1);

  // Clear session storage
  try {
    sessionStorage.removeItem('chef-ai-history');
    sessionStorage.removeItem('personalized-hub-business-data');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear session storage:', err);
  }
}

/**
 * Gets or creates an anonymous user ID for unauthenticated users.
 * Checks cookie first, if not found, creates a new user via API and stores the ID in cookie.
 * @returns {Promise<string>} The anonymous user ID
 */
export async function getAnonymousUserId() {
  const cookieName = 'chef-ai-anonymous-user-id';
  let userId = getCookie(cookieName);

  if (userId) {
    return userId;
  }

  // Create a new user via API
  try {
    if (!ENDPOINTS.users) {
      throw new Error('Users endpoint is not configured');
    }

    const response = await fetch(ENDPOINTS.users, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error('Failed to create anonymous user:', errorText);
      throw new Error(`Failed to create anonymous user: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Users API returned empty response');
    }

    const json = JSON.parse(responseText);
    userId = (json.user_id ?? json.data?.user_id ?? '').toString().trim();

    if (!userId) {
      throw new Error('Users API response did not contain a user_id');
    }

    // eslint-disable-next-line no-console
    console.log('[Chef AI] Created new anonymous user:', userId);

    // Store in cookie for future use
    setCookie(cookieName, userId);
    return userId;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create anonymous user, falling back to generated ID:', error);
    // Fallback to a generated ID if API fails
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setCookie(cookieName, userId);
    return userId;
  }
}

export function getHistory() {
  try {
    const history = sessionStorage.getItem('chef-ai-history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

export function saveHistory(messages) {
  try {
    sessionStorage.setItem('chef-ai-history', JSON.stringify(messages));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to save history:', err);
  }
}

export async function loadReact() {
  if (window.React && window.ReactDOM) return;
  if (!window.React) await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
  if (!window.ReactDOM) await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
}

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}
