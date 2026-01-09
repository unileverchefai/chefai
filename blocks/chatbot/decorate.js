import { getMetadata } from '../../scripts/aem.js';
import { setEndpoint } from './sendMessage.js';

export default async function decorate(block) {
  const endpoint = getMetadata('chatbot-endpoint') || 'capgemini';
  setEndpoint(endpoint);

  block.textContent = '';
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chatbot-container';
  chatContainer.id = 'chatbot-root';

  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'chatbot-loading';
  loadingIndicator.textContent = 'Loading Chef AI...';
  chatContainer.appendChild(loadingIndicator);
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
    chatContainer.innerHTML = '<div class="chatbot-error">Failed to load chatbot. Please refresh the page.</div>';
  }
}

async function loadReact() {
  if (window.React && window.ReactDOM) return;
  if (!window.React) await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
  if (!window.ReactDOM) await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}
