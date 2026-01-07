/**
 * Chatbot Block
 * Chef AI conversational assistant powered by React Native Gifted Chat
 */

import { getCompleteConfig } from './config.js';

/**
 * Loads and decorates the chatbot
 * @param {Element} block The chatbot block element
 */
export default async function decorate(block) {
  // Get configuration
  const config = getCompleteConfig();

  // Create container for React root
  block.textContent = '';
  const chatContainer = document.createElement('div');
  chatContainer.className = 'chatbot-container';
  chatContainer.id = 'chatbot-root';

  // Add loading state
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'chatbot-loading';
  loadingIndicator.textContent = 'Loading Chef AI...';
  chatContainer.appendChild(loadingIndicator);

  block.appendChild(chatContainer);

  // Dynamically load React from CDN and render ChatWidget
  try {
    // Load React and ReactDOM from CDN
    await loadReactFromCDN();
    
    // Import ChatWidget component and service
    const { default: ChatWidget } = await import('./ChatWidget.js');
    const { default: chefAiService } = await import('./services/chefAiService.js');
    
    // Configure the service with loaded config
    chefAiService.config = { ...chefAiService.config, ...config };
    chefAiService.setEndpoint(config.defaultEndpoint);
    
    // Remove loading indicator
    chatContainer.removeChild(loadingIndicator);
    
    // Create React root and render using global React
    const root = window.ReactDOM.createRoot(chatContainer);
    root.render(window.React.createElement(ChatWidget, { config }));
    
    // Store root for cleanup if needed
    block.reactRoot = root;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load chatbot:', error);
    chatContainer.innerHTML = '<div class="chatbot-error">Failed to load chatbot. Please refresh the page.</div>';
  }
}

/**
 * Load React and ReactDOM from CDN
 */
async function loadReactFromCDN() {
  // Check if already loaded
  if (window.React && window.ReactDOM) {
    return;
  }

  // Load React
  if (!window.React) {
    await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
  }

  // Load ReactDOM
  if (!window.ReactDOM) {
    await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
  }
}

/**
 * Load a script dynamically
 * @param {string} src - Script URL
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
