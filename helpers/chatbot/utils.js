import { SUBSCRIPTION_KEY, ENDPOINTS } from '@api/endpoints.js';
import { COUNTRY_CODE, LANGUAGE_CODE } from '@api/authentication/constants.js';
import formatResponse from './responseHandler.js';

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

/**
 * Get stored thread ID from cookie
 * @returns {string|null} Thread ID or null if not found
 */
export function getStoredThreadId() {
  return getCookie('chef-ai-thread-id');
}

/**
 * Create a new thread via API
 * @param {string} userId - User ID
 * @param {boolean} skipCache - If true, don't store thread_id in cookie (default: false)
 * @returns {Promise<string>} Thread ID
 */
export async function createThread(userId, skipCache = false) {
  try {
    if (!ENDPOINTS.createThread) {
      throw new Error('Create thread endpoint is not configured');
    }

    const response = await fetch(ENDPOINTS.createThread, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create thread: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    if (!responseText) {
      throw new Error('Create thread API returned empty response');
    }

    const json = JSON.parse(responseText);
    const threadId = (json.thread_id ?? json.data?.thread_id ?? '').toString().trim();

    if (!threadId) {
      throw new Error('Create thread API response did not contain a thread_id');
    }

    // Only cache thread_id if skipCache is false
    if (!skipCache) {
      setCookie('chef-ai-thread-id', threadId);
    }

    return threadId;
  } catch (error) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }
}

/**
 * Create a new thread with a recommendation (quick action) via API
 * @param {string} userId - User ID
 * @param {string} recommendationId - Recommendation ID from quick actions API
 * @param {boolean} skipCache - If true, don't store thread_id in cookie (default: false)
 * @returns {Promise<{ threadId: string, displayText: string }>}
 */
