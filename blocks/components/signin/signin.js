import { createElement } from '@scripts/common.js';
import createModal from '@components/modal/index.js';
import { loadCSS } from '@scripts/aem.js';
import { login } from '@auth/authService.js';
import openCookieAgreementModal from '@components/cookie-agreement/index.js';

/**
 * Opens the sign-in modal
 * @returns {Object} Modal instance
 */
export default function openSignInModal() {
  // Load sign-in CSS
  loadCSS(`${window.hlx.codeBasePath}/blocks/sign-in/sign-in.css`).catch(() => {
    // CSS loading error handled silently
  });

  // Create modal content
  const content = createElement('div', {
    className: 'signin-modal',
  });

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
    className: 'form-group',
  });
  const emailLabel = createElement('label', {
    className: 'form-label',
    textContent: 'Email address',
  });
  const emailInput = createElement('input', {
    className: 'form-input',
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
    className: 'form-group',
  });
  const passwordLabel = createElement('label', {
    className: 'form-label',
    textContent: 'Password',
  });
  const passwordInputWrapper = createElement('div', {
    className: 'form-input-wrapper',
  });
  const passwordInput = createElement('input', {
    className: 'form-input',
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

  // Error message container
  const errorMessage = createElement('div', {
    className: 'signin-form-error',
    properties: {
      style: 'display: none; color: var(--ufs-orange); font-size: var(--body-font-size-xs); margin-top: 8px; text-align: center;',
    },
  });
  formContainer.appendChild(errorMessage);

  // Sign in button
  const signInButton = createElement('button', {
    className: 'btn-primary',
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
  const continueLink = createElement('a', {
    className: 'signin-modal-bottom-link',
    textContent: 'Continue here',
    properties: {
      href: '#',
    },
  });
  bottomText.textContent = 'Don\'t have an account? ';
  bottomText.appendChild(continueLink);
  bottomText.appendChild(document.createTextNode(' to get your personalised hub'));
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

  // Handle continue link click
  continueLink.addEventListener('click', async (e) => {
    e.preventDefault();
    modal.close();
    // Dynamically import and open signup modal
    const { default: openSignUpModal } = await import('../signup/index.js');
    openSignUpModal();
  });

  forgotLink.addEventListener('click', async (e) => {
    e.preventDefault();
    modal.close();
    const { default: openResetPasswordModal } = await import('../reset-password/index.js');
    openResetPasswordModal();
  });

  // Handle sign in button click
  signInButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Clear previous errors
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    errorMessage.style.color = 'var(--ufs-orange)';

    // Validate fields
    if (!email || !password) {
      errorMessage.textContent = 'Please enter your email and password';
      errorMessage.style.display = 'block';
      return;
    }

    // Show loading state
    signInButton.disabled = true;
    signInButton.textContent = 'Signing in...';

    try {
      await login(email, password);
      modal.close();

      const cookiesAccepted = sessionStorage.getItem('personalized-hub-consent') === 'true';
      if (!cookiesAccepted) {
        openCookieAgreementModal(
          () => {
            window.location.reload();
          },
          () => {},
          true,
        );
      } else {
        window.location.reload();
      }
    } catch (error) {
      // Show error message
      errorMessage.textContent = error.message ?? 'Invalid email or password. Please try again.';
      errorMessage.style.display = 'block';
      signInButton.disabled = false;
      signInButton.textContent = 'Sign in';
    }
  });

  modal.open();

  return modal;
}
