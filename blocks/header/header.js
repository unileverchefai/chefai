import { createElement } from '@scripts/common.js';
import { getMetadata } from '@scripts/aem.js';
import { loadFragment } from '@blocks/fragment/fragment.js';
import createProfileSection from '@helpers/nav-profile/nav-profile.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 992px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    if (nav && nav.getAttribute('aria-expanded') === 'true') {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav);
    }
  }
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 */
function toggleMenu(nav) {
  const expanded = nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  const navSections = nav.querySelector('.nav-sections');

  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');

  if (navSections) {
    toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  }

  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }
}

/**
 * loads and decorates the test header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';

  // Get campaign phase metadata (defaults to 'teaser')
  const campaignPhase = getMetadata('campaign-phase') || 'teaser';
  const isLiveMode = campaignPhase === 'live';

  // Load nav fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const nav = createElement('nav', { attributes: { id: 'nav' } });

  // Add fragment content to nav sections
  const navSections = createElement('div', { className: 'nav-sections' });
  while (fragment.firstElementChild) {
    navSections.appendChild(fragment.firstElementChild);
  }

  // Decorate nav sections
  navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
    if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
    navSection.addEventListener('click', () => {
      if (isDesktop.matches) {
        const expanded = navSection.getAttribute('aria-expanded') === 'true';
        toggleAllNavSections(navSections);
        navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      }
    });
  });

  // Create hamburger menu
  const hamburger = createElement('div', {
    className: 'nav-hamburger',
  });

  const hamburgerButton = createElement('button', {
    attributes: {
      type: 'button',
      'aria-controls': 'nav',
      'aria-label': 'Open navigation',
    },
  });

  const hamburgerIcon = createElement('span', {
    className: 'nav-hamburger-icon',
  });

  // Create the three lines of the hamburger
  for (let i = 0; i < 3; i += 1) {
    const line = createElement('span', {
      className: 'nav-hamburger-line',
    });
    hamburgerIcon.appendChild(line);
  }

  hamburgerButton.appendChild(hamburgerIcon);
  hamburger.appendChild(hamburgerButton);
  hamburger.addEventListener('click', () => toggleMenu(nav));

  // Prepend hamburger and append nav sections
  nav.prepend(hamburger);
  nav.appendChild(navSections);

  // Create brand/logo section
  const brand = createElement('div', { className: 'nav-brand' });
  const brandLink = createElement('a', {
    attributes: { href: '/', 'aria-label': 'Unilever Food Solutions Home' },
  });
  const logo = createElement('img', {
    attributes: {
      src: '/icons/ufs-logo.png',
      alt: 'Unilever Food Solutions',
      width: '81',
      height: '36',
    },
  });
  brandLink.appendChild(logo);
  brand.appendChild(brandLink);

  // Create elements wrapper
  const elements = createElement('div', { className: `nav-elements ${!isLiveMode ? 'nav-elements--teaser' : 'nav-elements--live'}` });

  // Create header container with hamburger and logo (always shown)
  const headerContainer = createElement('div', { className: 'nav-header' });
  headerContainer.append(brand);

  // In teaser mode, only show hamburger and logo
  if (!isLiveMode) {
    elements.append(hamburger, headerContainer);
  } else {
    const profile = createProfileSection();
    headerContainer.append(profile);

    elements.append(hamburger, headerContainer);
  }

  // Add elements wrapper to nav (before nav sections)
  nav.insertBefore(elements, navSections);
  nav.setAttribute('aria-expanded', 'false');

  const navWrapper = createElement('div', { className: 'nav-wrapper' });
  navWrapper.appendChild(nav);
  block.appendChild(navWrapper);
}
