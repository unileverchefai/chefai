import { setCookie } from '../../scripts/custom/utils.js';
import { createElement } from '../../scripts/common.js';
import { loadCSS } from '../../scripts/aem.js';
import createModal from '../modal/index.js';

const WELCOME_COOKIE = 'personalized-hub-welcome';
const DURATION = 300;

const markSeen = () => setCookie(WELCOME_COOKIE, 'true', 365);

function buildContent(onClose) {
  const wrap = createElement('div', { className: 'ph-chat-container' });
  const inner = createElement('div', {
    className: 'ph-welcome-container',
    innerContent: '<h1 class="ph-welcome-title">Welcome to your personalised hub!</h1>'
      + '<p class="ph-welcome-text">Transform <span class="ph-welcome-highlight">Global Future Trends</span> into actions that boost profits, refresh menus and delight customers.</p>'
      + '<p class="ph-welcome-text">Select any of the <strong>insights</strong> to get details or start a <strong>conversation</strong> with your assistant at the bottom of the screen.</p>'
      + '<button type="button" class="ph-welcome-button">Okay, got it</button>',
  });
  wrap.appendChild(inner);
  inner.querySelector('.ph-welcome-button').addEventListener('click', onClose);
  return wrap;
}

export default async function openWelcomeModal() {
  await loadCSS(`${window.hlx.codeBasePath}/helpers/personalized-hub/personalized-hub.css`);

  const container = createElement('div', {
    className: 'personalized-hub-container',
    attributes: { id: 'welcome-modal-root' },
  });

  const modal = createModal({
    content: container,
    showCloseButton: false,
    overlayClass: 'modal-overlay ph-modal-overlay',
    contentClass: 'modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
  });

  const close = () => {
    container.classList.add('ph-modal-slide-out');
    setTimeout(() => modal.close(), DURATION);
  };

  const onClickGotItButton = () => {
    markSeen();
    close();
  };

  container.appendChild(buildContent(onClickGotItButton));
  modal.open();
}
