import { createElement } from '@scripts/common.js';
import { loadCSS } from '@scripts/aem.js';
import createProfileSection from '@helpers/nav-profile/nav-profile.js';
import { fetchBusinessInfo, fetchSneakPeek } from './fetchSneakPeek.js';

// create customHeader for sneak peek page.
// TODO: This should be a variant of the main header (future improvements)
const decorateCustomHeader = (navbar) => {
  const logo = createElement('div', {
    className: 'sneakpeek--logo-wrapper',
  });
  const logoText = createElement('div', { className: 'sneakpeek--logo-text' });
  const logoNumber = createElement('div', { className: 'sneakpeek--logo-number' });
  logo.appendChild(logoText);
  logo.appendChild(logoNumber);
  const profile = createProfileSection();

  navbar.appendChild(logo);
  navbar.appendChild(profile);
};

export default async function decorate(block) {
  const root = block.querySelector(':scope > div');

  const recommendationNumberP = root.querySelector('div > p:nth-of-type(1)');
  const recommendationLabelP = root.querySelector('div > p:nth-of-type(2)');

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
    const card = createElement('div', {
      className: `insight-card fp-card--${cardPosition}`,
      innerContent: `
        <div class="insight-card-content">
          <h3>${insightData?.title ?? ''}</h3>
          <p>${insightData?.description ?? ''}</p>
        </div>
      `,
    });
    insightBlock.appendChild(card);
  }

  // CTA. TODO: This should be a variant of the main CTA (future improvements)
  const ctaBlock = createElement('div', { className: 'floating-cta__container' });
  root.querySelector('div').querySelectorAll('p').forEach((el, index) => {
    if (index > 1) {
      const hasButton = el.querySelector('.button');
      if (hasButton) {
        const ctaContainer = createElement('div', { className: 'floating-cta__cta orange-button glowy' });
        ctaContainer.appendChild(el);
        ctaBlock.appendChild(ctaContainer);
      } else {
        ctaBlock.appendChild(el);
      }
    }
  });

  // If the CTA button uses #unlock-personalized-hub,
  // open the registration modal instead of navigating.
  const ctaButton = ctaBlock.querySelector('.button');
  const ctaHref = ctaButton?.getAttribute('href') ?? '';
  if (ctaButton && ctaHref.includes('#unlock-personalized-hub')) {
    ctaButton.addEventListener('click', async (event) => {
      event.preventDefault();
      const { default: openSignUpReportModal } = await import('@helpers/signup/signup.js');
      openSignUpReportModal();
    });
  }

  // Left wrapper: logo + title
  const leftWrapper = createElement('div', { className: 'business-block-left' });
  if (businessInfo?.image_url) {
    const logo = createElement('img', {
      className: 'business-logo',
      attributes: {
        src: businessInfo.image_url,
        alt: businessInfo.name || '',
      },
    });
    leftWrapper.appendChild(logo);
  }

  if (businessInfo?.name) {
    const title = createElement('h2');
    title.textContent = businessInfo.name;
    leftWrapper.appendChild(title);
  }
  businessBlock.appendChild(leftWrapper);

  // Middle: arrow logo
  const arrowLogo = createElement('img', {
    className: 'sneak-peek-arrow-logo',
    attributes: {
      src: '/icons/triple-arrow-logo.svg',
      alt: 'arrow icon',
    },
  });
  businessBlock.appendChild(arrowLogo);

  // Right wrapper: recommendation metric (number + label)
  const rightWrapper = createElement('div', { className: 'business-block-right' });
  if (recommendationNumberP && recommendationLabelP) {
    const numberEl = createElement('div', {
      className: 'recommendation-number',
      innerContent: (recommendationNumberP.textContent ?? '').trim(),
    });

    const textEl = createElement('div', {
      className: 'recommendation-text',
      innerContent: (recommendationLabelP.textContent ?? '').trim(),
    });

    rightWrapper.appendChild(numberEl);
    rightWrapper.appendChild(textEl);
  } else if (recommendationNumberP) {
    rightWrapper.appendChild(recommendationNumberP);
  }
  businessBlock.appendChild(rightWrapper);

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
