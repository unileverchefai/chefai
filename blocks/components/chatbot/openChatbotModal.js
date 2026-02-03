import { getMetadata, loadCSS } from '@scripts/aem.js';
import { createElement } from '@scripts/common.js';
import createModal from '@components/modal/index.js';
import { loadReact } from './utils.js';
import { setEndpoint } from './sendMessage.js';

const ANIMATION_DURATION = 300;

/**
 * Opens the Chef AI chatbot in a modal.
 * This reuses the existing ChatWidget, but renders it in an overlay instead of inline.
 *
 * @returns {Promise<void>}
 */
export default async function openChatbotModal() {
  // Container for React app
  const container = createElement('div', {
    className: 'chatbot-modal-container',
    attributes: { id: 'chatbot-modal-root' },
  });

  let reactRoot = null;

  const modal = createModal({
    content: container,
    showCloseButton: true,
    overlayClass: 'modal-overlay chatbot-modal-overlay',
    contentClass: 'modal-content chatbot-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
    animationDuration: ANIMATION_DURATION,
    onClose: () => {
      if (reactRoot) {
        reactRoot.unmount();
        reactRoot = null;
      }
    },
  });

  try {
    // Ensure chatbot styles are loaded
    await loadCSS(`${window.hlx.codeBasePath}/blocks/components/chatbot/chatbot.css`);

    // Configure API endpoint the same way as the inline chatbot block
    const endpoint = getMetadata('chatbot-endpoint') || 'capgemini';
    setEndpoint(endpoint);

    await loadReact();

    if (!window.React || !window.ReactDOM) {
      throw new Error('React or ReactDOM not loaded');
    }

    const { default: ChatWidget } = await import('./chatWidget.js');
    const { createElement: h } = window.React;

    reactRoot = window.ReactDOM.createRoot(container);

    // Open modal first, then mount React to avoid layout jumps
    modal.open();

    requestAnimationFrame(() => {
      reactRoot.render(h(ChatWidget, { personalizedHubTrigger: null }));

      // Focus input after React renders and modal animation completes
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
