import { createElement } from '../../scripts/common.js';
import { buildNavSections, createHamburgerMenu } from '../header/header.js';

const blockName = 'hero-header';
const blockClasses = {
  container: `${blockName}-container`,
  item_active: `${blockName}__bullet-item--active`,
};

const blockTemplate = `
  <div class="${blockName}__wrapper">
    <div class="${blockName}__background-wrapper">
    </div>
    <nav id="nav" class="${blockName}__nav" role="navigation" aria-expanded="false"></nav>
    <div class="${blockName}__content-wrapper">
    </div>
  </div>
`;

/**
 * Creates a logo anchor link that navigates to the home page
 * @returns {HTMLElement} - The anchor element containing the future menu logo (text and number)
 */
function createLogoLink() {
  return createElement('a', {
    className: `${blockName}__logo-link`,
    attributes: {
      href: '/',
      'aria-label': 'Future Menu Home',
    },
    innerContent: `
      <span class="${blockName}__logo-text"></span>
      <span class="${blockName}__logo-number"></span>
    `,
  });
}

export default async function decorate(block) {
  const header = document.querySelector('header');
  const section = block.closest('.section');
  const heroHeaderElement = createElement('header', {
    className: blockName,
    innerContent: blockTemplate,
  });
  const blockImages = block.querySelectorAll('p:has(picture)');
  const backgroundWrapper = heroHeaderElement.querySelector(
    `.${blockName}__background-wrapper`,
  );
  const [mobile, desktop] = blockImages;

  blockImages.forEach((imageContainer) => {
    imageContainer.className = `${blockName}__background-image`;
    backgroundWrapper.appendChild(imageContainer);
  });

  mobile.classList.add(`${blockName}__background-image--mobile`);
  desktop.classList.add(`${blockName}__background-image--desktop`);

  const nav = heroHeaderElement.querySelector(`.${blockName}__nav`);
  const hamburgerMenu = createHamburgerMenu(nav);
  const navSections = await buildNavSections();
  const logoLink = createLogoLink();
  const navBar = createElement('div', { className: `${blockName}__nav-bar` });
  navBar.append(hamburgerMenu, logoLink);
  nav.append(navBar, navSections);
  document.addEventListener('userDataUpdated', (event) => {
    if (!event.detail) {
      console.warn('[Hero Header] userDataUpdated event received without detail');
      return;
    }

    const { business_name: businessName = '', images } = event.detail;
    const avatarUrl = images?.logo_url || images?.image_url || '/icons/avatar.png';
    const contentWrapper = heroHeaderElement.querySelector(
      `.${blockName}__content-wrapper`,
    );

    // Build user profile row with avatar and business info
    const firstRow = createElement('div', {
      className: `${blockName}__content-row`,
      innerContent: `
        <div class="${blockName}__avatar-wrapper">
          <img src="${avatarUrl}" alt="${businessName}'s avatar" class="${blockName}__avatar-image">
        </div>
        <div class="${blockName}__text-content">
          <h1 class="${blockName}__business-name">${businessName}</h1>
          <a href="#edit-profile" class="${blockName}__edit-profile-link">Edit Profile</a>
        </div>
      `,
    });
    contentWrapper.appendChild(firstRow);

    // Build filter bullets list
    const bullets = block.querySelector(':scope > div:last-child > div > p');
    const isFirstActive = (index) => (index === 0 ? ` ${blockClasses.item_active}` : '');
    if (bullets) {
      const bulletItems = bullets.textContent
        .split(',').map((item) => item.trim()).filter((item) => item);
      const secondRow = createElement('div', {
        className: `${blockName}__content-row`,
        innerContent: `
          <ul class="${blockName}__bullets-list">
            ${bulletItems.map((item, index) => (`
              <li class="${blockName}__bullet-item${isFirstActive(index)}">
                ${item}
              </li>
          `)).join('')}
          </ul>
        `,
      });
      contentWrapper.appendChild(secondRow);

      // Add single-active click behavior to filter bullets
      const bulletItemsEls = secondRow.querySelectorAll(`.${blockName}__bullet-item`);
      bulletItemsEls.forEach((item) => {
        item.addEventListener('click', () => {
          bulletItemsEls.forEach((el) => {
            el.classList.remove(`${blockClasses.item_active}`);
          });
          item.classList.add(`${blockClasses.item_active}`);
        });
      });
    }
    block.textContent = '';
    if (header) {
      header.replaceWith(heroHeaderElement);
    } else {
      document.body.prepend(heroHeaderElement);
    }

    // Clean up empty sections
    if (
      section
      && ['section', blockClasses.container].every((cls) => section.classList.contains(cls))
      && section.classList.length === 2
    ) {
      const isBlockEmpty = !block.textContent.trim();
      if (isBlockEmpty) {
        section.remove();
      }
    }
  });
}
