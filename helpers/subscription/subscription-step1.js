import { createElement } from '@scripts/common.js';
import createModal from '@helpers/modal/index.js';
import { loadCSS } from '@scripts/aem.js';

export default function openSubscriptionStep1(onContinue) {
  loadCSS(`${window.hlx.codeBasePath}/helpers/signup/signup.css`).catch(() => {});

  const content = createElement('div', {
    className: 'signup-modal',
  });

  const topArea = createElement('div', {
    className: 'signup-modal-top',
  });

  const title = createElement('h2', {
    className: 'signup-modal-title',
  });
  title.textContent = 'Be the first to know';
  topArea.appendChild(title);

  const description = createElement('p', {
    className: 'signup-modal-description',
  });
  description.textContent = 'Get notified when Future Menus Vol. 4 is live - along with latest recipes and inspirational content, just for professional kitchens!';
  topArea.appendChild(description);

  const formContainer = createElement('div', {
    className: 'signup-modal-form',
  });

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

  const consentGroup = createElement('div', {
    className: 'form-checkbox-group',
  });
  const consentCheckbox = createElement('input', {
    className: 'form-checkbox',
    attributes: {
      type: 'checkbox',
      id: 'marketing-consent-step1',
      name: 'marketing-consent',
    },
  });
  const consentLabel = createElement('label', {
    className: 'form-checkbox-label',
    attributes: {
      for: 'marketing-consent-step1',
    },
    innerContent: 'I want to receive offers and updates from Unilever Food Solutions tailored to my interests and preferences',
  });
  consentGroup.appendChild(consentCheckbox);
  consentGroup.appendChild(consentLabel);
  formContainer.appendChild(consentGroup);

  const errorMessage = createElement('div', {
    className: 'signup-form-error',
    attributes: {
      style: 'display: none; color: var(--ufs-orange); font-size: var(--body-font-size-xs); margin-top: 8px; text-align: center;',
    },
  });
  formContainer.appendChild(errorMessage);

  topArea.appendChild(formContainer);
  content.appendChild(topArea);

  const bottomArea = createElement('div', {
    className: 'signup-modal-bottom',
  });
  const submitButton = createElement('button', {
    className: 'btn-primary',
    innerContent: 'Signup to be the first to know',
    attributes: {
      type: 'button',
    },
  });
  bottomArea.appendChild(submitButton);
  content.appendChild(bottomArea);

  const modal = createModal({
    content,
    showCloseButton: false,
    overlayClass: 'modal-overlay signup-modal-overlay',
    contentClass: 'modal-content signup-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
  });

  submitButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const firstName = firstNameInput.value.trim();
    const lastName = surnameInput.value.trim();
    const businessType = businessTypeSelect.value;
    const marketingConsent = consentCheckbox.checked;

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
      marketingConsent,
    };

    modal.close();
    if (onContinue) {
      onContinue(formData);
    }
  });

  modal.open();

  return modal;
}
