import { createElement } from '@scripts/common.js';
import { loadCSS } from '@scripts/aem.js';
import createModal from '@helpers/modal/index.js';
import { loadFragment } from '@blocks/fragment/fragment.js';

const COOKIE_FRAGMENT_PATH = '/fragments/cookies';

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

/**
 * Opens the cookie agreement modal
 * @param {Function} onAgree - Callback when user agrees
 * @param {Function} onClose - Callback when modal is closed
 * @param {boolean} required - If true, modal cannot be closed until user accepts
 * @returns {Object} Modal instance
 */
export default function openCookieAgreementModal(onAgree, onClose, required = false) {
  loadCSS(`${window.hlx.codeBasePath}/helpers/cookie-agreement/cookie-agreement.css`).catch(() => {
    // CSS loading error handled silently
  });

  const content = createElement('div', {
    className: 'cookie-agreement-modal',
  });

  const contentArea = createElement('div', {
    className: 'cookie-agreement-content',
  });

  const textArea = createElement('div', {
    className: 'cookie-agreement-text',
  });

  const loadingParagraph = createElement('p', {
    innerContent: 'Loading cookie information…',
  });
  textArea.appendChild(loadingParagraph);

  contentArea.appendChild(textArea);
  content.appendChild(contentArea);

  const buttonsArea = createElement('div', {
    className: 'cookie-agreement-buttons',
  });

  const agreeButton = createElement('button', {
    className: 'cookie-agreement-btn',
    innerContent: 'I agree',
    attributes: {
      type: 'button',
    },
  });

  buttonsArea.appendChild(agreeButton);
  content.appendChild(buttonsArea);

  const modal = createModal({
    content,
    showCloseButton: false,
    closeOnClickOutside: !required,
    closeOnEscape: !required,
    overlayClass: 'modal-overlay ph-modal-overlay',
    contentClass: 'modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
    onClose: () => {
      if (onClose) onClose();
    },
  });

  // Load fragment content asynchronously and inject into the modal text area
  loadFragment(COOKIE_FRAGMENT_PATH)
    .then((fragment) => {
      if (fragment) {
        textArea.innerHTML = fragment.innerHTML;
        const links = textArea.querySelectorAll('a[href]');
        links.forEach((link) => {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        });
      } else {
        textArea.innerHTML = '<p>Unable to load cookie information.</p>';
      }
    })
    .catch(() => {
      textArea.innerHTML = '<p>Unable to load cookie information.</p>';
    });

  agreeButton.addEventListener('click', () => {
    setCookie('personalized-hub-consent', 'true');

    const cookieId = `cookie_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    setCookie('cookie_id', cookieId);

    modal.close();
    setTimeout(() => {
      if (onAgree) onAgree();
    }, 300);
  });

  modal.open();

  return modal;
}