export async function createThreadWithRecommendation(userId, recommendationId, skipCache = false) {
  if (!ENDPOINTS.createThread) {
    throw new Error('Create thread endpoint is not configured');
  }

  const response = await fetch(ENDPOINTS.createThread, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Subscription-Key': SUBSCRIPTION_KEY,
    },
    body: JSON.stringify({
      user_id: userId,
      recommendation_id: recommendationId,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create thread: ${response.status} ${response.statusText}`);
  }

  const responseText = await response.text();
  if (!responseText) {
    throw new Error('Create thread API returned empty response');
  }

  const json = JSON.parse(responseText);
  const threadId = (json.thread_id ?? json.data?.thread_id ?? '').toString().trim();
  const displayText = (json.display_text ?? json.data?.display_text ?? '').toString().trim();

  if (!threadId) {
    throw new Error('Create thread API response did not contain a thread_id');
  }

  if (!skipCache) {
    setCookie('chef-ai-thread-id', threadId);
  }

  return { threadId, displayText };
}

/**
 * Validate if a thread exists
 * @param {string} threadId - Thread ID to validate
 * @returns {Promise<boolean>} True if thread exists, false otherwise
 */
export async function validateThread(threadId) {
  try {
    if (!ENDPOINTS.getThreadInfo) {
      return false;
    }

    const url = `${ENDPOINTS.getThreadInfo}?thread_id=${encodeURIComponent(threadId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get user threads and return the most recent one
 * @param {string} userId - User ID
 * @param {boolean} skipCache - If true, don't store thread_id in cookie (default: false)
 * @returns {Promise<string|null>} Most recent thread ID or null
 */
export async function getUserThreads(userId, skipCache = false) {
  try {
    if (!ENDPOINTS.getUserThreads) {
      return null;
    }

    const url = `${ENDPOINTS.getUserThreads}?user_id=${encodeURIComponent(userId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      return null;
    }

    const responseText = await response.text();
    if (!responseText) {
      return null;
    }

    const json = JSON.parse(responseText);
    const threads = json.threads || json.data?.threads || json || [];

    if (!Array.isArray(threads) || threads.length === 0) {
      return null;
    }

    const sortedThreads = threads.sort((a, b) => {
      const timeA = a.created_at || a.timestamp || a.createdAt || 0;
      const timeB = b.created_at || b.timestamp || b.createdAt || 0;
      return new Date(timeB) - new Date(timeA);
    });

    const mostRecentThread = sortedThreads[0];
    const threadId = (mostRecentThread.thread_id ?? mostRecentThread.id ?? '').toString().trim();

    if (threadId) {
      // Only cache thread_id if skipCache is false
      if (!skipCache) {
        setCookie('chef-ai-thread-id', threadId);
      }
      return threadId;
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get or create thread ID using API-based flow
 * @param {string} userId - User ID
 * @param {boolean} validateOnInit - Whether to validate thread on initialization (default: false)
 * @param {boolean} skipCache - If true, don't store thread_id in cookie (default: false)
 * @returns {Promise<string>} Thread ID
 */
export async function getOrCreateThreadId(userId, validateOnInit = false, skipCache = false) {
  // If skipCache is true, don't use stored thread_id (for business registration flow)
  let threadId = skipCache ? null : getStoredThreadId();

  if (threadId && validateOnInit) {
    const isValid = await validateThread(threadId);
    if (!isValid) {
      threadId = await createThread(userId, skipCache);
      return threadId;
    }
    return threadId;
  }

  if (threadId) {
    return threadId;
  }

  threadId = await getUserThreads(userId, skipCache);
  if (threadId) {
    return threadId;
  }

  try {
    threadId = await createThread(userId, skipCache);
    return threadId;
  } catch (error) {
    // If thread creation fails because user doesn't exist, clear invalid user IDs and throw
    // This allows the caller to create a new user and retry
    if (error.message && error.message.includes('does not exist')) {
      // Clear potentially invalid user ID cookies
      setCookie('user_id', '', -1);
      setCookie('chef-ai-anonymous-user-id', '', -1);
      setCookie('chef-ai-thread-id', '', -1);
    }
    throw error;
  }
}

export function getAnonymousUserIdFromCookie() {
  const cookieName = 'chef-ai-anonymous-user-id';
  return getCookie(cookieName);
}

export function getUserIdFromCookie() {
  return getCookie('user_id');
}

export function clearAnonymousUserIdCookie() {
  const cookieName = 'chef-ai-anonymous-user-id';
  setCookie(cookieName, '', -1);
}

export function clearAllChatData() {
  setCookie('chef-ai-thread-id', '', -1);
  setCookie('chef-ai-anonymous-user-id', '', -1);
  setCookie('personalized-hub-consent', '', -1);
  setCookie('user_id', '', -1);
  setCookie('cookie_id', '', -1);

  try {
    sessionStorage.clear();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to clear session storage:', err);
  }
}

export async function getAnonymousUserId() {
  const cookieName = 'chef-ai-anonymous-user-id';
  let userId = getCookie(cookieName);

  if (userId) {
    return userId;
  }

  if (!ENDPOINTS.users) {
    throw new Error('Users endpoint is not configured');
  }

  // Generate a user_id client-side (API requires it)
  userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const response = await fetch(ENDPOINTS.users, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Subscription-Key': SUBSCRIPTION_KEY,
    },
    body: JSON.stringify({
      user_id: userId,
      country: COUNTRY_CODE,
      content_language_code: LANGUAGE_CODE.toUpperCase(),
    }),
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
  // Use the user_id from response if provided, otherwise use the one we generated
  const returnedUserId = (json.user_id ?? json.data?.user_id ?? userId).toString().trim();

  setCookie(cookieName, returnedUserId);
  return returnedUserId;
}

/**
 * Create a new user via API
 * @returns {Promise<string>} User ID
 */
export async function createUser() {
  if (!ENDPOINTS.users) {
    throw new Error('Users endpoint is not configured');
  }

  // Generate a user_id client-side (API requires it)
  const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  const response = await fetch(ENDPOINTS.users, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Subscription-Key': SUBSCRIPTION_KEY,
    },
    body: JSON.stringify({
      user_id: userId,
      country: COUNTRY_CODE,
      content_language_code: LANGUAGE_CODE.toUpperCase(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create user: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const responseText = await response.text();
  if (!responseText) {
    throw new Error('Users API returned empty response');
  }

  const json = JSON.parse(responseText);
  // Use the user_id from response if provided, otherwise use the one we generated
  const returnedUserId = (json.user_id ?? json.data?.user_id ?? userId).toString().trim();

  // Store in both cookies for compatibility
  setCookie('user_id', returnedUserId);
  setCookie('chef-ai-anonymous-user-id', returnedUserId);
  return returnedUserId;
}

/**
 * Transform API messages to ChatWidget message format
 * Handles both simple message format and full API response format
 * @param {Array} apiMessages - Messages from API
 * @returns {Array} Transformed messages
 */
export function transformApiMessagesToChatFormat(apiMessages) {
  if (!Array.isArray(apiMessages)) {
    return [];
  }

  const USER_ID = 1;
  const AI_ID = 2;

  return apiMessages.map((msg) => {
    const isUser = msg.role === 'user' || msg.user_id || msg.sender === 'user' || msg.user?._id === USER_ID;

    if (isUser) {
      const messageId = msg.message_id || msg.id || msg._id || `msg_${Date.now()}_${Math.random()}`;
      let text = msg.message || msg.text || msg.content || '';

      if (typeof text === 'string' && text.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(text);
          text = parsed.message || parsed.text || text;
        } catch {
          // Use as-is if parsing fails
        }
      }

      const timestamp = msg.timestamp || msg.created_at || msg.createdAt
        || (msg.createdAt instanceof Date ? msg.createdAt.getTime() : Date.now());

      return {
        _id: messageId,
        text,
        createdAt: new Date(timestamp),
        user: {
          _id: USER_ID,
          name: 'You',
        },
        metadata: {
          thread_id: msg.thread_id,
          message_id: messageId,
          ...(msg.metadata || {}),
        },
      };
    }

    let parsedContent = null;
    let messageContent = msg.message || msg.text || msg.content || '';

    if (typeof messageContent === 'string' && messageContent.trim().startsWith('{')) {
      try {
        parsedContent = JSON.parse(messageContent);
        if (parsedContent && typeof parsedContent === 'object') {
          messageContent = parsedContent.message || messageContent;
        }
      } catch {
        parsedContent = null;
      }
    }

    const hasParsedContent = parsedContent && typeof parsedContent === 'object';
    const hasResponseObject = msg.response && typeof msg.response === 'object';
    const hasRecipeDataAtRoot = msg.recipes || msg.suggested_prompts
      || msg.recipe_details || msg.product_details;
    const hasRecipeDataInParsed = parsedContent?.recipes || parsedContent?.suggested_prompts
      || parsedContent?.recipe_details || parsedContent?.product_details;
    const hasRecipeDataInResponse = msg.response?.recipes || msg.response?.suggested_prompts
      || msg.response?.recipe_details || msg.response?.product_details;
    const hasMessageId = msg.message_id;

    const shouldFormat = hasParsedContent || hasResponseObject || hasRecipeDataInResponse
      || hasRecipeDataInParsed || (hasMessageId && hasRecipeDataAtRoot);

    if (shouldFormat) {
      try {
        let responseData;

        if (hasParsedContent) {
          responseData = {
            message: parsedContent.message || messageContent,
            recipes: parsedContent.recipes || [],
            recipe_details: parsedContent.recipe_details || [],
            product_details: parsedContent.product_details || [],
            suggested_prompts: parsedContent.suggested_prompts || [],
            businesses: parsedContent.businesses || [],
          };
        } else if (hasResponseObject) {
          responseData = msg.response;
        } else {
          responseData = {
            message: messageContent,
            recipes: msg.recipes || [],
            recipe_details: msg.recipe_details || [],
            product_details: msg.product_details || [],
            suggested_prompts: msg.suggested_prompts || [],
            businesses: msg.businesses || [],
          };
        }

        const apiResponseFormat = {
          message_id: msg.message_id || msg.id || msg._id,
          timestamp: msg.timestamp || msg.created_at || msg.createdAt,
          thread_id: msg.thread_id,
          run_id: msg.run_id,
          response: responseData,
        };

        return formatResponse(apiResponseFormat);
      } catch (error) {
        // Fallback to simple format
      }
    }
    const messageId = msg.message_id || msg.id || msg._id || `msg_${Date.now()}_${Math.random()}`;
    const text = msg.message || msg.text || msg.content || '';
    const timestamp = msg.timestamp || msg.created_at || msg.createdAt
      || (msg.createdAt instanceof Date ? msg.createdAt.getTime() : Date.now());

    const images = [];
    if (msg.images && Array.isArray(msg.images)) {
      images.push(...msg.images);
    } else if (msg.image_url || msg.image) {
      images.push({
        url: msg.image_url || msg.image,
        alt: msg.title || msg.name || 'Image',
      });
    }

    return {
      _id: messageId,
      text,
      createdAt: new Date(timestamp),
      user: {
        _id: AI_ID,
        name: 'Chef AI',
        avatar: '/icons/chef-ai-avatar.svg',
      },
      metadata: {
        thread_id: msg.thread_id,
        message_id: messageId,
        recipes: msg.recipes || [],
        recipe_details: msg.recipe_details || [],
        product_details: msg.product_details || [],
        suggested_prompts: msg.suggested_prompts || [],
        businesses: msg.businesses || [],
        images: images.length > 0 ? images : undefined,
        ...(msg.metadata || {}),
      },
    };
  });
}

/**
 * Load thread messages from API
 * @param {string} threadId - Thread ID
 * @returns {Promise<Array>} Array of messages
 */
export async function loadThreadMessages(threadId) {
  try {
    if (!ENDPOINTS.getThreadMessages) {
      return [];
    }

    const url = `${ENDPOINTS.getThreadMessages}?thread_id=${encodeURIComponent(threadId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Key': SUBSCRIPTION_KEY,
      },
    });

    if (!response.ok) {
      return [];
    }

    const responseText = await response.text();
    if (!responseText) {
      return [];
    }

    const json = JSON.parse(responseText);
    let messages = json.messages || json.data?.messages || json || [];

    if (!Array.isArray(messages)) {
      if (messages && typeof messages === 'object') {
        messages = [messages];
      } else {
        messages = [];
      }
    }

    return transformApiMessagesToChatFormat(messages);
  } catch (error) {
    return [];
  }
}

/**
 * Get cached history with thread ID validation
 * @param {string} threadId - Current thread ID
 * @returns {Array|null} Cached history or null if not found/invalid
 */
function getCachedHistory(threadId) {
  try {
    const cachedData = sessionStorage.getItem('chef-ai-history');
    if (!cachedData) {
      return null;
    }

    const parsed = JSON.parse(cachedData);
    const cachedThreadId = parsed.threadId;
    const messages = parsed.messages || parsed;

    if (cachedThreadId === threadId && Array.isArray(messages)) {
      return messages;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get history with fallback: cache first, then API
 * @param {string} threadId - Thread ID
 * @param {string} userId - User ID (optional, for logging)
 * @returns {Promise<Array>} Array of messages
 */
export async function getHistoryWithFallback(threadId) {
  const cachedHistory = getCachedHistory(threadId);
  if (cachedHistory && cachedHistory.length > 0) {
    loadThreadMessages(threadId).then((apiMessages) => {
      if (apiMessages && apiMessages.length > 0) {
        saveHistory(apiMessages, threadId);
      }
    }).catch(() => {});
    return cachedHistory;
  }

  const apiMessages = await loadThreadMessages(threadId);
  if (apiMessages && apiMessages.length > 0) {
    saveHistory(apiMessages, threadId);
  }
  return apiMessages || [];
}

/**
 * Get history from cache only (synchronous, for immediate display)
 * @param {string} threadId - Thread ID to validate cache
 * @returns {Array} Cached messages or empty array
 */
export function getHistory(threadId = null) {
  if (threadId) {
    const cached = getCachedHistory(threadId);
    return cached || [];
  }

  return [];
}

/**
 * Save history with thread ID for cache validation
 * @param {Array} messages - Messages to save
 * @param {string} threadId - Thread ID (optional, will try to get from cookie if not provided)
 */
export function saveHistory(messages, threadId = null) {
  try {
    const currentThreadId = threadId || getStoredThreadId();
    const dataToStore = {
      threadId: currentThreadId,
      messages: Array.isArray(messages) ? messages : [],
      timestamp: Date.now(),
    };
    sessionStorage.setItem('chef-ai-history', JSON.stringify(dataToStore));
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
