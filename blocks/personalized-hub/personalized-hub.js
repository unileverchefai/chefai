import { loadReact } from '../chatbot/utils.js';
import { createElement } from '../../scripts/common.js';
import { loadCSS } from '../../scripts/aem.js';
import fetchBusinessInfo from './fetchBusinessInfo.js';

const SCREENS = {
  COOKIE_CONSENT: 'cookie-consent',
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
  await loadCSS(`${window.hlx.codeBasePath}/blocks/personalized-hub/personalized-hub.css`);

  // Create modal overlay
  const modalOverlay = createElement('div', {
    className: 'ph-modal-overlay',
  });

  // Create container for React app
  const container = createElement('div', {
    className: 'personalized-hub-container',
    properties: { id: 'personalized-hub-modal-root' },
  });

  modalOverlay.appendChild(container);
  document.body.appendChild(modalOverlay);
  document.body.style.overflow = 'hidden';

  // Function to close the modal
  const closeModal = () => {
    if (modalOverlay.reactRoot) {
      modalOverlay.reactRoot.unmount();
    }
    document.body.removeChild(modalOverlay);
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEscape);
  };

  const ANIMATION_DURATION = 300;

  const animateAndClose = () => {
    container.classList.add('ph-modal-slide-out');
    setTimeout(() => {
      closeModal();
    }, ANIMATION_DURATION);
  };

  // Handle escape key
  function handleEscape(e) {
    if (e.key === 'Escape') {
      animateAndClose();
    }
  }
  document.addEventListener('keydown', handleEscape);

  // Handle click outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      animateAndClose();
    }
  });

  try {
    await loadReact();

    if (!window.React || !window.ReactDOM) {
      throw new Error('React or ReactDOM not loaded');
    }

    const { default: CookieAgreementModal } = await import('./CookieAgreementModal.js');
    const { default: PersonalizedChatWidget } = await import('./PersonalizedChatWidget.js');
    const { default: LoadingState } = await import('./LoadingState.js');
    const { default: BusinessConfirmation } = await import('./BusinessConfirmation.js');
    const { default: WelcomeScreen } = await import('./WelcomeScreen.js');

    const { useState, useEffect } = window.React;
    const { createElement: h } = window.React;

    const PersonalizedHubApp = () => {
      const [currentScreen, setCurrentScreen] = useState(SCREENS.COOKIE_CONSENT);
      const [businessData, setBusinessData] = useState(null);
      const [error, setError] = useState(null);
      const [chatMessages, setChatMessages] = useState([]);

      useEffect(() => {
        const hasConsent = sessionStorage.getItem('personalized-hub-consent');
        if (hasConsent === 'true') {
          setCurrentScreen(SCREENS.CHAT);
        }
      }, []);

      const handleConsentAgree = () => {
        setCurrentScreen(SCREENS.CHAT);
      };

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

      if (currentScreen === SCREENS.COOKIE_CONSENT) {
        return h(CookieAgreementModal, {
          onAgree: handleConsentAgree,
          onClose: animateAndClose,
        });
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

    const root = window.ReactDOM.createRoot(container);

    requestAnimationFrame(() => {
      root.render(h(PersonalizedHubApp));
      modalOverlay.reactRoot = root;
    });
  } catch (error) {
    console.error('Failed to load personalized hub:', error);
    const errorDiv = createElement('div', {
      className: 'chatbot-error',
      textContent: `Failed to load personalized hub: ${error.message}. Please refresh the page.`,
    });
    container.appendChild(errorDiv);
  }
}
