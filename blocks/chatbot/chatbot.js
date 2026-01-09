import { getMetadata } from '../../scripts/aem.js';
import { setEndpoint } from './sendMessage.js';
import { loadReact } from './utils.js';

export default async function chatbot(block) {
  const endpoint = getMetadata('chatbot-endpoint') || 'capgemini';
  setEndpoint(endpoint);

  const chatContainer = document.createElement('div');
  chatContainer.className = 'chatbot-container';
  chatContainer.id = 'chatbot-root';

  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'chatbot-loading';
  loadingIndicator.textContent = 'Loading Chef AI...';
  chatContainer.appendChild(loadingIndicator);

  block.textContent = '';
  block.appendChild(chatContainer);

  try {
    await loadReact();
    const { default: ChatWidget } = await import('./ChatWidget.js');
    chatContainer.removeChild(loadingIndicator);
    const root = window.ReactDOM.createRoot(chatContainer);
    root.render(window.React.createElement(ChatWidget));
    block.reactRoot = root;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chatbot:', error);
    chatContainer.removeChild(loadingIndicator);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'chatbot-error';
    errorDiv.textContent = 'Failed to load chatbot. Please refresh the page.';
    chatContainer.appendChild(errorDiv);
  }
}
