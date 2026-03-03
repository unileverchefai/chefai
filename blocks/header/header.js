import { createElement } from '@scripts/common.js';
import { getMetadata } from '@scripts/aem.js';
import { loadFragment } from '@blocks/fragment/fragment.js';
import createProfileSection from '@helpers/nav-profile/nav-profile.js';
import { hasToken } from '@auth/tokenManager.js';
import { getUserDataFromCookie } from '@scripts/custom/utils.js';
import { logout } from '@auth/authService.js';
import { getBaseUrl, changeCountryLanguagePath } from '@scripts/custom/redirect.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 992px)');

// change background color of hamburger menu when user scrolls down 200px
const SCROLL_THRESHOLD = 200;

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
  const navModal = nav.querySelector('.nav-modal');

  document.body.style.overflowY = !expanded ? 'hidden' : '';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  const navModalOverlay = createElement('div', { className: 'nav-modal-overlay', id: 'test' });

  if (navModal) {
    if (!expanded) navModal.setAttribute('open', '');
    else navModal.removeAttribute('open');
    toggleAllNavSections(navModal, expanded || isDesktop.matches ? 'false' : 'true');
    if (isDesktop.matches && !expanded) {
      nav.prepend(navModalOverlay);
    } else {
      const navOverlay = nav.querySelector('.nav-modal-overlay');
      if (navOverlay && navOverlay.parentNode) {
        navOverlay.parentNode.removeChild(navOverlay);
      }
    }
  }

  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
  }

  navModalOverlay.addEventListener('click', () => {
    if (nav) toggleMenu(nav);
  });
}

// Create brand/logo section
const createBrand = () => {
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
  return brand;
};

// Build close button and logo header for mobile nav sections
const createNavHeader = () => {
  const navHeader = createElement('div', { className: 'nav-modal-header' });
  const brand = createBrand();

  const closeIcon = createElement('img', {
    className: 'icon',
    attributes: {
      src: '/icons/close-icon.svg',
      alt: '',
      width: '16',
      height: '16',
    },
  });

  const closeButton = createElement('button', {
    className: 'nav-modal-close',
    attributes: {
      type: 'button',
      'aria-label': 'Close navigation',
    },
    innerContent: `${closeIcon.outerHTML}<span>Close</span>`,
  });

  closeButton.addEventListener('click', () => {
    const nav = document.getElementById('nav');
    if (nav) toggleMenu(nav);
  });

  navHeader.append(closeButton, brand);
  return navHeader;
};

export async function buildNavSections(isLoggedIn, businessName) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  const navModal = createElement('div', { className: 'nav-modal' });
  const navModalBackdrop = createElement('div', { className: 'nav-modal-backdrop' });
  navModal.appendChild(navModalBackdrop);

  while (fragment.firstElementChild) {
    navModal.appendChild(fragment.firstElementChild);
  }

  const navSection = navModal.querySelector('.nav-modal .section');

  const navHeader = createNavHeader();
  const navTitle = createElement('div', {
    className: 'nav-business-name',
    innerContent: isLoggedIn ? `${businessName} Hub` : 'Future Menus 4',
  });

  navSection.prepend(navHeader, navTitle);

  const navLinks = navSection.querySelectorAll('.default-content-wrapper > *');

  navLinks.forEach((el) => {
    if (el.classList.contains('button-container')) {
      el.classList.add('nav-link');
      const aTag = el.querySelector('a');
      aTag.classList.remove('button');
    }
    const next = el.nextElementSibling;
    if (!el.classList.contains('button-container') && next?.tagName === 'UL') {
      const details = document.createElement('details');
      details.classList.add('nav-details');

      const summary = document.createElement('summary');
      summary.classList.add('nav-link');
      summary.textContent = el.textContent?.trim() ?? '';

      next.querySelectorAll('li').forEach((li) => li.classList.add('sub-link'));

      details.appendChild(summary);
      details.appendChild(next);

      el.replaceWith(details);
    }
  });

  // Toggle detail summary to open only one at a time
  const detailsList = navModal.querySelectorAll('.default-content-wrapper details');
  detailsList.forEach((details) => {
    details.addEventListener('toggle', (event) => {
      if (!event.target.open) return;
      detailsList.forEach((item) => {
        if (item !== event.target) item.open = false;
      });
    });
  });

  // Language Selector
  const languageSelectorP = [...navLinks].find((el) => el.textContent.toLowerCase().includes('languageselector'));
  const languageLinks = languageSelectorP?.querySelectorAll('a');
  const languageSelector = createElement('div', {
    className: 'language-selector',
  });

  languageLinks?.forEach((link) => {
    const languageLinkContainer = createElement('div', {
      className: `language-link ${window.location.pathname.includes(link.getAttribute('href')) && 'active'}`,
    });
    const hrefLink = changeCountryLanguagePath(link.getAttribute('href'));
    link.setAttribute('href', hrefLink);
    languageLinkContainer.append(link);
    languageSelector.append(languageLinkContainer);
  });

  languageSelectorP?.remove();

  // TODO: add click event to download pdf
  const downloadIcon = createElement('img', {
    className: 'icon',
    attributes: {
      src: '/icons/download-icon.svg',
      alt: '',
      width: '16',
      height: '16',
    },
  });

  const downdloadReport = createElement('button', {
    className: 'download-report',
    attributes: {
      type: 'button',
      'aria-label': 'Download report',
    },
    innerContent: `${downloadIcon.outerHTML}<span>Download report as PDF</span>`,
  });

  const signoutButton = createElement('button', {
    className: 'signout-button',
    attributes: {
      type: 'button',
      'aria-label': 'Sign out',
    },
    innerContent: '<span>Sign out</span>',
  });

  signoutButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    await logout();
    window.location.href = getBaseUrl();
  });

  navSection.appendChild(languageSelector);

  if (isLoggedIn) {
    navSection.append(downdloadReport, signoutButton);
  }

  return navModal;
}

export function createHamburgerMenu(nav) {
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

  for (let i = 0; i < 3; i += 1) {
    const line = createElement('span', {
      className: 'nav-hamburger-line',
    });
    hamburgerIcon.appendChild(line);
  }

  hamburgerButton.appendChild(hamburgerIcon);
  hamburger.appendChild(hamburgerButton);
  hamburger.addEventListener('click', () => toggleMenu(nav));

  return hamburger;
}

/**
 * loads and decorates the test header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  block.textContent = '';
  const isLoggedIn = hasToken();
  const userData = getUserDataFromCookie();
  const businessName = userData ? JSON.parse(userData)?.business_name : null;
  // Get campaign phase metadata (defaults to 'teaser')
  const campaignPhase = getMetadata('campaign-phase') || 'teaser';
  const isLiveMode = campaignPhase === 'live';

  const nav = createElement('nav', { attributes: { id: 'nav' } });

  const navSections = await buildNavSections(isLoggedIn, businessName);

  const hamburger = createHamburgerMenu(nav);

  // Prepend hamburger and append nav sections
  nav.prepend(hamburger);
  nav.appendChild(navSections);

  // Create elements wrapper
  const elements = createElement('div', { className: `nav-elements ${!isLiveMode ? 'nav-elements--teaser' : 'nav-elements--live'}` });
  const brand = createBrand();
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

  function onScroll() {
    if (window.scrollY >= SCROLL_THRESHOLD) {
      hamburger.classList.add('nav-onscroll');
    } else {
      hamburger.classList.remove('nav-onscroll');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  block.appendChild(navWrapper);
}
