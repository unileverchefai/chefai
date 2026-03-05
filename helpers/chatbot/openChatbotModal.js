import { getMetadata, loadCSS } from '@scripts/aem.js';
import { createElement } from '@scripts/common.js';
import createModal from '@helpers/modal/index.js';
import { loadReact } from '@scripts/custom/utils.js';
import { setEndpoint } from './api/chatApi.js';

const ANIMATION_DURATION = 300;

const chatbotModalState = {
  modal: null,
  container: null,
  reactRoot: null,
};

/**
 * Opens the Chef AI chatbot in a modal.
 * Keeps the modal and React root in the DOM when closed so that reopening reuses the same content.
 * @param {Object} type - Type of chatbot to open (e.g. 'quick-actions', 'insights')
 * @returns {Promise<void>}
 */
export default async function openChatbotModal(type) {
  if (chatbotModalState.modal && chatbotModalState.container && chatbotModalState.reactRoot) {
    chatbotModalState.modal.open();
    setTimeout(() => {
      const input = chatbotModalState.container.querySelector('.chat-input');
      if (input && typeof input.focus === 'function') {
        input.focus();
      }
    }, ANIMATION_DURATION + 50);
    return;
  }

  const container = createElement('div', {
    className: 'chatbot-modal-container',
    attributes: { id: 'chatbot-modal-root' },
  });

  const modal = createModal({
    content: container,
    showCloseButton: true,
    overlayClass: 'modal-overlay chatbot-modal-overlay',
    contentClass: 'modal-content chatbot-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
    animationDuration: ANIMATION_DURATION,
    keepInDomOnClose: true,
    onClose: () => {
      if (chatbotModalState.reactRoot) {
        chatbotModalState.reactRoot.unmount();
        chatbotModalState.reactRoot = null;
      }
    },
  });

  try {
    await loadCSS(`${window.hlx.codeBasePath}/helpers/chatbot/ui/chatbot.css`);

    const endpoint = getMetadata('chatbot-endpoint') ?? 'capgemini';
    setEndpoint(endpoint);

    await loadReact();

    if (!window.React || !window.ReactDOM) {
      throw new Error('React or ReactDOM not loaded');
    }

    const { default: ChatWidget } = await import('./ChatWidget.js');
    const { createElement: h } = window.React;

    const reactRoot = window.ReactDOM.createRoot(container);
    chatbotModalState.modal = modal;
    chatbotModalState.container = container;
    chatbotModalState.reactRoot = reactRoot;

    modal.open();

    requestAnimationFrame(() => {
      reactRoot.render(h(ChatWidget, { personalizedHubTrigger: null, type }));

      setTimeout(() => {
        const input = container.querySelector('.chat-input');
        if (input && typeof input.focus === 'function') {
          input.focus();
        }
      }, ANIMATION_DURATION + 50);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chatbot modal:', error);

    const errorDiv = createElement('div', {
      className: 'chatbot-error',
      innerContent: `Failed to load chatbot: ${error.message}. Please refresh the page.`,
    });

    container.appendChild(errorDiv);
    modal.open();
  }
}
