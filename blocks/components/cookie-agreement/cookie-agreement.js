import { createElement } from '@scripts/common.js';
import { loadCSS } from '@scripts/aem.js';
import createModal from '@components/modal/index.js';

/**
 * Opens the cookie agreement modal
 * @param {Function} onAgree - Callback when user agrees
 * @param {Function} onClose - Callback when modal is closed
 * @param {boolean} required - If true, modal cannot be closed until user accepts
 * @returns {Object} Modal instance
 */
export default function openCookieAgreementModal(onAgree, onClose, required = false) {
  // Load cookie agreement CSS
  loadCSS(`${window.hlx.codeBasePath}/blocks/components/cookie-agreement/cookie-agreement.css`).catch(() => {
    // CSS loading error handled silently
  });

  // Create modal content
  const content = createElement('div', {
    className: 'cookie-agreement-modal',
  });

  // Content area
  const contentArea = createElement('div', {
    className: 'cookie-agreement-content',
  });

  // Text area
  const textArea = createElement('div', {
    className: 'cookie-agreement-text',
  });

  // First paragraph with links
  const paragraph1 = createElement('p');
  paragraph1.appendChild(document.createTextNode('Before proceeding further, please read our '));

  const termsLink = createElement('a', {
    textContent: 'AI Terms & Conditions',
    properties: {
      href: '#',
    },
  });
  termsLink.addEventListener('click', (e) => e.preventDefault());
  paragraph1.appendChild(termsLink);

  paragraph1.appendChild(document.createTextNode(', '));

  const privacyLink = createElement('a', {
    textContent: 'Privacy Notice',
    properties: {
      href: '#',
    },
  });
  privacyLink.addEventListener('click', (e) => e.preventDefault());
  paragraph1.appendChild(privacyLink);

  paragraph1.appendChild(document.createTextNode(', and '));

  const cookieLink = createElement('a', {
    textContent: 'Cookie Statement',
    properties: {
      href: '#',
    },
  });
  cookieLink.addEventListener('click', (e) => e.preventDefault());
  paragraph1.appendChild(cookieLink);

  paragraph1.appendChild(document.createTextNode(' to better understand how we use your data.'));
  textArea.appendChild(paragraph1);

  // Second paragraph
  const paragraph2 = createElement('p', {
    textContent: 'I have read and agree to the terms and conditions and I am over 16 years old.',
  });
  textArea.appendChild(paragraph2);

  contentArea.appendChild(textArea);
  content.appendChild(contentArea);

  // Buttons area
  const buttonsArea = createElement('div', {
    className: 'cookie-agreement-buttons',
  });

  const agreeButton = createElement('button', {
    className: 'cookie-agreement-btn',
    textContent: 'I agree',
    properties: {
      type: 'button',
    },
  });

  buttonsArea.appendChild(agreeButton);
  content.appendChild(buttonsArea);

  // Create modal
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

  // Set up event listener after modal is created
  agreeButton.addEventListener('click', () => {
    sessionStorage.setItem('personalized-hub-consent', 'true');
    // Close modal first, then call onAgree after animation completes
    modal.close();
    // Wait for modal close animation to complete before calling onAgree
    setTimeout(() => {
      if (onAgree) onAgree();
    }, 300);
  });

  modal.open();

  return modal;
}
