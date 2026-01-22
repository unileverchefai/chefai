import { createElement } from '../../scripts/common.js';
import createModal from '../modal/index.js';
import { loadCSS } from '../../scripts/aem.js';
import openCookieAgreementModal from '../cookie-agreement/cookie-agreement.js';

/**
 * Opens the sign-up modal
 * @returns {Object} Modal instance
 */
export default function openSignUpModal() {
  // Load sign-up CSS
  loadCSS(`${window.hlx.codeBasePath}/components/signup/signup.css`).catch(() => {
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
    textContent: 'Get the Global Report',
  });
  topArea.appendChild(title);

  // Description
  const description = createElement('p', {
    className: 'signup-modal-description',
    textContent: 'Please provide the following information to get access to the report.',
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
    textContent: 'Email address',
  });
  const emailInput = createElement('input', {
    className: 'form-input',
    properties: {
      type: 'email',
      placeholder: 'restaurant_name@gmail.com',
    },
  });
  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);
  formContainer.appendChild(emailGroup);

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
    textContent: 'First name',
  });
  const firstNameInput = createElement('input', {
    className: 'form-input',
    properties: {
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
    textContent: 'Surname',
  });
  const surnameInput = createElement('input', {
    className: 'form-input',
    properties: {
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
    textContent: 'Business type',
  });
  const businessTypeWrapper = createElement('div', {
    className: 'form-input-wrapper',
  });
  const businessTypeSelect = createElement('select', {
    className: 'form-input form-select',
    properties: {
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
      properties: {
        value: type.toLowerCase().replace(/\s+/g, '-'),
      },
      textContent: type,
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
    properties: {
      for: 'marketing-consent',
    },
    textContent: 'I want to receive offers and updates from Unilever Food Solutions tailored to my interests and preferences',
  });
  consentGroup.appendChild(consentCheckbox);
  consentGroup.appendChild(consentLabel);
  formContainer.appendChild(consentGroup);

  topArea.appendChild(formContainer);
  content.appendChild(topArea);

  // Bottom area
  const bottomArea = createElement('div', {
    className: 'signup-modal-bottom',
  });
  const signUpButton = createElement('button', {
    className: 'btn-primary',
    textContent: 'Sign up now',
    properties: {
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
