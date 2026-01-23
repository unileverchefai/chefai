import formatResponse from './responseHandler.js';

export { formatResponse };

export function getThreadId() {
  let threadId = sessionStorage.getItem('chef-ai-thread-id');
  if (!threadId) {
    threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('chef-ai-thread-id', threadId);
  }
  return threadId;
}

export function getHistory() {
  try {
    const history = sessionStorage.getItem('chef-ai-history');
    return history ? JSON.parse(history) : [];
  } catch {
    return [];
  }
}

export function saveHistory(messages) {
  try {
    sessionStorage.setItem('chef-ai-history', JSON.stringify(messages));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to save history:', err);
  }
}

export async function loadReact() {
  if (window.React && window.ReactDOM) return;
  if (!window.React) await loadScript('https://unpkg.com/react@18/umd/react.production.min.js');
  if (!window.ReactDOM) await loadScript('https://unpkg.com/react-dom@18/umd/react-dom.production.min.js');
}

export function loadScript(src) {
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
