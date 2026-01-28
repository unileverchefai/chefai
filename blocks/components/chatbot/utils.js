import formatResponse from './responseHandler.js';

export { formatResponse };

function setCookie(name, value, days = 365) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value || '')}${expires}; path=/`;
  } catch {
    // ignore cookie errors
  }
}

function getCookie(name) {
  try {
    const nameEQ = `${encodeURIComponent(name)}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i += 1) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  } catch {
    return null;
  }
}

export function getThreadId() {
  let threadId = getCookie('chef-ai-thread-id');
  if (!threadId) {
    threadId = `thread_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setCookie('chef-ai-thread-id', threadId);
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
