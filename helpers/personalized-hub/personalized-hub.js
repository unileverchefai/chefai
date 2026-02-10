import { loadReact, getCookieId, getUserIdFromCookie } from '@helpers/chatbot/utils.js';
import sendStreamingMessage from '@helpers/chatbot/sendStreamingMessage.js';
import { createElement } from '@scripts/common.js';
import { loadCSS } from '@scripts/aem.js';
import createModal from '@helpers/modal/index.js';

const SCREENS = {
  CHAT: 'chat',
  LOADING: 'loading',
  CONFIRMATION: 'confirmation',
  WELCOME: 'welcome',
  COMPLETED: 'completed',
};

export default async function openPersonalizedHub() {
  await loadCSS(`${window.hlx.codeBasePath}/helpers/personalized-hub/personalized-hub.css`);

  const container = createElement('div', {
    className: 'personalized-hub-container',
    attributes: { id: 'personalized-hub-modal-root' },
  });

  const ANIMATION_DURATION = 300;
  let reactRoot = null;

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

    await loadCSS(`${window.hlx.codeBasePath}/helpers/cookie-agreement/cookie-agreement.css`);
    await loadCSS(`${window.hlx.codeBasePath}/blocks/carousel-cards/carousel-cards.css`);
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
        const [businessCandidates, setBusinessCandidates] = useState([]);
        const [error, setError] = useState(null);
        const [chatMessages, setChatMessages] = useState([]);

        // Removed signup flow - now redirecting to /personalized-hub instead

        const handleBusinessNameSubmit = (result) => {
          setError(null);

          // If we receive an array of businesses from the chat API, use it.
          if (Array.isArray(result) && result.length > 0) {
            const normalized = result.map((b) => ({
              business_name: b.name ?? '',
              address: b.address ?? '',
              image_url: b.image_url ?? '',
              logo_url: b.logo_url ?? '',
              place_id: b.place_id ?? '',
              url: b.url ?? '',
              street: b.street ?? '',
              city: b.city ?? '',
              postal_code: b.postal_code ?? '',
              phone_number: b.phone_number ?? '',
              rating: b.rating ?? null,
              business_type: b.business_type ?? '',
              cuisine_type: b.cuisine_type ?? '',
              keywords: Array.isArray(b.keywords) ? b.keywords : (b.types ?? []),
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

        const handleConfirm = () => {
          setCurrentScreen(SCREENS.LOADING);

          const userId = getCookieId() ?? getUserIdFromCookie();
          const placeId = businessData?.place_id ?? '';

          const businessInfoToStore = {
            ...businessData,
            user_id: userId,
            timestamp: Date.now(),
          };
          try {
            sessionStorage.setItem('personalized-hub-business-data', JSON.stringify(businessInfoToStore));
          } catch {
            // ignore storage errors
          }

          let threadId = null;
          try {
            const stored = sessionStorage.getItem('personalized-hub-thread-id');
            if (stored) threadId = stored;
          } catch {
            // ignore
          }

          const confirmMessage = placeId ? `place_id: ${placeId}` : '';

          sendStreamingMessage(confirmMessage, {
            skipCache: true,
            ...(threadId ? { thread_id: threadId } : {}),
            onComplete: () => {},
            onError: () => {},
          });
        };

        const handleReject = () => {
          // Reset selected business and candidates
          setBusinessData(null);
          setBusinessCandidates([]);
          // Clear chat messages so previous business suggestions
          // don't immediately re-trigger confirmation
          setChatMessages([]);
          // Return user to the chat screen
          setCurrentScreen(SCREENS.CHAT);
        };

        if (error) {
          return h(
            'div',
            {
              className: 'ph-error-container',
            },
            [
              h('p', { key: 'error', className: 'ph-error-message' }, `Error: ${error}`),
              h(
                'button',
                {
                  key: 'retry',
                  className: 'ph-error-retry-btn',
                  onClick: () => setError(null),
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

    const renderAndOpenPersonalizedHub = () => {
      modal.open();
      requestAnimationFrame(() => {
        renderPersonalizedHubApp();
      });
    };

    const hasConsent = document.cookie.split(';').some((c) => c.trim().startsWith('personalized-hub-consent=true'));

    if (!hasConsent) {
      openCookieAgreementModal(
        () => {
          setTimeout(() => {
            renderAndOpenPersonalizedHub();
          }, 350);
        },
        () => {
          // On close, do nothing
        },
      );
      return;
    }

    renderAndOpenPersonalizedHub();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load personalized hub:', error);
    const errorDiv = createElement('div', {
      className: 'chatbot-error',
      innerContent: `Failed to load personalized hub: ${error.message}. Please refresh the page.`,
    });
    container.appendChild(errorDiv);
    modal.open();
  }
}
