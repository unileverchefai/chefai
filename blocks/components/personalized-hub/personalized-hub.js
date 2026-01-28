import { loadReact } from '@components/chatbot/utils.js';
import { createElement } from '@scripts/common.js';
import { loadCSS } from '@scripts/aem.js';
import createModal from '@components/modal/index.js';
import { SUBSCRIPTION_KEY, ENDPOINTS } from '../chatbot/constants/api.js';
import { getUserIdFromToken } from '../authentication/tokenManager.js';
import saveBusinessDetails from './saveBusinessDetails.js';

const SCREENS = {
  CHAT: 'chat',
  LOADING: 'loading',
  CONFIRMATION: 'confirmation',
  WELCOME: 'welcome',
  COMPLETED: 'completed',
};

/**
 * Opens the personalized hub modal
 * @returns {Promise<void>}
 */
export default async function openPersonalizedHub() {
  // Debug/logging: fetch saved business name for the current user and log it.
  (async () => {
    try {
      const userId = getUserIdFromToken();
      if (!userId || !ENDPOINTS.businessInfo) return;

      const url = `${ENDPOINTS.businessInfo}?user_id=${encodeURIComponent(userId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Subscription-Key': SUBSCRIPTION_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        // eslint-disable-next-line no-console
        console.error('[Personalized Hub] Failed to fetch saved business info:', errorText);
        return;
      }

      const responseText = await response.text();
      if (!responseText) {
        // eslint-disable-next-line no-console
        console.log('[Personalized Hub] Business info API returned empty response.');
        return;
      }

      const json = JSON.parse(responseText);
      const data = json.data ?? {};
      const businessName = data.name ?? '';

      // eslint-disable-next-line no-console
      console.log('[Personalized Hub] Saved business name from API:', businessName || '<none>');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Personalized Hub] Error while fetching saved business info:', error);
    }
  })();

  // Load personalized hub CSS if not already loaded
  await loadCSS(`${window.hlx.codeBasePath}/blocks/components/personalized-hub/personalized-hub.css`);

  // Create container for React app
  const container = createElement('div', {
    className: 'personalized-hub-container',
    attributes: { id: 'personalized-hub-modal-root' },
  });

  const ANIMATION_DURATION = 300;
  let reactRoot = null;

  // Create modal with personalized hub specific configuration
  const modal = createModal({
    content: container,
    showCloseButton: false,
    overlayClass: 'modal-overlay ph-modal-overlay',
    contentClass: 'modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
    animationDuration: ANIMATION_DURATION,
    onClose: () => {
      if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
      }
    },
  });

  const animateAndClose = () => {
    container.classList.add('ph-modal-slide-out');
    setTimeout(() => {
      modal.close();
    }, ANIMATION_DURATION);
  };

  try {
    await loadReact();

    if (!window.React || !window.ReactDOM) {
      throw new Error('React or ReactDOM not loaded');
    }

    // Load cookie agreement CSS and check for consent
    await loadCSS(`${window.hlx.codeBasePath}/blocks/components/cookie-agreement/cookie-agreement.css`);
    // Load carousel-cards styles so business cards reuse the same visual system
    await loadCSS(`${window.hlx.codeBasePath}/blocks/carousel-cards/carousel-cards.css`);
    const { default: openCookieAgreementModal } = await import('../cookie-agreement/index.js');
    const { default: PersonalizedChatWidget } = await import('./PersonalizedChatWidget.js');
    const { default: LoadingState } = await import('./LoadingState.js');
    const { default: BusinessConfirmation } = await import('./BusinessConfirmation.js');
    const { default: WelcomeScreen } = await import('./WelcomeScreen.js');
    const { default: openSignUpReportModal } = await import('../signup/signup.js');

    const { useState, useEffect } = window.React;
    const { createElement: h } = window.React;

    // Function to render the personalized hub app
    const renderPersonalizedHubApp = () => {
      const PersonalizedHubApp = () => {
        const [currentScreen, setCurrentScreen] = useState(SCREENS.CHAT);
        const [businessData, setBusinessData] = useState(null);
        const [businessCandidates, setBusinessCandidates] = useState([]);
        const [error, setError] = useState(null);
        const [chatMessages, setChatMessages] = useState([]);

        useEffect(() => {
          if (currentScreen !== SCREENS.COMPLETED) return;

          const startSignupFlow = async () => {
            try {
              // Open the main signup modal (which itself will open the password step).
              openSignUpReportModal();
              // After kicking off signup flow, prepare the hub to show the Welcome screen.
              setCurrentScreen(SCREENS.WELCOME);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('Failed to start signup flow from personalized hub:', e);
              setCurrentScreen(SCREENS.WELCOME);
            }
          };

          startSignupFlow();
        }, [currentScreen]);

        const handleBusinessNameSubmit = (result) => {
          setError(null);

          // If we receive an array of businesses from the chat API, use it.
          if (Array.isArray(result) && result.length > 0) {
            const normalized = result.map((b) => ({
              business_name: b.name ?? '',
              address: b.address ?? '',
              image_url: b.image_url ?? '',
              logo_url: '',
              place_id: b.place_id,
              url: b.url,
            }));

            setBusinessCandidates(normalized);
            setBusinessData(normalized[0]);
            setCurrentScreen(SCREENS.CONFIRMATION);
            return;
          }

          const trimmedName = (result ?? '').trim();
          if (!trimmedName) {
            setError('Business name is required.');
            return;
          }

          const singleBusiness = {
            business_name: trimmedName,
            address: '',
            image_url: '',
            logo_url: '',
          };

          setBusinessCandidates([singleBusiness]);
          setBusinessData(singleBusiness);

          setCurrentScreen(SCREENS.CONFIRMATION);
        };

        const handleConfirm = async () => {
          sessionStorage.setItem('personalized-hub-business-data', JSON.stringify(businessData));
          setCurrentScreen(SCREENS.LOADING);

          try {
            await saveBusinessDetails(businessData);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('Failed to save business details:', e);
          }

          // Show loading for 3 seconds, then launch signup flow
          setTimeout(() => {
            setCurrentScreen(SCREENS.COMPLETED);
          }, 3000);
        };

        const handleReject = () => {
          setBusinessData(null);
          setBusinessCandidates([]);
          setCurrentScreen(SCREENS.CHAT);
        };

        if (error) {
          return h(
            'div',
            {
              style: {
                padding: '24px',
                textAlign: 'center',
                color: 'var(--error)',
                fontFamily: 'var(--body-font-family)',
              },
            },
            [
              h('p', { key: 'error' }, `Error: ${error}`),
              h(
                'button',
                {
                  key: 'retry',
                  onClick: () => setError(null),
                  style: {
                    marginTop: '16px',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    background: 'var(--ufs-orange)',
                    color: 'white',
                    cursor: 'pointer',
                  },
                },
                'Try Again',
              ),
            ],
          );
        }

        if (currentScreen === SCREENS.CHAT) {
          return h(PersonalizedChatWidget, {
            onBusinessNameSubmit: handleBusinessNameSubmit,
            messages: chatMessages,
            onMessagesChange: setChatMessages,
            onClose: animateAndClose,
          });
        }

        if (currentScreen === SCREENS.LOADING) {
          return h(LoadingState, {
            businessData,
            onClose: animateAndClose,
          });
        }

        if (currentScreen === SCREENS.CONFIRMATION) {
          return h(BusinessConfirmation, {
            businessData,
            businesses: businessCandidates,
            onSelectBusiness: setBusinessData,
            onConfirm: handleConfirm,
            onReject: handleReject,
            onClose: animateAndClose,
          });
        }

        if (currentScreen === SCREENS.WELCOME) {
          return h(WelcomeScreen, {
            onGotIt: animateAndClose,
          });
        }

        if (currentScreen === SCREENS.COMPLETED) {
          // While the signup flow runs in separate modals, keep showing LoadingState
          // as a lightweight "processing" view in the background.
          return h(LoadingState, {
            businessData,
            onClose: animateAndClose,
          });
        }

        return null;
      };

      reactRoot = window.ReactDOM.createRoot(container);

      requestAnimationFrame(() => {
        reactRoot.render(h(PersonalizedHubApp));
      });
    };

    // Function to render and open the personalized hub app
    const renderAndOpenPersonalizedHub = () => {
      // Open the modal first so the container is in the DOM
      modal.open();
      // Small delay to ensure modal is fully rendered before React mounts
      requestAnimationFrame(() => {
        renderPersonalizedHubApp();
      });
    };

    // Check if cookies were accepted
    const hasConsent = document.cookie.split(';').some((c) => c.trim().startsWith('personalized-hub-consent=true'));

    // If no consent, show cookie modal first, then render the app
    if (!hasConsent) {
      openCookieAgreementModal(
        () => {
          // On agree, wait for cookie modal to fully close (300ms animation + 50ms buffer)
          // then render and open the personalized hub app
          setTimeout(() => {
            renderAndOpenPersonalizedHub();
          }, 350);
        },
        () => {
          // On close, do nothing (user cancelled)
        },
      );
      return;
    }

    // Render the personalized hub app (has consent, open immediately)
    renderAndOpenPersonalizedHub();
  } catch (error) {
    console.error('Failed to load personalized hub:', error);
    const errorDiv = createElement('div', {
      className: 'chatbot-error',
      innerContent: `Failed to load personalized hub: ${error.message}. Please refresh the page.`,
    });
    container.appendChild(errorDiv);
    // Open the modal even if there's an error
    modal.open();
  }
}
