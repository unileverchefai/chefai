import { getMetadata } from '@scripts/aem.js';
import { createElement } from '@scripts/common.js';
import { setEndpoint } from './sendMessage.js';
import { loadReact } from './utils.js';

export default async function chatbot(block) {
  const endpoint = getMetadata('chatbot-endpoint') || 'capgemini';
  setEndpoint(endpoint);

  const personalizedHubTrigger = getMetadata('personalized-hub-trigger') || '#chatbot';

  block.textContent = '';
  const chatContainer = createElement('div', {
    className: 'chatbot-root',
    attributes: { id: 'chatbot-root' },
  });
  block.appendChild(chatContainer);

  const skeleton = createElement('div', {
    className: 'chatbot-skeleton',
    innerContent: `
      <div class="chatbot-skeleton-messages">
        <div class="chatbot-skeleton-message">
          <div class="chatbot-skeleton-bubble"></div>
        </div>
      </div>
      <div class="chatbot-skeleton-form"></div>
    `,
  });
  chatContainer.appendChild(skeleton);

  try {
    await loadReact();

    if (!window.React || !window.ReactDOM) {
      throw new Error('React or ReactDOM not loaded');
    }

    const { default: ChatWidget } = await import('./ChatWidget.js');

    const root = window.ReactDOM.createRoot(chatContainer);

    requestAnimationFrame(() => {
      if (skeleton && skeleton.parentNode === chatContainer) {
        chatContainer.removeChild(skeleton);
      }
      root.render(window.React.createElement(ChatWidget, { personalizedHubTrigger }));
      block.reactRoot = root;
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chatbot:', error);
    if (skeleton && skeleton.parentNode === chatContainer) {
      chatContainer.removeChild(skeleton);
    }
    const errorDiv = createElement('div', {
      className: 'chatbot-error',
      innerContent: `Failed to load chatbot: ${error.message}. Please refresh the page.`,
    });
    chatContainer.appendChild(errorDiv);
  }
}
