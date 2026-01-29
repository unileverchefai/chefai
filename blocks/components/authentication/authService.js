import { apiRequest } from './api.js';
import {
  setToken, removeToken, getToken, getUserIdFromToken,
} from './tokenManager.js';
import {
  ENDPOINTS,
  COUNTRY_CODE,
  SITE_CODE,
  LANGUAGE_CODE,
  BUSINESS_TYPE_MAP,
  createRegistrationPayload,
} from './constants.js';
import {
  getAnonymousUserIdFromCookie, clearAnonymousUserIdCookie, clearAllChatData, setCookie,
} from '../chatbot/utils.js';
import saveBusinessDetails from '../personalized-hub/saveBusinessDetails.js';

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

  if (!email || !password || !confirmPassword || !firstName || !lastName || !businessType) {
    throw new Error('Please fill in all required fields');
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match');
  }

  const typeOfBusiness = BUSINESS_TYPE_MAP[businessType.toLowerCase().replace(/\s+/g, '-')] ?? 'other';
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Check if user has an anonymous user_id from previous interactions
  const anonymousUserId = getAnonymousUserIdFromCookie();

  if (anonymousUserId) {
    // eslint-disable-next-line no-console
    console.log('[Registration] Found anonymous user_id:', anonymousUserId);
  } else {
    // eslint-disable-next-line no-console
    console.log('[Registration] No anonymous user_id found in cookie');
  }

  const payload = createRegistrationPayload({
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    businessType,
    mobilePhone,
    marketingConsent,
    typeOfBusiness,
    now,
    referrerUrl: window.location.href,
    fullName: `${firstName} ${lastName}`,
    anonymousUserId,
  });

  // eslint-disable-next-line no-console
  console.log('[Registration] Payload includes user_id:', payload.user_id, 'and id:', payload.id);

  try {
    const response = await apiRequest(ENDPOINTS.register, {
      body: payload,
    });

    if (response.successful && response.authToken) {
      setToken(response.authToken);

      // Extract user_id from the auth token (JWT)
      const registeredUserId = getUserIdFromToken();

      // eslint-disable-next-line no-console
      console.log('[Registration] Registration response:', {
        successful: response.successful,
        hasAuthToken: !!response.authToken,
        user_id_from_token: registeredUserId,
      });

      if (registeredUserId) {
        // Store the registered user_id in cookie (replacing anonymous one if exists)
        const userIdStr = registeredUserId.toString();
        setCookie('chef-ai-anonymous-user-id', userIdStr);
        // Also store in sessionStorage for immediate use
        try {
          sessionStorage.setItem('registered-user-id', userIdStr);
          // eslint-disable-next-line no-console
          console.log('[Registration] Extracted user_id from token:', registeredUserId, '(replaced anonymous user_id cookie)');
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Registration] Failed to store user_id in sessionStorage:', e);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn('[Registration] No user_id found in auth token - clearing anonymous user_id');
        // Only clear anonymous user cookie if we don't have a registered user_id
        clearAnonymousUserIdCookie();
      }

      // Save business details if they exist in sessionStorage
      // Get user_id from token (retry in case token wasn't fully processed yet)
      let userIdForBusinessSave = registeredUserId;
      if (!userIdForBusinessSave) {
        // Retry getting user_id from token after a small delay
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 100);
        });
        userIdForBusinessSave = getUserIdFromToken();
      }

      if (!userIdForBusinessSave) {
        // eslint-disable-next-line no-console
        console.error('[Registration] Cannot save business details: user_id not found in token');
      } else {
        try {
          const businessDataStr = sessionStorage.getItem('personalized-hub-business-data');
          if (businessDataStr) {
            const businessData = JSON.parse(businessDataStr);
            if (businessData && businessData.business_name) {
              // eslint-disable-next-line no-console
              console.log('[Registration] Saving business details after registration:', businessData);
              // eslint-disable-next-line no-console
              console.log('[Registration] Using user_id from token:', userIdForBusinessSave);
              try {
                // Use user_id from token
                await saveBusinessDetails(businessData, userIdForBusinessSave);
                // eslint-disable-next-line no-console
                console.log('[Registration] Business details saved successfully with user_id:', userIdForBusinessSave);
                // Clear from sessionStorage after successful save
                sessionStorage.removeItem('personalized-hub-business-data');

                // Fetch and log user data after saving business details
                try {
                  const { default: fetchSavedBusinessInfoAndLog } = await import('../personalized-hub/fetchSavedBusinessInfo.js');
                  await fetchSavedBusinessInfoAndLog();
                } catch (fetchError) {
                  // eslint-disable-next-line no-console
                  console.error('[Registration] Failed to fetch user data after save:', fetchError);
                }
              } catch (businessError) {
                // eslint-disable-next-line no-console
                console.error('[Registration] Failed to save business details:', businessError);
                // Don't fail registration if business save fails
              }
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[Registration] Error checking for business data:', error);
          // Don't fail registration if there's an error reading sessionStorage
        }
      }

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
    // Clear all chat data even if no token
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
    // Clear all cookies and session storage data on logout
    clearAllChatData();
  }
}
