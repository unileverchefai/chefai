import { loadReact } from '@components/chatbot/utils.js';
import { createElement } from '@scripts/common.js';
import { loadCSS } from '@scripts/aem.js';
import createModal from '@components/modal/index.js';
import fetchBusinessInfo from './fetchBusinessInfo.js';

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
  // Load personalized hub CSS if not already loaded
  await loadCSS(`${window.hlx.codeBasePath}/blocks/components/personalized-hub/personalized-hub.css`);

  // Create container for React app
  const container = createElement('div', {
    className: 'personalized-hub-container',
    properties: { id: 'personalized-hub-modal-root' },
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
    const { default: openCookieAgreementModal } = await import('../cookie-agreement/index.js');
    const { default: PersonalizedChatWidget } = await import('./PersonalizedChatWidget.js');
    const { default: LoadingState } = await import('./LoadingState.js');
    const { default: BusinessConfirmation } = await import('./BusinessConfirmation.js');
    const { default: WelcomeScreen } = await import('./WelcomeScreen.js');

    const { useState } = window.React;
    const { createElement: h } = window.React;

    // Function to render the personalized hub app
    const renderPersonalizedHubApp = () => {
      const PersonalizedHubApp = () => {
        const [currentScreen, setCurrentScreen] = useState(SCREENS.CHAT);
        const [businessData, setBusinessData] = useState(null);
        const [error, setError] = useState(null);
        const [chatMessages, setChatMessages] = useState([]);

        const handleBusinessNameSubmit = async (businessName) => {
          setError(null);

          try {
            const data = await fetchBusinessInfo(businessName);
            setBusinessData(data);
            setCurrentScreen(SCREENS.CONFIRMATION);
          } catch (err) {
            setError(err.message ?? 'Failed to fetch business information. Please try again.');
            setCurrentScreen(SCREENS.CHAT);
          }
        };

        const handleConfirm = () => {
          sessionStorage.setItem('personalized-hub-business-data', JSON.stringify(businessData));
          setCurrentScreen(SCREENS.LOADING);

          // Show loading for 3 seconds, then show welcome screen
          setTimeout(() => {
            setCurrentScreen(SCREENS.WELCOME);
          }, 3000);
        };

        const handleReject = () => {
          setBusinessData(null);
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
    const hasConsent = sessionStorage.getItem('personalized-hub-consent') === 'true';

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
      textContent: `Failed to load personalized hub: ${error.message}. Please refresh the page.`,
    });
    container.appendChild(errorDiv);
    // Open the modal even if there's an error
    modal.open();
  }
}
