import { createElement, FORGET_PW_MODAL_PLACEHOLDERS, SIGNIN_MODAL_PLACEHOLDERS } from '@scripts/common.js';
import createModal from '@helpers/modal/index.js';
import { loadCSS } from '@scripts/aem.js';
import { getPlaceholderText } from '@scripts/custom/utils.js';

export default function openResetPasswordModal() {
  loadCSS(`${window.hlx.codeBasePath}/helpers/reset-password/reset-password.css`).catch(() => {});

  const content = createElement('div', {
    className: 'reset-password-modal',
  });

  const topArea = createElement('div', {
    className: 'reset-password-modal-top',
  });

  const title = createElement('h2', {
    className: 'reset-password-modal-title',
    innerContent: getPlaceholderText(FORGET_PW_MODAL_PLACEHOLDERS, 'forgot_pwd_title'),
  });
  topArea.appendChild(title);

  const description = createElement('p', {
    className: 'reset-password-modal-description',
    innerContent: getPlaceholderText(FORGET_PW_MODAL_PLACEHOLDERS, 'forgot_pwd_desc'),
  });
  topArea.appendChild(description);

  const formContainer = createElement('div', {
    className: 'reset-password-modal-form',
  });

  const emailGroup = createElement('div', {
    className: 'form-group',
  });
  const emailLabel = createElement('label', {
    className: 'form-label',
    innerContent: getPlaceholderText(SIGNIN_MODAL_PLACEHOLDERS, 'label_email'),
  });
  const emailInput = createElement('input', {
    className: 'form-input',
    attributes: {
      type: 'email',
      placeholder: getPlaceholderText(SIGNIN_MODAL_PLACEHOLDERS, 'placeholder_email'),
    },
  });
  emailGroup.appendChild(emailLabel);
  emailGroup.appendChild(emailInput);
  formContainer.appendChild(emailGroup);

  const errorMessage = createElement('div', {
    className: 'reset-password-form-error',
    attributes: {
      style: 'display: none; color: var(--ufs-orange); font-size: var(--body-font-size-xs); margin-top: 8px; text-align: center;',
    },
  });
  formContainer.appendChild(errorMessage);

  const submitButton = createElement('button', {
    className: 'btn-primary',
    innerContent: getPlaceholderText(FORGET_PW_MODAL_PLACEHOLDERS, 'btn_continue'),
    attributes: {
      type: 'button',
    },
  });
  formContainer.appendChild(submitButton);

  topArea.appendChild(formContainer);
  content.appendChild(topArea);

  const bottomArea = createElement('div', {
    className: 'reset-password-modal-bottom',
  });
  const cancelLink = createElement('button', {
    className: 'reset-password-modal-cancel',
    innerContent: getPlaceholderText(FORGET_PW_MODAL_PLACEHOLDERS, 'btn_cancel'),
    attributes: {
      type: 'button',
    },
  });
  bottomArea.appendChild(cancelLink);
  content.appendChild(bottomArea);

  // Restore saved form data
  const saved = sessionStorage.getItem('reset_password_form');
  if (saved) {
    const data = JSON.parse(saved);
    emailInput.value = data.email ?? '';
  }

  const modal = createModal({
    content,
    showCloseButton: false,
    overlayClass: 'modal-overlay reset-password-modal-overlay',
    contentClass: 'modal-content reset-password-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
    onClose: () => {
      sessionStorage.setItem('reset_password_form', JSON.stringify({
        email: emailInput.value,
      }));
    },
  });

  cancelLink.addEventListener('click', () => {
    modal.close();
  });

  submitButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();

    errorMessage.style.display = 'none';
    errorMessage.textContent = '';
    errorMessage.style.color = 'var(--ufs-orange)';

    if (!email) {
      errorMessage.textContent = getPlaceholderText(FORGET_PW_MODAL_PLACEHOLDERS, 'auth_email_required');
      errorMessage.style.display = 'block';
      emailInput.focus();
      return;
    }

    sessionStorage.removeItem('reset_password_form');
    modal.close();
    const { default: openChangePasswordModal } = await import('./change-password.js');
    openChangePasswordModal(email);
  });

  modal.open();

  return modal;
}
