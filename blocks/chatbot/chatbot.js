import { getMetadata } from '../../scripts/aem.js';
import { setEndpoint } from './sendMessage.js';
import { loadReact } from './utils.js';

export default async function chatbot(block) {
  const endpoint = getMetadata('chatbot-endpoint') || 'capgemini';
  setEndpoint(endpoint);

  block.textContent = '';
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chatbot-container';
  chatContainer.id = 'chatbot-root';
  block.appendChild(chatContainer);

  const skeleton = document.createElement('div');
  skeleton.className = 'chatbot-skeleton';
  chatContainer.appendChild(skeleton);

  try {
    await loadReact();

    if (!window.React || !window.ReactDOM) {
      throw new Error('React or ReactDOM not loaded');
    }

    const { default: ChatWidget } = await import('./ChatWidget.js');

    if (skeleton && skeleton.parentNode === chatContainer) {
      chatContainer.removeChild(skeleton);
    }

    const root = window.ReactDOM.createRoot(chatContainer);
    root.render(window.React.createElement(ChatWidget));
    block.reactRoot = root;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chatbot:', error);
    if (skeleton && skeleton.parentNode === chatContainer) {
      chatContainer.removeChild(skeleton);
    }
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chatbot-error';
    errorDiv.textContent = `Failed to load chatbot: ${error.message}. Please refresh the page.`;
    chatContainer.appendChild(errorDiv);
  }
}
