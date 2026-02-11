import { loadReact } from '@helpers/chatbot/utils.js';
import { loadCSS } from '@scripts/aem.js';

// Prefetch assets for the Personalized Hub chatbot modal
export default async function prefetchPersonalizedHub() {
  try {
    await loadReact();

    const basePath = window.hlx && window.hlx.codeBasePath ? window.hlx.codeBasePath : '';

    await Promise.all([
      loadCSS(`${basePath}/helpers/personalized-hub/personalized-hub.css`),
      loadCSS(`${basePath}/helpers/cookie-agreement/cookie-agreement.css`),
      loadCSS(`${basePath}/blocks/carousel-cards/carousel-cards.css`),
    ]);

    await Promise.all([
      import('@helpers/cookie-agreement/index.js'),
      import('@helpers/personalized-hub/PersonalizedChatWidget.js'),
      import('@helpers/personalized-hub/LoadingState.js'),
      import('@helpers/personalized-hub/BusinessConfirmation.js'),
      import('@helpers/personalized-hub/WelcomeScreen.js'),
    ]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Failed to prefetch Personalized Hub assets:', e);
  }
}

if (typeof window !== 'undefined') {
  const runPrefetch = () => {
    // Only prefetch on the homepage
    if (window.location && window.location.pathname !== '/') {
      return;
    }
    prefetchPersonalizedHub().catch(() => {});
  };

  if (document.readyState === 'complete') {
    runPrefetch();
  } else {
    window.addEventListener('load', runPrefetch, { once: true });
  }
}
