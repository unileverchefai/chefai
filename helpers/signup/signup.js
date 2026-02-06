import { createElement } from '@scripts/common.js';
import createModal from '@helpers/modal/index.js';
import { loadCSS } from '@scripts/aem.js';

export default function openSignUpReportModal() {
  loadCSS(`${window.hlx.codeBasePath}/helpers/signup/signup.css`).catch(() => {});

  const content = createElement('div', {
    className: 'signup-modal',
  });

  const topArea = createElement('div', {
    className: 'signup-modal-top',
  });

  const title = createElement('h2', {
    className: 'signup-modal-title',
    innerContent: 'Your report is ready!',
  });
  topArea.appendChild(title);

  const description = createElement('p', {
    className: 'signup-modal-description',
    innerContent: 'Please provide the details below to unlock your tailored report and receive recipes, trends and other valuable resources.',
  });
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

  const consentGroup = createElement('div', {
    className: 'form-checkbox-group',
  });
  const consentCheckbox = createElement('input', {
    className: 'form-checkbox',
    attributes: {
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
  const continueButton = createElement('button', {
    className: 'btn-primary',
    innerContent: 'Continue',
    attributes: {
      type: 'button',
    },
  });
  bottomArea.appendChild(continueButton);
  content.appendChild(bottomArea);

  // Restore saved form data
  const saved = sessionStorage.getItem('signup_form');
  if (saved) {
    const data = JSON.parse(saved);
    emailInput.value = data.email ?? '';
    firstNameInput.value = data.firstName ?? '';
    surnameInput.value = data.lastName ?? '';
    consentCheckbox.checked = data.marketingConsent ?? false;
  }

  const modal = createModal({
    content,
    showCloseButton: false,
    overlayClass: 'modal-overlay signup-modal-overlay',
    contentClass: 'modal-content signup-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
    onClose: () => {
      sessionStorage.setItem('signup_form', JSON.stringify({
        email: emailInput.value,
        firstName: firstNameInput.value,
        lastName: surnameInput.value,
        marketingConsent: consentCheckbox.checked,
      }));
    },
  });

  continueButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const firstName = firstNameInput.value.trim();
    const lastName = surnameInput.value.trim();
    const marketingConsent = consentCheckbox.checked;
    const mobilePhone = '';

    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    errorMessage.style.color = 'var(--ufs-orange)';

    if (!email || !firstName || !lastName) {
      errorMessage.textContent = 'Please fill in all required fields';
      errorMessage.style.display = 'block';
      return;
    }

    const formData = {
      email,
      firstName,
      lastName,
      mobilePhone,
      marketingConsent,
    };

    sessionStorage.removeItem('signup_form');
    modal.close();

    const { default: openSignupPasswordModal } = await import('./signup-password.js');
    openSignupPasswordModal(email, formData);
  });

  modal.open();

  return modal;
}
