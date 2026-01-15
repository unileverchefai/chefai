import { loadReact } from '../chatbot/utils.js';

const SCREENS = {
  COOKIE_CONSENT: 'cookie-consent',
  CHAT: 'chat',
  LOADING: 'loading',
  CONFIRMATION: 'confirmation',
  COMPLETED: 'completed',
};

export default async function personalizedHub(block) {
  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'personalized-hub-container';
  container.id = 'personalized-hub-root';
  block.appendChild(container);

  const skeleton = document.createElement('div');
  skeleton.className = 'chatbot-skeleton';
  skeleton.innerHTML = `
    <div class="chatbot-skeleton-messages">
      <div class="chatbot-skeleton-message">
        <div class="chatbot-skeleton-bubble"></div>
      </div>
    </div>
    <div class="chatbot-skeleton-form"></div>
  `;
  container.appendChild(skeleton);

  try {
    await loadReact();

    if (!window.React || !window.ReactDOM) {
      throw new Error('React or ReactDOM not loaded');
    }

    const { default: CookieAgreementModal } = await import('./CookieAgreementModal.js');
    const { default: PersonalizedChatWidget } = await import('./PersonalizedChatWidget.js');
    const { default: LoadingState } = await import('./LoadingState.js');
    const { default: BusinessConfirmation } = await import('./BusinessConfirmation.js');
    // const { default: fetchBusinessInfo } = await import('./fetchBusinessInfo.js');

    const { useState, useEffect } = window.React;
    const { createElement: h } = window.React;

    const PersonalizedHubApp = () => {
      const [currentScreen, setCurrentScreen] = useState(SCREENS.COOKIE_CONSENT);
      const [businessData, setBusinessData] = useState(null);
      const [error, setError] = useState(null);

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
        setCurrentScreen(SCREENS.LOADING);
        setError(null);

        // Mock data for testing
        const mockData = {
          business_name: businessName,
          address: '7 Langton Street, Chelsea, London SW10 0JL',
          image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop',
          logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100&h=100&fit=crop',
        };

        setTimeout(() => {
          setBusinessData(mockData);
          setCurrentScreen(SCREENS.CONFIRMATION);
        }, 2000);

        // Uncomment below to use real API
        /*
        try {
          const data = await fetchBusinessInfo(businessName);
          setBusinessData(data);

          setTimeout(() => {
            setCurrentScreen(SCREENS.CONFIRMATION);
          }, 2000);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch business info:', err);
          setError(err.message);
          setCurrentScreen(SCREENS.CHAT);
        }
        */
      };

      const handleConfirm = () => {
        sessionStorage.setItem('personalized-hub-business-data', JSON.stringify(businessData));
        setCurrentScreen(SCREENS.COMPLETED);
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
        return h(CookieAgreementModal, { onAgree: handleConsentAgree });
      }

      if (currentScreen === SCREENS.CHAT) {
        return h(PersonalizedChatWidget, { onBusinessNameSubmit: handleBusinessNameSubmit });
      }

      if (currentScreen === SCREENS.LOADING) {
        return h(LoadingState, { businessData });
      }

      if (currentScreen === SCREENS.CONFIRMATION) {
        return h(BusinessConfirmation, {
          businessData,
          onConfirm: handleConfirm,
          onReject: handleReject,
        });
      }

      if (currentScreen === SCREENS.COMPLETED) {
        return h(
          'div',
          {
            style: {
              padding: '24px',
              textAlign: 'center',
              fontFamily: 'var(--body-font-family)',
            },
          },
          [
            h('h2', { key: 'title' }, 'Business Confirmed!'),
            h('p', { key: 'message' }, 'Your personalized insights are ready.'),
          ],
        );
      }

      return null;
    };

    const root = window.ReactDOM.createRoot(container);

    requestAnimationFrame(() => {
      if (skeleton && skeleton.parentNode === container) {
        container.removeChild(skeleton);
      }
      root.render(h(PersonalizedHubApp));
      block.reactRoot = root;
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load personalized hub:', error);
    if (skeleton && skeleton.parentNode === container) {
      container.removeChild(skeleton);
    }
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chatbot-error';
    errorDiv.textContent = `Failed to load personalized hub: ${error.message}. Please refresh the page.`;
    container.appendChild(errorDiv);
  }
}
