import { createElement } from '@scripts/common.js';
import createModal from '@components/modal/index.js';
import { loadCSS } from '@scripts/aem.js';

export default function openSignUpReportModal() {
  loadCSS(`${window.hlx.codeBasePath}/blocks/components/signup/signup.css`).catch(() => {});

  const content = createElement('div', {
    className: 'signup-modal',
  });

  const topArea = createElement('div', {
    className: 'signup-modal-top',
  });

  const title = createElement('h2', {
    className: 'signup-modal-title',
    textContent: 'Your report is ready!',
  });
  topArea.appendChild(title);

  const description = createElement('p', {
    className: 'signup-modal-description',
    textContent:
      'Please provide the details below to unlock your tailored report and receive recipes, trends and other valuable resources.',
  });
  topArea.appendChild(description);

  const formContainer = createElement('div', {
    className: 'signup-modal-form',
  });

  const businessInfoWrapper = createElement('div', {
    className: 'signup-business-info',
  });
  const businessInfoTitle = createElement('p', {
    className: 'signup-business-info-title',
    textContent: 'Business information',
  });
  const businessInfoText = createElement('p', {
    className: 'signup-business-info-text',
    textContent: '',
  });

  try {
    const stored = sessionStorage.getItem('personalized-hub-business-data');
    if (stored) {
      const parsed = JSON.parse(stored);
      const name = parsed?.business_name ?? '';
      const type = parsed?.business_type ?? '';
      businessInfoText.textContent = [name, type].filter(Boolean).join('. ');
    }
  } catch {
    businessInfoText.textContent = '';
  }

  businessInfoWrapper.appendChild(businessInfoTitle);
  businessInfoWrapper.appendChild(businessInfoText);
  formContainer.appendChild(businessInfoWrapper);

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

  const nameRow = createElement('div', {
    className: 'form-row',
  });

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
    textContent:
      'I want to receive offers and updates from Unilever Food Solutions tailored to my interests and preferences',
  });
  consentGroup.appendChild(consentCheckbox);
  consentGroup.appendChild(consentLabel);
  formContainer.appendChild(consentGroup);

  const errorMessage = createElement('div', {
    className: 'signup-form-error',
    properties: {
      style:
        'display: none; color: var(--ufs-orange); font-size: var(--body-font-size-xs); margin-top: 8px; text-align: center;',
    },
  });
  formContainer.appendChild(errorMessage);

  topArea.appendChild(formContainer);
  content.appendChild(topArea);

  const bottomArea = createElement('div', {
    className: 'signup-modal-bottom',
  });
  const continueButton = createElement('button', {
    className: 'btn-primary',
    textContent: 'Continue',
    properties: {
      type: 'button',
    },
  });
  bottomArea.appendChild(continueButton);
  content.appendChild(bottomArea);

  const modal = createModal({
    content,
    showCloseButton: false,
    overlayClass: 'modal-overlay signup-modal-overlay',
    contentClass: 'modal-content signup-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
  });

  continueButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const firstName = firstNameInput.value.trim();
    const lastName = surnameInput.value.trim();
    const businessType = businessTypeSelect.value;
    const marketingConsent = consentCheckbox.checked;
    const mobilePhone = '';

    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    errorMessage.style.color = 'var(--ufs-orange)';

    if (!email || !firstName || !lastName || !businessType) {
      errorMessage.textContent = 'Please fill in all required fields';
      errorMessage.style.display = 'block';
      return;
    }

    const formData = {
      email,
      firstName,
      lastName,
      businessType,
      mobilePhone,
      marketingConsent,
    };

    modal.close();

    const { default: openSignupPasswordModal } = await import('./signup-password.js');
    openSignupPasswordModal(formData);
  });

  modal.open();

  return modal;
}

