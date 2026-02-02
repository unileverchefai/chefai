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
import createChefAIUser from '../chatbot/createChefAIUser.js';

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

    if (response.successful && response.authToken) {
      setToken(response.authToken);
      const registeredUserId = getUserIdFromToken();

      if (registeredUserId) {
        const userIdStr = registeredUserId.toString();
        setCookie('user_id', userIdStr);
        try {
          sessionStorage.setItem('registered-user-id', userIdStr);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('[Registration] Failed to store user_id in sessionStorage:', e);
        }
      } else {
        clearAnonymousUserIdCookie();
      }

      let userIdForBusinessSave = registeredUserId;
      if (!userIdForBusinessSave) {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 100);
        });
        userIdForBusinessSave = getUserIdFromToken();
      }

      if (userIdForBusinessSave) {
        try {
          // Debug: Log sessionStorage and cookies
          // eslint-disable-next-line no-console
          console.log('[Registration] Debug - Checking for business data:', {
            sessionStorage_keys: Object.keys(sessionStorage),
            businessData_in_sessionStorage: sessionStorage.getItem('personalized-hub-business-data'),
            cookies: document.cookie,
            user_id_cookie: document.cookie.includes('user_id') ? 'present' : 'not found',
          });

          const businessDataStr = sessionStorage.getItem('personalized-hub-business-data');
          // eslint-disable-next-line no-console
          console.log('[Registration] Business data from sessionStorage:', businessDataStr);

          let businessData = null;
          if (businessDataStr) {
            try {
              businessData = JSON.parse(businessDataStr);
              // eslint-disable-next-line no-console
              console.log('[Registration] Parsed business data:', businessData);
            } catch (parseError) {
              // eslint-disable-next-line no-console
              console.error('[Registration] Failed to parse business data:', parseError);
            }
          }

          // Create ChefAI user with business data
          try {
            const userName = `${firstName} ${lastName}`;
            await createChefAIUser(userIdForBusinessSave, userName, businessData);
          } catch (chefAIError) {
            // eslint-disable-next-line no-console
            console.error('[Registration] Failed to create ChefAI user:', chefAIError);
          }

          // Save business details to business API if business data exists
          if (businessData && businessData.business_name) {
            try {
              await saveBusinessDetails(businessData, userIdForBusinessSave);
              sessionStorage.removeItem('personalized-hub-business-data');

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
            }
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[Registration] Error checking for business data:', error);
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
