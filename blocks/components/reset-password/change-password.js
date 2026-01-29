import { createElement } from '@scripts/common.js';
import createModal from '@components/modal/index.js';
import { loadCSS } from '@scripts/aem.js';
import { resetPassword } from '@auth/authService.js';

function createPasswordRequirement(text, isValid) {
  const requirement = createElement('div', {
    className: 'password-requirement',
  });

  const icon = createElement('div', {
    className: `password-requirement-icon ${isValid ? 'password-requirement-valid' : ''}`,
  });
  icon.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 15L13 19L21 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;

  const textElement = createElement('p', {
    className: `password-requirement-text ${isValid ? 'password-requirement-text-valid' : ''}`,
    innerContent: text,
  });

  requirement.appendChild(icon);
  requirement.appendChild(textElement);

  return requirement;
}

function validatePassword(password) {
  return {
    minLength: password.length >= 8,
    hasCapital: /[A-Z]/.test(password),
    hasNumberOrSymbol: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

export default function openChangePasswordModal(email) {
  loadCSS(`${window.hlx.codeBasePath}/blocks/components/reset-password/reset-password.css`).catch(() => {});
  loadCSS(`${window.hlx.codeBasePath}/blocks/components/signup/signup.css`).catch(() => {});

  const content = createElement('div', {
    className: 'change-password-modal',
  });

  const topArea = createElement('div', {
    className: 'change-password-modal-top',
  });

  const title = createElement('h2', {
    className: 'change-password-modal-title',
  });
  title.textContent = 'Change your password';
  topArea.appendChild(title);

  const description = createElement('p', {
    className: 'change-password-modal-description',
  });
  description.textContent = 'Please follow the indications to set your new password';
  topArea.appendChild(description);

  const formContainer = createElement('div', {
    className: 'change-password-modal-form',
  });

  const passwordGroup = createElement('div', {
    className: 'form-group',
  });
  const passwordLabel = createElement('label', {
    className: 'form-label',
  });
  passwordLabel.textContent = 'Password';
  const passwordInputWrapper = createElement('div', {
    className: 'form-input-wrapper',
  });
  const passwordInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'password',
      placeholder: '******',
    },
  });
  const revealButton = createElement('button', {
    className: 'signup-form-reveal',
    attributes: {
      type: 'button',
      'aria-label': 'Toggle password visibility',
    },
  });
  revealButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 16.5C9.24 16.5 7 14.26 7 11.5C7 8.74 9.24 6.5 12 6.5C14.76 6.5 17 8.74 17 11.5C17 14.26 14.76 16.5 12 16.5ZM12 8.5C10.34 8.5 9 9.84 9 11.5C9 13.16 10.34 14.5 12 14.5C13.66 14.5 15 13.16 15 11.5C15 9.84 13.66 8.5 12 8.5Z" fill="#333"/>
    </svg>
  `;

  revealButton.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
  });

  passwordInputWrapper.appendChild(passwordInput);
  passwordInputWrapper.appendChild(revealButton);
  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInputWrapper);
  formContainer.appendChild(passwordGroup);

  const requirementsContainer = createElement('div', {
    className: 'password-requirements',
  });

  const requirement1 = createPasswordRequirement('At least 8 characters', false);
  const requirement2 = createPasswordRequirement('Contains a capital letter', false);
  const requirement3 = createPasswordRequirement('Contains a number or symbol', false);

  requirementsContainer.appendChild(requirement1);
  requirementsContainer.appendChild(requirement2);
  requirementsContainer.appendChild(requirement3);

  formContainer.appendChild(requirementsContainer);

  const errorMessage = createElement('div', {
    className: 'change-password-form-error',
    attributes: {
      style: 'display: none; color: var(--ufs-orange); font-size: var(--body-font-size-xs); margin-top: 8px; text-align: center;',
    },
  });
  formContainer.appendChild(errorMessage);

  const submitButton = createElement('button', {
    className: 'btn-primary',
    innerContent: 'Update my Password',
    attributes: {
      type: 'button',
    },
  });
  formContainer.appendChild(submitButton);

  const updateRequirements = () => {
    const password = passwordInput.value;
    const validation = validatePassword(password);

    const req1 = requirement1.querySelector('.password-requirement-icon');
    const req1Text = requirement1.querySelector('.password-requirement-text');
    if (validation.minLength) {
      req1.classList.add('password-requirement-valid');
      req1Text.classList.add('password-requirement-text-valid');
      req1.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 15L13 19L21 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    } else {
      req1.classList.remove('password-requirement-valid');
      req1Text.classList.remove('password-requirement-text-valid');
      req1.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 15L13 19L21 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }

    const req2 = requirement2.querySelector('.password-requirement-icon');
    const req2Text = requirement2.querySelector('.password-requirement-text');
    if (validation.hasCapital) {
      req2.classList.add('password-requirement-valid');
      req2Text.classList.add('password-requirement-text-valid');
      req2.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 15L13 19L21 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    } else {
      req2.classList.remove('password-requirement-valid');
      req2Text.classList.remove('password-requirement-text-valid');
      req2.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 15L13 19L21 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }

    const req3 = requirement3.querySelector('.password-requirement-icon');
    const req3Text = requirement3.querySelector('.password-requirement-text');
    if (validation.hasNumberOrSymbol) {
      req3.classList.add('password-requirement-valid');
      req3Text.classList.add('password-requirement-text-valid');
      req3.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 15L13 19L21 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    } else {
      req3.classList.remove('password-requirement-valid');
      req3Text.classList.remove('password-requirement-text-valid');
      req3.innerHTML = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 15L13 19L21 11" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    }
  };

  passwordInput.addEventListener('input', updateRequirements);

  topArea.appendChild(formContainer);
  content.appendChild(topArea);

  const modal = createModal({
    content,
    showCloseButton: false,
    overlayClass: 'modal-overlay change-password-modal-overlay',
    contentClass: 'modal-content change-password-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
  });

  submitButton.addEventListener('click', async () => {
    const password = passwordInput.value;
    const validation = validatePassword(password);

    errorMessage.style.display = 'none';
    errorMessage.textContent = '';

    if (!password) {
      errorMessage.textContent = 'Please enter a password';
      errorMessage.style.display = 'block';
      passwordInput.focus();
      return;
    }

    if (!validation.minLength || !validation.hasCapital || !validation.hasNumberOrSymbol) {
      errorMessage.textContent = 'Please meet all password requirements';
      errorMessage.style.display = 'block';
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'Updating...';

    try {
      await resetPassword(email, '');
      modal.close();
      window.location.reload();
    } catch (error) {
      errorMessage.textContent = error.message ?? 'Failed to update password. Please try again.';
      errorMessage.style.color = 'var(--ufs-orange)';
      errorMessage.style.display = 'block';
      submitButton.disabled = false;
      submitButton.textContent = 'Update my Password';
    }
  });

  modal.open();

  return modal;
}
