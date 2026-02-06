import openSignInModal from '@helpers/signin/index.js';
import { createElement } from '@scripts/common.js';
import { loadCSS } from '@scripts/aem.js';
import { fetchBusinessInfo, fetchSneakPeek } from './fetchSneakPeek.js';

// create customHeader for sneak peek page.
// TODO: This should be a variant of the main header (future improvements)
const decorateCustomHeader = (navbar) => {
  const logo = createElement('div', {
    className: 'sneakpeek--logo-wrapper',
    innerContent: `
        <div class="sneakpeek--logo-text"></div>
        <div class="sneakpeek--logo-number"></div>
    `,
  });

  const signInButton = createElement('button', {
    className: 'nav-signin-button',
    attributes: {
      type: 'button',
      'aria-label': 'Sign in',
    },
  });

  signInButton.textContent = 'Sign in';

  signInButton.addEventListener('click', () => {
    openSignInModal();
  });

  navbar.appendChild(logo);
  navbar.appendChild(signInButton);
};

export default async function decorate(block) {
  const root = block.querySelector(':scope > div');

  const recommendationP = root.querySelector('div > p:first-of-type');

  const insightData = await fetchSneakPeek();
  const businessInfo = await fetchBusinessInfo();

  // Navbar
  const navbar = createElement('nav', { className: 'navbar' });
  decorateCustomHeader(navbar);

  // upper block containing business info and recommendation
  const upperBlock = createElement('div', { className: 'upper-block' });
  const businessBlock = createElement('div', { className: 'business-block' });
  upperBlock.appendChild(navbar);
  upperBlock.appendChild(businessBlock);

  // lower block containing insight preview
  const lowerBlock = createElement('div', { className: 'lower-block' });
  const insightBlock = createElement('div', { className: 'insight-block' });
  lowerBlock.appendChild(insightBlock);

  // Create three cards for the sneak peek insights
  for (let i = 0; i < 3; i += 1) {
    let cardPosition;
    if (i === 0) {
      cardPosition = 'left';
    } else if (i === 1) {
      cardPosition = 'center';
    } else {
      cardPosition = 'right';
    }
    const card = createElement('div', { className: `insight-card fp-card--${cardPosition}` });
    card.innerHTML = `
            <div class="insight-card-content">
                <h3>${insightData.title}</h3>
                <p>${insightData.description}</p>
            </div>
        `;
    insightBlock.appendChild(card);
  }

  // CTA. TODO: This should be a variant of the main CTA (future improvements)
  const ctaBlock = createElement('div', { className: 'floating-cta__container' });
  root.querySelector('div').querySelectorAll('p').forEach((el, index) => {
    if (index !== 0) {
      if (el.className === 'button-container') {
        const ctaContainer = createElement('div', { className: 'floating-cta__cta orange-button glowy' });
        ctaContainer.appendChild(el);
        ctaBlock.appendChild(ctaContainer);
      } else {
        ctaBlock.appendChild(el);
      }
    }
  });

  const logo = createElement('img', { className: 'business-logo' });
  logo.src = businessInfo.image_url;
  logo.alt = businessInfo.name;
  businessBlock.appendChild(logo);

  const title = createElement('h2');
  title.textContent = businessInfo.name;
  businessBlock.appendChild(title);

  const arrowLogo = createElement('img', { className: 'sneak-peek-arrow-logo' });
  arrowLogo.src = '/icons/triple-arrow-logo.svg';
  businessBlock.appendChild(arrowLogo);
  businessBlock.appendChild(recommendationP);

  // Replace block content
  block.replaceChildren(upperBlock, lowerBlock, ctaBlock);

  // Remove footer
  const footer = document.getElementsByTagName('footer')[0];
  footer.remove();

  // Remove footer
  const header = document.getElementsByTagName('header')[0];
  header.remove();

  // Add button.css for the CTA button after styles.css has been loaded otherwise specificity
  // issues will occur and the button will not be styled correctly
  // TODO: Refactor the CSS to avoid this issue in the future
  await loadCSS(`${window.hlx.codeBasePath}/styles/buttons.css`);
}
