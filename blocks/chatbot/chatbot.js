/**
 * Chatbot Block
 * Chef AI conversational assistant
 */

import { getCompleteConfig } from './config.js';

/**
 * Decorate the chatbot block
 * @param {HTMLElement} block - The chatbot block element
 */
export default async function decorate(block) {
  const config = getCompleteConfig();

  block.textContent = '';
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chatbot-container';
  chatContainer.id = 'chatbot-root';

  const loadingIndicator = createLoadingIndicator();
  chatContainer.appendChild(loadingIndicator);
  block.appendChild(chatContainer);

  try {
    await loadReactFromCDN();
    
    const { default: ChatWidget } = await import('./ChatWidget.js');
    const { default: chefAiService } = await import('./services/chefAiService.js');
    
    chefAiService.config = { ...chefAiService.config, ...config };
    chefAiService.setEndpoint(config.defaultEndpoint);
    
    chatContainer.removeChild(loadingIndicator);
    
    const root = window.ReactDOM.createRoot(chatContainer);
    root.render(window.React.createElement(ChatWidget, { config }));
    
    block.reactRoot = root;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chatbot:', error);
    showError(chatContainer);
  }
}

/**
 * Create loading indicator element
 * @returns {HTMLElement} Loading indicator
 */
function createLoadingIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'chatbot-loading';
  indicator.textContent = 'Loading Chef AI...';
  return indicator;
}

/**
 * Show error message in chatbot container
 * @param {HTMLElement} container - Container element
 */
function showError(container) {
  container.innerHTML = '<div class="chatbot-error">Failed to load chatbot. Please refresh the page.</div>';
}

/**
 * Load React and ReactDOM from CDN
 * @returns {Promise<void>}
 */
async function loadReactFromCDN() {
  if (window.React && window.ReactDOM) {
    return;
  }

  if (!window.React) {
    await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
  }

  if (!window.ReactDOM) {
    await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
  }
}

/**
 * Load a script dynamically
 * @param {string} src - Script URL
 * @returns {Promise<void>}
 */
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
