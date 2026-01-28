import { createElement } from '@scripts/common.js';
import createModal from '@components/modal/index.js';
import { loadCSS } from '@scripts/aem.js';

export default function openSubscriptionStep3(formData, onContinue) {
  loadCSS(`${window.hlx.codeBasePath}/blocks/components/signup/signup.css`).catch(() => {});

  const content = createElement('div', {
    className: 'signup-modal',
  });

  const topArea = createElement('div', {
    className: 'signup-modal-top',
  });

  const title = createElement('h2', {
    className: 'signup-modal-title',
  });
  title.textContent = 'Connect your business';
  topArea.appendChild(title);

  const description = createElement('p', {
    className: 'signup-modal-description',
  });
  description.textContent = 'Get promotions and inspiration personalised to your business.';
  topArea.appendChild(description);

  const formContainer = createElement('div', {
    className: 'signup-modal-form',
  });

  const businessNameGroup = createElement('div', {
    className: 'form-group',
  });
  const businessNameLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'Business name',
  });
  const businessNameInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'text',
      placeholder: 'Trattoria Da Mauro',
    },
  });
  businessNameGroup.appendChild(businessNameLabel);
  businessNameGroup.appendChild(businessNameInput);
  formContainer.appendChild(businessNameGroup);

  const cityZipRow = createElement('div', {
    className: 'form-row',
  });

  const cityGroup = createElement('div', {
    className: 'form-group',
  });
  const cityLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'City',
  });
  const cityInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'text',
      placeholder: 'Milano',
    },
  });
  cityGroup.appendChild(cityLabel);
  cityGroup.appendChild(cityInput);
  cityZipRow.appendChild(cityGroup);

  const zipGroup = createElement('div', {
    className: 'form-group',
  });
  const zipLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'Zip code',
  });
  const zipInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'text',
      placeholder: '3014 KC',
    },
  });
  zipGroup.appendChild(zipLabel);
  zipGroup.appendChild(zipInput);
  cityZipRow.appendChild(zipGroup);

  formContainer.appendChild(cityZipRow);

  const stateGroup = createElement('div', {
    className: 'form-group',
  });
  const stateLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'State',
  });
  const stateInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'text',
      placeholder: 'Lombardia',
    },
  });
  stateGroup.appendChild(stateLabel);
  stateGroup.appendChild(stateInput);
  formContainer.appendChild(stateGroup);

  const phoneRow = createElement('div', {
    className: 'form-row',
  });

  const countryCodeGroup = createElement('div', {
    className: 'form-group',
  });
  const countryCodeLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'Country code',
  });
  const countryCodeInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'text',
      placeholder: '+39',
    },
  });
  countryCodeGroup.appendChild(countryCodeLabel);
  countryCodeGroup.appendChild(countryCodeInput);
  phoneRow.appendChild(countryCodeGroup);

  const phoneGroup = createElement('div', {
    className: 'form-group',
  });
  const phoneLabel = createElement('label', {
    className: 'form-label',
    innerContent: 'Phone number',
  });
  const phoneInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'tel',
      placeholder: '618 948 3934',
    },
  });
  phoneGroup.appendChild(phoneLabel);
  phoneGroup.appendChild(phoneInput);
  phoneRow.appendChild(phoneGroup);

  formContainer.appendChild(phoneRow);

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
    innerContent: 'Sign up now',
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
    const businessName = businessNameInput.value.trim();
    const city = cityInput.value.trim();
    const zipCode = zipInput.value.trim();
    const state = stateInput.value.trim();
    const countryCode = countryCodeInput.value.trim();
    const phoneNumber = phoneInput.value.trim();

    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    errorMessage.style.color = 'var(--ufs-orange)';

    if (!businessName || !city || !zipCode || !state || !countryCode || !phoneNumber) {
      errorMessage.textContent = 'Please fill in all required fields';
      errorMessage.style.display = 'block';
      return;
    }

    const updatedFormData = {
      ...formData,
      businessName,
      city,
      zipCode,
      state,
      countryCode,
      phoneNumber: `${countryCode} ${phoneNumber}`,
    };

    modal.close();
    if (onContinue) {
      onContinue(updatedFormData);
    }
  });

  modal.open();

  return modal;
}
