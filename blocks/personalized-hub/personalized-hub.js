import { loadReact } from '../chatbot/utils.js';
import { createElement } from '../../scripts/common.js';
import { loadCSS } from '../../scripts/aem.js';

const SCREENS = {
  COOKIE_CONSENT: 'cookie-consent',
  CHAT: 'chat',
  LOADING: 'loading',
  CONFIRMATION: 'confirmation',
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

        // Mock data for testing
        const mockData = {
          business_name: businessName,
          address: '7 Langton Street, Chelsea, London SW10 0JL',
          image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
          logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop',
        };

        setBusinessData(mockData);
        setCurrentScreen(SCREENS.CONFIRMATION);
      };

      const handleConfirm = () => {
        sessionStorage.setItem('personalized-hub-business-data', JSON.stringify(businessData));
        setCurrentScreen(SCREENS.LOADING);
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
