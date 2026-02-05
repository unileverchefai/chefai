import { createElement } from '@scripts/common.js';
import createModal from '@helpers/modal/index.js';
import { loadCSS } from '@scripts/aem.js';

export default function openSubscriptionStep2(onCreateAccount, onMaybeLater) {
  loadCSS(`${window.hlx.codeBasePath}/helpers/signup/signup.css`).catch(() => {});
  loadCSS(`${window.hlx.codeBasePath}/helpers/subscription/subscription.css`).catch(() => {});

  const content = createElement('div', {
    className: 'signup-modal subscription-step2-modal',
  });

  const topArea = createElement('div', {
    className: 'signup-modal-top',
  });

  const title = createElement('h2', {
    className: 'signup-modal-title',
  });
  title.textContent = 'Thank you for subscribing!';
  topArea.appendChild(title);

  const description = createElement('p', {
    className: 'signup-modal-description',
  });
  description.textContent = 'You\'re now part of our community of passionate food professionals. We will notify you once Future Menus Vol. 4 is live.';
  topArea.appendChild(description);

  const benefitsWrapper = createElement('div', {
    className: 'subscription-benefits-wrapper',
  });

  const benefitsTitle = createElement('p', {
    className: 'subscription-benefits-title',
  });
  benefitsTitle.textContent = 'Just a few steps to creating an account...';
  benefitsWrapper.appendChild(benefitsTitle);

  const benefitsList = createElement('div', {
    className: 'subscription-benefits-list',
  });

  const benefit1 = createElement('p', {
    className: 'subscription-benefit-item',
  });
  benefit1.textContent = 'Get exclusive access to:';
  benefitsList.appendChild(benefit1);

  const benefit2 = createElement('p', {
    className: 'subscription-benefit-item',
  });
  benefit2.textContent = 'Get personalised chef inspiration';
  benefitsList.appendChild(benefit2);

  const benefit3 = createElement('p', {
    className: 'subscription-benefit-item',
  });
  benefit3.textContent = 'Access our Loyalty shop with great prizes';
  benefitsList.appendChild(benefit3);

  const benefit4 = createElement('p', {
    className: 'subscription-benefit-item',
  });
  benefit4.textContent = 'Receive exclusive deals and promotions';
  benefitsList.appendChild(benefit4);

  benefitsWrapper.appendChild(benefitsList);

  const actionsContainer = createElement('div', {
    className: 'subscription-actions-container',
  });

  const createAccountButton = createElement('button', {
    className: 'btn-primary',
    innerContent: 'Create my account',
    attributes: {
      type: 'button',
    },
  });

  const maybeLaterButton = createElement('button', {
    className: 'subscription-maybe-later',
    innerContent: 'Maybe later',
    attributes: {
      type: 'button',
    },
  });

  actionsContainer.appendChild(createAccountButton);
  actionsContainer.appendChild(maybeLaterButton);
  benefitsWrapper.appendChild(actionsContainer);

  topArea.appendChild(benefitsWrapper);
  content.appendChild(topArea);

  const modal = createModal({
    content,
    showCloseButton: false,
    overlayClass: 'modal-overlay signup-modal-overlay',
    contentClass: 'modal-content signup-modal-content',
    overlayBackground: 'var(--modal-overlay-bg)',
  });

  createAccountButton.addEventListener('click', () => {
    modal.close();
    if (onCreateAccount) {
      onCreateAccount();
    }
  });

  maybeLaterButton.addEventListener('click', () => {
    modal.close();
    if (onMaybeLater) {
      onMaybeLater();
    }
  });

  modal.open();

  return modal;
}
