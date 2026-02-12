import {
  getAnonymousUserIdFromCookie,
  clearAllChatData,
  setCookie,
  getUserIdFromCookie,
  getCookieId,
  getOrCreateCookieId,
  createUser,
} from '@scripts/custom/utils.js';
import { ENDPOINTS as CHEF_AI_ENDPOINTS, SUBSCRIPTION_KEY as CHEF_AI_SUBSCRIPTION_KEY } from '@api/endpoints.js';
import { apiRequest } from './endpoints.js';
import {
  setToken, removeToken, getToken,
} from './tokenManager.js';
import {
  ENDPOINTS,
  COUNTRY_CODE,
  SITE_CODE,
  LANGUAGE_CODE,
  BUSINESS_TYPE_MAP,
  createRegistrationPayload,
} from './constants.js';

async function ensureChefAiUserId() {
  try {
    const cookieUserId = getCookieId();
    if (cookieUserId) {
      return cookieUserId;
    }

    const existingUserId = getUserIdFromCookie();
    if (existingUserId) {
      setCookie('cookie_id', existingUserId);
      return existingUserId;
    }

    const createdUserId = await createUser();
    if (createdUserId) {
      return createdUserId;
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Auth] Failed to ensure ChefAI user id:', error);
  }

  try {
    const fallbackId = getOrCreateCookieId();
    setCookie('cookie_id', fallbackId);
    return fallbackId;
  } catch {
    return null;
  }
}

/**
 * Call Chef AI users/login to link cookie_id with SIFU email.
 * @param {string} email - SIFU email (login_user_id)
 * @param {string} [cookieId] - If provided, use as cookie_id; otherwise use ensureChefAiUserId()
 */
async function loginUserWithCookieId(email, cookieId = null) {
  if (!CHEF_AI_ENDPOINTS.usersLogin) {
    return;
  }

  try {
    const idToSend = cookieId ?? await ensureChefAiUserId();
    if (!idToSend) {
      return;
    }

    const payload = {
      cookie_id: idToSend,
      login_user_id: email,
    };

    const response = await fetch(CHEF_AI_ENDPOINTS.usersLogin, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Subscription-Key': CHEF_AI_SUBSCRIPTION_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // eslint-disable-next-line no-console
      console.error('[Auth] ChefAI users/login failed:', response.status, response.statusText, errorText);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Auth] ChefAI users/login error:', error);
  }
}

export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const credentials = btoa(`${email}:${password}`);
  const authorization = `Basic ${credentials}`;

  try {
    const token = await apiRequest(
      `${ENDPOINTS.login}?country=${COUNTRY_CODE}&site=${SITE_CODE}`,
      {
        method: 'GET',
        authorization,
        isTextResponse: true,
      },
    );

    if (!token || typeof token !== 'string') {
      throw new Error('Invalid response from server');
    }

    setToken(token);
    setCookie('user_id', email);
    setCookie('chef-ai-thread-id', '', -1);
    loginUserWithCookieId(email).catch(() => {});
    return token;
  } catch (error) {
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      throw new Error('Invalid email or password');
    }
    throw error;
  }
}

export async function register(formData) {
  const {
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    businessType,
    mobilePhone = '',
    marketingConsent = false,
  } = formData;

  if (!email || !password || !confirmPassword || !firstName || !lastName) {
    throw new Error('Please fill in all required fields');
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  const typeOfBusiness = businessType
    ? (BUSINESS_TYPE_MAP[businessType.toLowerCase().replace(/\s+/g, '-')] ?? 'other')
    : 'other';
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const anonymousUserId = getAnonymousUserIdFromCookie();
  const cookieIdForLogin = getCookieId() ?? getUserIdFromCookie();

  const payload = createRegistrationPayload({
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    businessType: businessType ?? 'other',
    mobilePhone,
    marketingConsent,
    typeOfBusiness,
    now,
    referrerUrl: window.location.href,
    fullName: `${firstName} ${lastName}`,
    anonymousUserId,
  });

  try {
    const response = await apiRequest(ENDPOINTS.register, {
      body: payload,
    });

    if (response.authToken) {
      setToken(response.authToken);
      setCookie('user_id', email);
      setCookie('chef-ai-thread-id', '', -1);

      loginUserWithCookieId(email, cookieIdForLogin ?? undefined).catch(() => {});

      return response;
    }

    throw new Error(response.message ?? 'Registration failed');
  } catch (error) {
    if (error.message.includes('400') || error.message.includes('Bad Request')) {
      throw new Error('Invalid registration data. Please check your information.');
    }
    if (error.message.includes('409') || error.message.includes('Conflict')) {
      throw new Error('An account with this email already exists.');
    }
    throw error;
  }
}

export async function resetPassword(email, mobilePhone = '') {
  if (!email) {
    throw new Error('Email is required');
  }

  try {
    const response = await apiRequest(ENDPOINTS.resetPassword, {
      body: {
        email,
        baseUrl: window.location.href,
        countryCode: COUNTRY_CODE,
        languageCode: LANGUAGE_CODE,
        site: SITE_CODE,
        mobilePhone: mobilePhone ?? '',
        profileLoginType: 'EMAIL',
      },
      isTextResponse: true,
    });

    return response;
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      throw new Error('No account found with this email address.');
    }
    throw error;
  }
}

export async function logout() {
  const token = getToken();

  if (!token) {
    removeToken();
    clearAllChatData();
    return;
  }

  try {
    await apiRequest(ENDPOINTS.logout, {
      authorization: token,
    });
  } catch (error) {
    // Ignore logout errors
  } finally {
    removeToken();
    clearAllChatData();
  }
}
