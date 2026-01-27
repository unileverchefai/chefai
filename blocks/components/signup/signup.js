import { createElement } from '@scripts/common.js';
import createModal from '@components/modal/index.js';
import { loadCSS } from '@scripts/aem.js';
import openCookieAgreementModal from '@components/cookie-agreement/index.js';
import { register } from '@auth/authService.js';

/**
 * Opens the sign-up modal
 * @returns {Object} Modal instance
 */
export default function openSignUpModal() {
  // Load sign-up CSS
  loadCSS(`${window.hlx.codeBasePath}/blocks/components/signup/signup.css`).catch(() => {
    // CSS loading error handled silently
  });

  // Check if cookies were accepted
  const cookiesAccepted = sessionStorage.getItem('personalized-hub-consent') === 'true';

  // Create modal content
  const content = createElement('div', {
    className: 'signup-modal',
  });

  // Top area
  const topArea = createElement('div', {
    className: 'signup-modal-top',
  });

  // Title
  const title = createElement('h2', {
    className: 'signup-modal-title',
    innerContent: 'Get the Global Report',
  });
  topArea.appendChild(title);

  // Description
  const description = createElement('p', {
    className: 'signup-modal-description',
    innerContent: 'Please provide the following information to get access to the report.',
  });
  topArea.appendChild(description);

  // Form container
  const formContainer = createElement('div', {
    className: 'signup-modal-form',
  });

  // Email field
  const emailGroup = createElement('div', {
    className: 'form-group',
  });
  const emailLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'Email address',
  });
  const emailInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'email',
      placeholder: 'restaurant_name@gmail.com',
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
    innerContent: 'Password',
  });
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
  const passwordRevealButton = createElement('button', {
    className: 'signin-form-reveal',
    attributes: {
      type: 'button',
      'aria-label': 'Toggle password visibility',
    },
  });
  passwordRevealButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 16.5C9.24 16.5 7 14.26 7 11.5C7 8.74 9.24 6.5 12 6.5C14.76 6.5 17 8.74 17 11.5C17 14.26 14.76 16.5 12 16.5ZM12 8.5C10.34 8.5 9 9.84 9 11.5C9 13.16 10.34 14.5 12 14.5C13.66 14.5 15 13.16 15 11.5C15 9.84 13.66 8.5 12 8.5Z" fill="#333"/>
    </svg>
  `;

  // Toggle password visibility
  passwordRevealButton.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
  });

  passwordInputWrapper.appendChild(passwordInput);
  passwordInputWrapper.appendChild(passwordRevealButton);
  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInputWrapper);
  formContainer.appendChild(passwordGroup);

  // Confirm password field
  const confirmPasswordGroup = createElement('div', {
    className: 'form-group',
  });
  const confirmPasswordLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'Confirm password',
  });
  const confirmPasswordInputWrapper = createElement('div', {
    className: 'form-input-wrapper',
  });
  const confirmPasswordInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'password',
      placeholder: '******',
    },
  });
  const confirmPasswordRevealButton = createElement('button', {
    className: 'signin-form-reveal',
    attributes: {
      type: 'button',
      'aria-label': 'Toggle password visibility',
    },
  });
  confirmPasswordRevealButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4C7 4 2.73 7.11 1 11.5C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 11.5C21.27 7.11 17 4 12 4ZM12 16.5C9.24 16.5 7 14.26 7 11.5C7 8.74 9.24 6.5 12 6.5C14.76 6.5 17 8.74 17 11.5C17 14.26 14.76 16.5 12 16.5ZM12 8.5C10.34 8.5 9 9.84 9 11.5C9 13.16 10.34 14.5 12 14.5C13.66 14.5 15 13.16 15 11.5C15 9.84 13.66 8.5 12 8.5Z" fill="#333"/>
    </svg>
  `;

  // Toggle confirm password visibility
  confirmPasswordRevealButton.addEventListener('click', () => {
    const isPassword = confirmPasswordInput.type === 'password';
    confirmPasswordInput.type = isPassword ? 'text' : 'password';
  });

  confirmPasswordInputWrapper.appendChild(confirmPasswordInput);
  confirmPasswordInputWrapper.appendChild(confirmPasswordRevealButton);
  confirmPasswordGroup.appendChild(confirmPasswordLabel);
  confirmPasswordGroup.appendChild(confirmPasswordInputWrapper);
  formContainer.appendChild(confirmPasswordGroup);

  // First name and Surname row (side-by-side on desktop)
  const nameRow = createElement('div', {
    className: 'form-row',
  });

  // First name field
  const firstNameGroup = createElement('div', {
    className: 'form-group',
  });
  const firstNameLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'First name',
  });
  const firstNameInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'text',
      placeholder: 'John',
    },
  });
  firstNameGroup.appendChild(firstNameLabel);
  firstNameGroup.appendChild(firstNameInput);
  nameRow.appendChild(firstNameGroup);

  // Surname field
  const surnameGroup = createElement('div', {
    className: 'form-group',
  });
  const surnameLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'Surname',
  });
  const surnameInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'text',
      placeholder: 'Smith',
    },
  });
  surnameGroup.appendChild(surnameLabel);
  surnameGroup.appendChild(surnameInput);
  nameRow.appendChild(surnameGroup);

  formContainer.appendChild(nameRow);

  // Business type field (dropdown)
  const businessTypeGroup = createElement('div', {
    className: 'form-group',
  });
  const businessTypeLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'Business type',
  });
  const businessTypeWrapper = createElement('div', {
    className: 'form-input-wrapper',
  });
  const businessTypeSelect = createElement('select', {
    className: 'form-input form-select',
    attributes: {
      name: 'business-type',
    },
  });

  // Business type options
  const businessTypes = [
    'Independent Restaurant',
    'Chain Restaurant',
    'Hotel',
    'Catering',
    'Other',
  ];

  businessTypes.forEach((type) => {
    const option = createElement('option', {
      attributes: {
        value: type.toLowerCase().replace(/\s+/g, '-'),
      },
      innerContent: type,
    });
    businessTypeSelect.appendChild(option);
  });

  businessTypeWrapper.appendChild(businessTypeSelect);
  businessTypeGroup.appendChild(businessTypeLabel);
  businessTypeGroup.appendChild(businessTypeWrapper);
  formContainer.appendChild(businessTypeGroup);

  // Marketing consent checkbox
  const consentGroup = createElement('div', {
    className: 'form-checkbox-group',
  });
  const consentCheckbox = createElement('input', {
    className: 'form-checkbox',
    properties: {
      type: 'checkbox',
      id: 'marketing-consent',
      name: 'marketing-consent',
    },
  });
  const consentLabel = createElement('label', {
    className: 'form-checkbox-label',
    attributes: {
      for: 'marketing-consent',
    },
    innerContent: 'I want to receive offers and updates from Unilever Food Solutions tailored to my interests and preferences',
  });
  consentGroup.appendChild(consentCheckbox);
  consentGroup.appendChild(consentLabel);
  formContainer.appendChild(consentGroup);

  // Error message container
  const errorMessage = createElement('div', {
    className: 'signup-form-error',
    attributes: {
      style: 'display: none; color: var(--ufs-orange); font-size: var(--body-font-size-xs); margin-top: 8px; text-align: center;',
    },
  });
  formContainer.appendChild(errorMessage);

  topArea.appendChild(formContainer);
  content.appendChild(topArea);

  // Bottom area
  const bottomArea = createElement('div', {
    className: 'signup-modal-bottom',
  });
  const signUpButton = createElement('button', {
    className: 'btn-primary',
    innerContent: 'Sign up now',
    attributes: {
      type: 'button',
    },
  });
  bottomArea.appendChild(signUpButton);
  content.appendChild(bottomArea);

  // Create modal
  const modal = createModal({
    content,
    showCloseButton: false,
    overlayClass: 'modal-overlay signup-modal-overlay',
    contentClass: 'modal-content signup-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
  });

  // Handle sign up button click
  signUpButton.addEventListener('click', async () => {
    // Collect form values
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const firstName = firstNameInput.value.trim();
    const lastName = surnameInput.value.trim();
    const businessType = businessTypeSelect.value;
    const mobilePhone = ''; // Not in form currently, default to empty
    const marketingConsent = consentCheckbox.checked;

    // Clear previous errors
    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    errorMessage.style.color = 'var(--ufs-orange)';

    // Validate required fields
    if (!email || !password || !confirmPassword || !firstName || !lastName || !businessType) {
      errorMessage.textContent = 'Please fill in all required fields';
      errorMessage.style.display = 'block';
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      errorMessage.textContent = 'Passwords do not match';
      errorMessage.style.display = 'block';
      confirmPasswordInput.focus();
      return;
    }

    // Show loading state
    signUpButton.disabled = true;
    signUpButton.textContent = 'Signing up...';

    try {
      const formData = {
        email,
        password,
        confirmPassword,
        firstName,
        lastName,
        businessType,
        mobilePhone,
        marketingConsent,
      };

      await register(formData);
      // Success - close modal and show success message
      modal.close();
      // Show success message (could be a toast notification)
      // For now, we'll just close the modal
    } catch (error) {
      // Show error message
      errorMessage.textContent = error.message ?? 'Registration failed. Please try again.';
      errorMessage.style.display = 'block';
      signUpButton.disabled = false;
      signUpButton.textContent = 'Sign up now';
    }
  });

  // If cookies not accepted, show cookie modal first
  if (!cookiesAccepted) {
    openCookieAgreementModal(
      () => {
        // On agree, show the signup form
        modal.open();
      },
      () => {
        // On close, do nothing (user cancelled)
      },
    );
  } else {
    // Cookies already accepted, show signup form directly
    modal.open();
  }

  return modal;
}
