import { createElement } from '../../scripts/common.js';
import createModal from '../modal/index.js';
import { loadCSS } from '../../scripts/aem.js';

/**
 * Opens the sign-in modal
 * @returns {Object} Modal instance
 */
export default function openSignInModal() {
  // Load sign-in CSS
  loadCSS(`${window.hlx.codeBasePath}/components/signin/signin.css`).catch(() => {
    // CSS loading error handled silently
  });

  // Create modal content
  const content = createElement('div', {
    className: 'signin-modal',
  });

  // Handle
  const handle = createElement('div', {
    className: 'signin-modal-handle',
  });
  content.appendChild(handle);

  // Top area
  const topArea = createElement('div', {
    className: 'signin-modal-top',
  });

  // Title
  const title = createElement('h2', {
    className: 'signin-modal-title',
    textContent: 'Welcome back!',
  });
  topArea.appendChild(title);

  // Description
  const description = createElement('p', {
    className: 'signin-modal-description',
    textContent: 'Login in with your UFS account to get access to your personalised hub',
  });
  topArea.appendChild(description);

  // Form container
  const formContainer = createElement('div', {
    className: 'signin-modal-form',
  });

  // Email field
  const emailGroup = createElement('div', {
    className: 'signin-form-group',
  });
  const emailLabel = createElement('label', {
    className: 'signin-form-label',
    textContent: 'Email address',
  });
  const emailInput = createElement('input', {
    className: 'signin-form-input',
    properties: {
      type: 'email',
      placeholder: 'email@example.com',
    },
  });
  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);
  formContainer.appendChild(emailGroup);

  // Password field
  const passwordGroup = createElement('div', {
    className: 'signin-form-group',
  });
  const passwordLabel = createElement('label', {
    className: 'signin-form-label',
    textContent: 'Password',
  });
  const passwordInputWrapper = createElement('div', {
    className: 'signin-form-input-wrapper',
  });
  const passwordInput = createElement('input', {
    className: 'signin-form-input',
    properties: {
      type: 'password',
      placeholder: '******',
    },
  });
  const revealButton = createElement('button', {
    className: 'signin-form-reveal',
    properties: {
      type: 'button',
      'aria-label': 'Toggle password visibility',
    },
  });
  revealButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 16.5C9.24 16.5 7 14.26 7 11.5C7 8.74 9.24 6.5 12 6.5C14.76 6.5 17 8.74 17 11.5C17 14.26 14.76 16.5 12 16.5ZM12 8.5C10.34 8.5 9 9.84 9 11.5C9 13.16 10.34 14.5 12 14.5C13.66 14.5 15 13.16 15 11.5C15 9.84 13.66 8.5 12 8.5Z" fill="#333"/>
    </svg>
  `;
  
  // Toggle password visibility
  revealButton.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
  });

  passwordInputWrapper.appendChild(passwordInput);
  passwordInputWrapper.appendChild(revealButton);
  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInputWrapper);
  formContainer.appendChild(passwordGroup);

  // Forgot password link
  const forgotPassword = createElement('p', {
    className: 'signin-form-forgot',
  });
  const forgotLink = createElement('a', {
    className: 'signin-form-forgot-link',
    textContent: 'Forgot your password?',
    properties: {
      href: '#',
    },
  });
  forgotPassword.appendChild(forgotLink);
  formContainer.appendChild(forgotPassword);

  // Sign in button
  const signInButton = createElement('button', {
    className: 'signin-form-button',
    textContent: 'Sign in',
    properties: {
      type: 'button',
    },
  });
  formContainer.appendChild(signInButton);

  topArea.appendChild(formContainer);
  content.appendChild(topArea);

  // Bottom area
  const bottomArea = createElement('div', {
    className: 'signin-modal-bottom',
  });
  const bottomText = createElement('p', {
    className: 'signin-modal-bottom-text',
  });
  bottomText.innerHTML = 'Don\'t have an account? <a href="#" class="signin-modal-bottom-link">Continue here</a> to get your personalised hub';
  bottomArea.appendChild(bottomText);
  content.appendChild(bottomArea);

  // Create modal
  const modal = createModal({
    content,
    showCloseButton: false,
    overlayClass: 'modal-overlay signin-modal-overlay',
    contentClass: 'modal-content signin-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
  });

  return modal;
}
